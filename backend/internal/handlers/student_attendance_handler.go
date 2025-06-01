package handlers

import (
	"fmt"
	"net/http"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// StudentAttendanceHandler handles attendance-related HTTP requests for students
type StudentAttendanceHandler struct {
	attendanceService *services.AttendanceService
	scheduleService   *services.CourseScheduleService
	db                *gorm.DB
}

// NewStudentAttendanceHandler creates a new student attendance handler
func NewStudentAttendanceHandler() *StudentAttendanceHandler {
	return &StudentAttendanceHandler{
		attendanceService: services.NewAttendanceService(),
		scheduleService:   services.NewCourseScheduleService(),
		db:                database.GetDB(),
	}
}

// GetActiveAttendanceSessions gets all active attendance sessions for a student's schedule
func (h *StudentAttendanceHandler) GetActiveAttendanceSessions(c *gin.Context) {
	// Extract student ID from the authenticated user
	userID := c.MustGet("userID").(uint)

	// Log the request for debugging
	fmt.Printf("Getting active attendance sessions for user ID=%d\n", userID)

	// Get student's course schedules
	schedules, err := h.scheduleService.GetStudentSchedules(userID)
	if err != nil {
		fmt.Printf("Error getting student schedules for user ID=%d: %v\n", userID, err)
		// Return empty list instead of error
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{},
		})
		return
	}

	// Log how many schedules were found
	fmt.Printf("Found %d schedules for user ID=%d\n", len(schedules), userID)

	// If no schedules found, return empty list
	if len(schedules) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{},
		})
		return
	}

	// Get active attendance sessions for these schedules
	var activeSessions []map[string]interface{}

	// Extract schedule IDs
	var scheduleIDs []uint
	for _, schedule := range schedules {
		scheduleIDs = append(scheduleIDs, schedule.ID)
	}

	// Log schedule IDs for debugging
	fmt.Printf("Checking for active sessions for schedule IDs: %v\n", scheduleIDs)

	// Get active sessions for these schedules and include student attendance check
	sessions, err := h.attendanceService.GetActiveSessionsBySchedules(scheduleIDs, userID)
	if err != nil {
		fmt.Printf("Error getting active sessions for schedules %v: %v\n", scheduleIDs, err)
		// Return empty list instead of error
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{},
		})
		return
	}

	// Log how many active sessions were found
	fmt.Printf("Found %d active sessions for schedules %v\n", len(sessions), scheduleIDs)

	// Map sessions to response format
	for _, session := range sessions {
		// Check if CourseSchedule and related objects are loaded
		if session.CourseSchedule.ID == 0 || session.CourseSchedule.Course.ID == 0 || session.CourseSchedule.Room.ID == 0 {
			fmt.Printf("Warning: Session %d has incomplete related data\n", session.ID)
			continue
		}

		activeSessions = append(activeSessions, map[string]interface{}{
			"id":                 session.ID,
			"course_schedule_id": session.CourseScheduleID,
			"lecturer_id":        session.LecturerID,
			"date":               session.Date.Format("2006-01-02"),
			"start_time":         session.StartTime.Format("15:04"),
			"type":               session.Type,
			"status":             session.Status,
			"course_code":        session.CourseSchedule.Course.Code,
			"course_name":        session.CourseSchedule.Course.Name,
			"room_name":          session.CourseSchedule.Room.Name,
			"building_name":      session.CourseSchedule.Room.Building.Name,
			"already_attended":   session.AlreadyAttended,
		})
	}

	// Return the active sessions
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   activeSessions,
	})
}

// SubmitQRAttendance handles QR code scanned attendance submission from mobile app
func (h *StudentAttendanceHandler) SubmitQRAttendance(c *gin.Context) {
	// Extract student ID from the authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse request body
	var req struct {
		SessionID          uint   `json:"session_id" binding:"required"`
		ScheduleID         uint   `json:"schedule_id"` // Optional, used for verification
		VerificationMethod string `json:"verification_method" binding:"required"`
		QRData             string `json:"qr_data"`
		Timestamp          string `json:"timestamp"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid request format",
		})
		return
	}

	// Log the request
	fmt.Printf("QR attendance submission received - User: %d, Session: %d, Schedule: %d, Method: %s\n",
		userID, req.SessionID, req.ScheduleID, req.VerificationMethod)

	// Ensure the verification method is QR_CODE
	if req.VerificationMethod != "QR_CODE" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid verification method, expected QR_CODE",
		})
		return
	}

	// If schedule ID is provided, verify that the session belongs to this schedule
	if req.ScheduleID > 0 {
		// Check if this session belongs to the specified schedule
		var isValidSession bool
		err := h.db.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM attendance_sessions
				WHERE id = ? AND course_schedule_id = ?
			) as is_valid_session`,
			req.SessionID, req.ScheduleID).Scan(&isValidSession).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  "Failed to validate session",
			})
			return
		}

		if !isValidSession {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error",
				"error":  "QR code tidak sesuai dengan jadwal yang dipilih",
			})
			return
		}
	}

	// Call the service to record attendance directly using the external user ID
	err := h.attendanceService.MarkStudentAttendanceByExternalID(
		req.SessionID,
		userID,
		models.StudentAttendanceStatusPresent,
		req.QRData,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Attendance recorded successfully",
	})
}

// CheckAttendanceStatus checks if a student has already attended a particular session
func (h *StudentAttendanceHandler) CheckAttendanceStatus(c *gin.Context) {
	// Extract student ID from the authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse request body
	var req struct {
		SessionID  uint `json:"session_id" binding:"required"`
		ScheduleID uint `json:"schedule_id"` // Optional, used for verification
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid request format",
		})
		return
	}

	// Log the request
	fmt.Printf("Checking attendance status for User: %d, Session: %d, Schedule: %d\n",
		userID, req.SessionID, req.ScheduleID)

	// First, verify if the session exists
	session, err := h.attendanceService.GetAttendanceSessionByID(req.SessionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Attendance session not found",
		})
		return
	}

	// If schedule ID is provided, verify that the session belongs to this schedule
	if req.ScheduleID > 0 && session.CourseScheduleID != req.ScheduleID {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Session does not match the provided schedule",
		})
		return
	}

	// Get the student's record from the external user ID
	var student models.Student
	if err := h.db.Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Student record not found",
		})
		return
	}

	// Check if the student has already attended this session
	var attendanceRecord models.StudentAttendance
	result := h.db.Where("attendance_session_id = ? AND student_id = ?", req.SessionID, student.ID).
		First(&attendanceRecord)

	hasAttended := false

	if result.Error == nil {
		// Check if the status is PRESENT or LATE (which means they have attended)
		hasAttended = (attendanceRecord.Status == models.StudentAttendanceStatusPresent ||
			attendanceRecord.Status == models.StudentAttendanceStatusLate)
	}

	// Return the attendance status
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"session_id":    req.SessionID,
			"schedule_id":   session.CourseScheduleID,
			"student_id":    student.ID,
			"has_attended":  hasAttended,
			"status":        attendanceRecord.Status,
			"check_in_time": attendanceRecord.CheckInTime,
		},
	})
}
