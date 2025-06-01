package handlers

import (
	"fmt"
	"net/http"
	"time"

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

	// Get active sessions for these schedules
	sessions, err := h.attendanceService.GetActiveSessionsBySchedules(scheduleIDs)
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

// GetStudentAttendanceHistory gets a student's attendance history
func (h *StudentAttendanceHandler) GetStudentAttendanceHistory(c *gin.Context) {
	// Extract student ID from the authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse query params for filtering
	academicYearID := c.Query("academic_year_id")
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	// Log the request
	fmt.Printf("Getting attendance history for user ID=%d, academicYear=%s\n", userID, academicYearID)

	// Find the student record associated with this user
	var student models.Student
	if err := h.db.Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Student record not found",
		})
		return
	}

	// Build the query to get attendance history
	query := h.db.Table("student_attendances AS sa").
		Select(`
			sa.id, sa.status, sa.check_in_time, sa.verification_method, 
			sa.notes, asession.date, asession.start_time, asession.end_time, 
			cs.id AS course_schedule_id, c.id AS course_id, c.code AS course_code, 
			c.name AS course_name, r.name AS room_name, b.name AS building_name,
			l.id AS lecturer_id, l.full_name AS lecturer_name
		`).
		Joins("JOIN attendance_sessions AS asession ON sa.attendance_session_id = asession.id").
		Joins("JOIN course_schedules AS cs ON asession.course_schedule_id = cs.id").
		Joins("JOIN courses AS c ON cs.course_id = c.id").
		Joins("JOIN rooms AS r ON cs.room_id = r.id").
		Joins("JOIN buildings AS b ON r.building_id = b.id").
		Joins("JOIN lecturers AS l ON asession.lecturer_id = l.id").
		Where("sa.student_id = ?", student.ID).
		Order("asession.date DESC, asession.start_time DESC")

	// Apply filters if provided
	if academicYearID != "" {
		query = query.Where("cs.academic_year_id = ?", academicYearID)
	}

	if startDateStr != "" {
		startDate, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			query = query.Where("asession.date >= ?", startDate)
		}
	}

	if endDateStr != "" {
		endDate, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			query = query.Where("asession.date <= ?", endDate)
		}
	}

	// Execute the query
	var results []map[string]interface{}
	if err := query.Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to retrieve attendance history",
		})
		return
	}

	// Format the response
	var attendanceHistory []map[string]interface{}
	for _, result := range results {
		// Format dates for easier consumption in mobile app
		checkInTime := result["check_in_time"]
		formattedCheckInTime := ""
		if checkInTime != nil {
			if t, ok := checkInTime.(time.Time); ok {
				formattedCheckInTime = t.Format("15:04:05")
			}
		}

		sessionDate := result["date"]
		formattedDate := ""
		if d, ok := sessionDate.(time.Time); ok {
			formattedDate = d.Format("2006-01-02")
		}

		sessionStartTime := result["start_time"]
		formattedStartTime := ""
		if t, ok := sessionStartTime.(time.Time); ok {
			formattedStartTime = t.Format("15:04")
		}

		sessionEndTime := result["end_time"]
		formattedEndTime := ""
		if t, ok := sessionEndTime.(time.Time); ok {
			formattedEndTime = t.Format("15:04")
		}

		attendanceHistory = append(attendanceHistory, map[string]interface{}{
			"id":                  result["id"],
			"status":              result["status"],
			"date":                formattedDate,
			"session_start_time":  formattedStartTime,
			"session_end_time":    formattedEndTime,
			"check_in_time":       formattedCheckInTime,
			"verification_method": result["verification_method"],
			"course_id":           result["course_id"],
			"course_code":         result["course_code"],
			"course_name":         result["course_name"],
			"room_name":           result["room_name"],
			"building_name":       result["building_name"],
			"lecturer_name":       result["lecturer_name"],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   attendanceHistory,
	})
}

// GetTodayAttendanceHistory gets a student's attendance history for today
func (h *StudentAttendanceHandler) GetTodayAttendanceHistory(c *gin.Context) {
	// Extract student ID from the authenticated user
	userID := c.MustGet("userID").(uint)

	// Get today's date in the server's timezone
	today := time.Now().Format("2006-01-02")

	// Log the request
	fmt.Printf("Getting today's attendance history for user ID=%d, date=%s\n", userID, today)

	// Find the student record associated with this user
	var student models.Student
	if err := h.db.Where("user_id = ?", userID).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Student record not found",
		})
		return
	}

	// Build the query to get attendance history for today
	query := h.db.Table("student_attendances AS sa").
		Select(`
			sa.id, sa.status, sa.check_in_time, sa.verification_method, 
			sa.notes, asession.date, asession.start_time, asession.end_time, 
			cs.id AS course_schedule_id, c.id AS course_id, c.code AS course_code, 
			c.name AS course_name, r.name AS room_name, b.name AS building_name,
			l.id AS lecturer_id, l.full_name AS lecturer_name
		`).
		Joins("JOIN attendance_sessions AS asession ON sa.attendance_session_id = asession.id").
		Joins("JOIN course_schedules AS cs ON asession.course_schedule_id = cs.id").
		Joins("JOIN courses AS c ON cs.course_id = c.id").
		Joins("JOIN rooms AS r ON cs.room_id = r.id").
		Joins("JOIN buildings AS b ON r.building_id = b.id").
		Joins("JOIN lecturers AS l ON asession.lecturer_id = l.id").
		Where("sa.student_id = ? AND DATE(asession.date) = ?", student.ID, today).
		Order("asession.start_time DESC")

	// Execute the query
	var results []map[string]interface{}
	if err := query.Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to retrieve today's attendance history",
		})
		return
	}

	// Format the response
	var todayAttendanceHistory []map[string]interface{}
	for _, result := range results {
		// Format times for easier consumption in mobile app
		checkInTime := result["check_in_time"]
		formattedCheckInTime := ""
		if checkInTime != nil {
			if t, ok := checkInTime.(time.Time); ok {
				formattedCheckInTime = t.Format("15:04:05")
			}
		}

		sessionStartTime := result["start_time"]
		formattedStartTime := ""
		if t, ok := sessionStartTime.(time.Time); ok {
			formattedStartTime = t.Format("15:04")
		}

		sessionEndTime := result["end_time"]
		formattedEndTime := ""
		if t, ok := sessionEndTime.(time.Time); ok {
			formattedEndTime = t.Format("15:04")
		}

		todayAttendanceHistory = append(todayAttendanceHistory, map[string]interface{}{
			"id":                  result["id"],
			"status":              result["status"],
			"session_start_time":  formattedStartTime,
			"session_end_time":    formattedEndTime,
			"check_in_time":       formattedCheckInTime,
			"verification_method": result["verification_method"],
			"course_id":           result["course_id"],
			"course_code":         result["course_code"],
			"course_name":         result["course_name"],
			"room_name":           result["room_name"],
			"building_name":       result["building_name"],
			"lecturer_name":       result["lecturer_name"],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   todayAttendanceHistory,
	})
}
