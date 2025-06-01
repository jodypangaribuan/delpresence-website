package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// TeachingAssistantAttendanceHandler handles attendance-related API requests from teaching assistants
type TeachingAssistantAttendanceHandler struct {
	attendanceService *services.AttendanceService
}

// NewTeachingAssistantAttendanceHandler creates a new attendance handler for teaching assistants
func NewTeachingAssistantAttendanceHandler() *TeachingAssistantAttendanceHandler {
	return &TeachingAssistantAttendanceHandler{
		attendanceService: services.NewAttendanceService(),
	}
}

// CreateAttendanceSession creates a new attendance session for a course schedule
func (h *TeachingAssistantAttendanceHandler) CreateAttendanceSession(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse request
	var req struct {
		CourseScheduleID uint                   `json:"course_schedule_id"`
		Type             string                 `json:"type"`
		Date             string                 `json:"date"`
		Settings         map[string]interface{} `json:"settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid request body",
		})
		return
	}

	// Convert date string to time.Time
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid date format, use YYYY-MM-DD",
		})
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
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid attendance type",
		})
		return
	}

	// Create the session
	session, err := h.attendanceService.CreateAttendanceSession(userID, req.CourseScheduleID, date, attendanceType, req.Settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Get the response format
	response, err := h.attendanceService.GetSessionDetails(session.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Session created but error retrieving details",
		})
		return
	}

	// Return the session details
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   response,
	})
}

// GetActiveAttendanceSessions gets all active attendance sessions for the authenticated assistant
func (h *TeachingAssistantAttendanceHandler) GetActiveAttendanceSessions(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Get active sessions using the new function that supports TAs
	sessions, err := h.attendanceService.GetActiveSessionsForUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get active sessions",
		})
		return
	}

	// Return sessions
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   sessions,
	})
}

// GetAttendanceSessions gets attendance sessions for the authenticated assistant
func (h *TeachingAssistantAttendanceHandler) GetAttendanceSessions(c *gin.Context) {
	// Extract assistant ID from authenticated user
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
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid start_date format, use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid end_date format, use YYYY-MM-DD",
		})
		return
	}

	// Set end time to end of day
	endDate = endDate.Add(24*time.Hour - time.Second)

	// Get sessions (now supports teaching assistants properly)
	sessions, err := h.attendanceService.GetSessionsByDateRange(userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return sessions
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   sessions,
	})
}

// GetAttendanceSessionDetails gets detailed information for a specific attendance session
func (h *TeachingAssistantAttendanceHandler) GetAttendanceSessionDetails(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Get session details
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return session details
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   session,
	})
}

// CloseAttendanceSession closes an active attendance session
func (h *TeachingAssistantAttendanceHandler) CloseAttendanceSession(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Close the session
	if err := h.attendanceService.CloseAttendanceSession(uint(sessionID), userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Attendance session closed successfully",
	})
}

// GetStudentAttendances gets student attendance records for a session
func (h *TeachingAssistantAttendanceHandler) GetStudentAttendances(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Get student attendances
	attendances, err := h.attendanceService.GetStudentAttendances(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return student attendances
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   attendances,
	})
}

// MarkStudentAttendance marks a student's attendance for a session
func (h *TeachingAssistantAttendanceHandler) MarkStudentAttendance(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID and student ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	studentID, err := strconv.ParseUint(c.Param("studentId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid student ID",
		})
		return
	}

	// Parse request
	var req struct {
		Status             string `json:"status"`
		Notes              string `json:"notes"`
		VerificationMethod string `json:"verification_method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid request body",
		})
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
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid attendance status",
		})
		return
	}

	// Mark student attendance
	if err := h.attendanceService.MarkStudentAttendance(uint(sessionID), uint(studentID), status, req.VerificationMethod, req.Notes, &userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Student attendance marked successfully",
	})
}

// GetQRCode generates a QR code for an attendance session
func (h *TeachingAssistantAttendanceHandler) GetQRCode(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Get session to verify ownership
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Check if the session uses QR code
	if session.Type != "QR Code" && session.Type != "Keduanya" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "This session does not use QR code",
		})
		return
	}

	// Return QR code URL
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": map[string]interface{}{
			"qr_code_url": "/api/attendance/qr-code/" + strconv.FormatUint(sessionID, 10),
		},
	})
}
