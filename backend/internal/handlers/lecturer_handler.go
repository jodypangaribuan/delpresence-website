package handlers

import (
	"net/http"
	"strconv"

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
	// Get campus token from header
	token := c.GetHeader("Authorization")
	if token == "" {
		// Try to get token from cookie
		token, _ = c.Cookie("campus_token")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No campus token provided"})
			return
		}
	} else {
		// Remove "Bearer " prefix if present
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}
	}

	// Sync lecturers
	count, err := h.service.SyncLecturers(token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync lecturers: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lecturers synced successfully",
		"count":   count,
	})
} 