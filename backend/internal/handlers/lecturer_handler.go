package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// LecturerHandler handles lecturer-related requests
type LecturerHandler struct {
	service *services.LecturerService
}

// NewLecturerHandler creates a new LecturerHandler
func NewLecturerHandler() *LecturerHandler {
	return &LecturerHandler{
		service: services.NewLecturerService(),
	}
}

// GetAllLecturers returns all lecturers
func (h *LecturerHandler) GetAllLecturers(c *gin.Context) {
	lecturers, err := h.service.GetAllLecturers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get lecturers"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": lecturers})
}

// GetLecturerByID returns a lecturer by ID
func (h *LecturerHandler) GetLecturerByID(c *gin.Context) {
	// Parse ID from URL
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Get lecturer
	lecturer, err := h.service.GetLecturerByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get lecturer"})
		return
	}

	if lecturer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lecturer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": lecturer})
}

// SyncLecturers syncs lecturers from the campus API
func (h *LecturerHandler) SyncLecturers(c *gin.Context) {
	// Sync lecturers using the service (which now handles authentication internally)
	count, err := h.service.SyncLecturers()
	if err != nil {
		// Determine a more specific error message and status code
		statusCode := http.StatusInternalServerError
		errorMsg := err.Error()
		
		// Check for authentication errors
		if strings.Contains(errorMsg, "authentication failed") || 
		   strings.Contains(errorMsg, "token") {
			statusCode = http.StatusUnauthorized
			errorMsg = "Failed to authenticate with campus API: " + errorMsg
		} else if strings.Contains(errorMsg, "network error") || 
		          strings.Contains(errorMsg, "timeout") {
			errorMsg = "Network error when connecting to campus API: " + errorMsg
		} else if strings.Contains(errorMsg, "unmarshal") || 
		          strings.Contains(errorMsg, "parse") {
			errorMsg = "Error processing campus API response: " + errorMsg
		}
		
		c.JSON(statusCode, gin.H{"error": errorMsg})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lecturers synced successfully",
		"count":   count,
	})
} 