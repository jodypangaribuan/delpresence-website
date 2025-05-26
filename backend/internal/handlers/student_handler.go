package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// StudentHandler handles HTTP requests related to students
type StudentHandler struct {
	service *services.StudentService
}

// NewStudentHandler creates a new student handler
func NewStudentHandler() *StudentHandler {
	return &StudentHandler{
		service: services.NewStudentService(),
	}
}

// GetAllStudents returns all students
func (h *StudentHandler) GetAllStudents(c *gin.Context) {
	students, err := h.service.GetAllStudents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Students retrieved successfully",
		"data":    students,
	})
}

// GetStudentByID returns a student by ID
func (h *StudentHandler) GetStudentByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	student, err := h.service.GetStudentByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Student retrieved successfully",
		"data":    student,
	})
}

// GetStudentByUserID returns a student by their user ID from the campus system
func (h *StudentHandler) GetStudentByUserID(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	student, err := h.service.GetStudentByUserID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	if student == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Student retrieved successfully",
		"data":    student,
	})
}

// SyncStudents syncs students from the campus API
func (h *StudentHandler) SyncStudents(c *gin.Context) {
	// Sync students using the service
	count, err := h.service.SyncStudents()
	if err != nil {
		errMsg := err.Error()
		statusCode := http.StatusInternalServerError
		responseMsg := "Failed to sync students"

		// Check for specific errors to provide better messages
		if strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "deadline exceeded") {
			statusCode = http.StatusGatewayTimeout
			responseMsg = "Connection to campus API timed out"
		} else if strings.Contains(errMsg, "connection refused") {
			statusCode = http.StatusServiceUnavailable
			responseMsg = "Campus API service unavailable"
		}

		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": responseMsg,
			"error":   errMsg,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Students synced successfully",
		"data": gin.H{
			"count": count,
		},
	})
}
