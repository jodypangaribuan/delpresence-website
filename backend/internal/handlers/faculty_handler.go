package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// FacultyHandler handles HTTP requests related to faculties
type FacultyHandler struct {
	service *services.FacultyService
}

// NewFacultyHandler creates a new faculty handler
func NewFacultyHandler() *FacultyHandler {
	return &FacultyHandler{
		service: services.NewFacultyService(),
	}
}

// GetAllFaculties returns all faculties
func (h *FacultyHandler) GetAllFaculties(c *gin.Context) {
	stats := c.Query("stats")
	var result interface{}
	var err error

	if stats == "true" {
		result, err = h.service.GetAllFacultiesWithStats()
	} else {
		result, err = h.service.GetAllFaculties()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Faculties retrieved successfully",
		"data":    result,
	})
}

// GetFacultyByID returns a faculty by ID
func (h *FacultyHandler) GetFacultyByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	stats := c.Query("stats")
	var result interface{}

	if stats == "true" {
		result, err = h.service.GetFacultyWithStats(uint(id))
	} else {
		result, err = h.service.GetFacultyByID(uint(id))
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Faculty not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Faculty retrieved successfully",
		"data":    result,
	})
}

// CreateFaculty creates a new faculty
func (h *FacultyHandler) CreateFaculty(c *gin.Context) {
	var faculty models.Faculty

	if err := c.ShouldBindJSON(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Ensure lecturer_count is properly set
	if faculty.LecturerCount < 0 {
		faculty.LecturerCount = 0
	}

	if err := h.service.CreateFaculty(&faculty); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Faculty created successfully",
		"data":    faculty,
	})
}

// UpdateFaculty updates an existing faculty
func (h *FacultyHandler) UpdateFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var faculty models.Faculty
	if err := c.ShouldBindJSON(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Ensure lecturer_count is properly set
	if faculty.LecturerCount < 0 {
		faculty.LecturerCount = 0
	}

	faculty.ID = uint(id)
	if err := h.service.UpdateFaculty(&faculty); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Faculty updated successfully",
		"data":    faculty,
	})
}

// DeleteFaculty deletes a faculty
func (h *FacultyHandler) DeleteFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteFaculty(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Faculty deleted successfully",
	})
} 