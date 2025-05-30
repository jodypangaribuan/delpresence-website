package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// AttendanceHandler handles attendance-related API requests
type AttendanceHandler struct {
	attendanceService *services.AttendanceService
}

// NewAttendanceHandler creates a new attendance handler
func NewAttendanceHandler() *AttendanceHandler {
	return &AttendanceHandler{
		attendanceService: services.NewAttendanceService(),
	}
}

// CreateAttendanceSession creates a new attendance session for a course schedule
func (h *AttendanceHandler) CreateAttendanceSession(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse request
	var req struct {
		CourseScheduleID uint                   `json:"course_schedule_id"`
		Type             string                 `json:"type"`
		Date             string                 `json:"date"`
		Settings         map[string]interface{} `json:"settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Convert date string to time.Time
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	// Convert string type to enum
	var attendanceType models.AttendanceType
	switch req.Type {
	case "QR_CODE":
		attendanceType = models.AttendanceTypeQRCode
	case "FACE_RECOGNITION":
		attendanceType = models.AttendanceTypeFaceRecognition
	case "MANUAL":
		attendanceType = models.AttendanceTypeManual
	case "BOTH":
		attendanceType = models.AttendanceTypeBoth
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attendance type"})
		return
	}

	// Create the session
	session, err := h.attendanceService.CreateAttendanceSession(userID, req.CourseScheduleID, date, attendanceType, req.Settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the response format
	response, err := h.attendanceService.GetSessionDetails(session.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Session created but error retrieving details"})
		return
	}

	// Return the session details
	c.JSON(http.StatusOK, response)
}

// GetActiveAttendanceSessions gets all active attendance sessions for the authenticated lecturer
func (h *AttendanceHandler) GetActiveAttendanceSessions(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in token"})
		return
	}

	// Convert to appropriate type
	var userIDInt int
	switch v := userID.(type) {
	case float64:
		userIDInt = int(v)
	case int:
		userIDInt = v
	case uint:
		userIDInt = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
			return
		}
		userIDInt = id
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type"})
		return
	}

	// Debug log
	fmt.Printf("Getting active attendance sessions for userID=%d\n", userIDInt)

	// Get active sessions
	sessions, err := h.attendanceService.GetActiveSessionsForLecturer(uint(userIDInt))
	if err != nil {
		// Try alternative approaches
		fmt.Printf("Error getting active sessions directly: %v\n", err)

		// Try to get lecturer first
		lecturerRepo := repositories.NewLecturerRepository()
		lecturer, err := lecturerRepo.GetByUserID(userIDInt)
		if err == nil && lecturer.ID > 0 {
			fmt.Printf("Found lecturer, trying with lecturer.UserID=%d\n", lecturer.UserID)
			sessions, err = h.attendanceService.GetActiveSessionsForLecturer(uint(lecturer.UserID))
		}

		// If still no sessions, try with lecturer assignments
		if (err != nil || len(sessions) == 0) && lecturer.ID > 0 {
			fmt.Printf("Still no sessions found, checking assignments\n")
			assignmentRepo := repositories.NewLecturerAssignmentRepository()
			assignments, err := assignmentRepo.GetByLecturerID(lecturer.UserID, 0)
			if err == nil && len(assignments) > 0 {
				fmt.Printf("Found %d assignments\n", len(assignments))
				// Try to get sessions for these courses
				for _, assignment := range assignments {
					courseSessions, err := h.attendanceService.GetActiveSessionsByCourse(assignment.CourseID)
					if err == nil {
						sessions = append(sessions, courseSessions...)
					}
				}
			}
		}
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Found %d active sessions\n", len(sessions))

	// Return sessions
	c.JSON(http.StatusOK, sessions)
}

// GetAttendanceSessions gets attendance sessions for the authenticated lecturer within a date range
func (h *AttendanceHandler) GetAttendanceSessions(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse query parameters
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	// Default to today if not provided
	if startDateStr == "" {
		startDateStr = time.Now().Format("2006-01-02")
	}
	if endDateStr == "" {
		endDateStr = time.Now().Format("2006-01-02")
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format, use YYYY-MM-DD"})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format, use YYYY-MM-DD"})
		return
	}

	// Set end time to end of day
	endDate = endDate.Add(24*time.Hour - time.Second)

	// Get sessions
	sessions, err := h.attendanceService.GetSessionsByDateRange(userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return sessions
	c.JSON(http.StatusOK, sessions)
}

// GetAttendanceSessionDetails gets detailed information for a specific attendance session
func (h *AttendanceHandler) GetAttendanceSessionDetails(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Get session details
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Return session details
	c.JSON(http.StatusOK, session)
}

// CloseAttendanceSession closes an active attendance session
func (h *AttendanceHandler) CloseAttendanceSession(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Close the session
	if err := h.attendanceService.CloseAttendanceSession(uint(sessionID), userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{"message": "Attendance session closed successfully"})
}

// CancelAttendanceSession cancels an active attendance session
func (h *AttendanceHandler) CancelAttendanceSession(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Cancel the session
	if err := h.attendanceService.CancelAttendanceSession(uint(sessionID), userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{"message": "Attendance session canceled successfully"})
}

// GetStudentAttendances gets all student attendance records for a session
func (h *AttendanceHandler) GetStudentAttendances(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Get student attendances
	attendances, err := h.attendanceService.GetStudentAttendances(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return student attendances
	c.JSON(http.StatusOK, attendances)
}

// MarkStudentAttendance marks a student's attendance for a session
func (h *AttendanceHandler) MarkStudentAttendance(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID and student ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	studentID, err := strconv.ParseUint(c.Param("studentId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid student ID"})
		return
	}

	// Parse request
	var req struct {
		Status             string `json:"status"`
		Notes              string `json:"notes"`
		VerificationMethod string `json:"verification_method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Convert string status to enum
	var status models.StudentAttendanceStatus
	switch req.Status {
	case "PRESENT":
		status = models.StudentAttendanceStatusPresent
	case "LATE":
		status = models.StudentAttendanceStatusLate
	case "ABSENT":
		status = models.StudentAttendanceStatusAbsent
	case "EXCUSED":
		status = models.StudentAttendanceStatusExcused
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid attendance status"})
		return
	}

	// Mark student attendance
	if err := h.attendanceService.MarkStudentAttendance(uint(sessionID), uint(studentID), status, req.VerificationMethod, req.Notes, &userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{"message": "Student attendance marked successfully"})
}

// GetAttendanceStatistics gets attendance statistics for a course schedule
func (h *AttendanceHandler) GetAttendanceStatistics(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract course schedule ID from URL
	courseScheduleID, err := strconv.ParseUint(c.Param("courseScheduleId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid course schedule ID"})
		return
	}

	// Get attendance statistics
	stats, err := h.attendanceService.GetAttendanceStatistics(uint(courseScheduleID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Return statistics
	c.JSON(http.StatusOK, stats)
}

// GetQRCode generates a QR code for an attendance session
func (h *AttendanceHandler) GetQRCode(c *gin.Context) {
	// Extract lecturer ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Get session details to verify ownership and retrieve QR code data
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Simple text representation for demo purposes
	// In a real implementation, this would generate an actual QR code image
	c.Header("Content-Type", "text/plain")
	c.String(http.StatusOK, "QR Code for Session %d\nCourse: %s - %s\nTime: %s",
		session.ID, session.CourseCode, session.CourseName, session.StartTime)
}
