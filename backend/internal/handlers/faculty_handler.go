package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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
		"message": "Fakultas berhasil diambil",
		"data":    result,
	})
}

// GetFacultyByID returns a faculty by ID
func (h *FacultyHandler) GetFacultyByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format ID tidak valid"})
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
		c.JSON(http.StatusNotFound, gin.H{"error": "Fakultas tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Fakultas berhasil diambil",
		"data":    result,
	})
}

// CreateFaculty creates a new faculty
func (h *FacultyHandler) CreateFaculty(c *gin.Context) {
	var faculty models.Faculty

	if err := c.ShouldBindJSON(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
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
		"message": "Fakultas berhasil dibuat",
		"data":    faculty,
	})
}

// UpdateFaculty updates an existing faculty
func (h *FacultyHandler) UpdateFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format ID tidak valid"})
		return
	}

	var faculty models.Faculty
	if err := c.ShouldBindJSON(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid"})
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
		"message": "Fakultas berhasil diperbarui",
		"data":    faculty,
	})
}

// DeleteFaculty deletes a faculty
func (h *FacultyHandler) DeleteFaculty(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Format ID tidak valid",
		})
		return
	}

	err = h.service.DeleteFaculty(uint(id))
	if err != nil {
		// Handle different types of errors with appropriate status codes
		if errors.Is(err, gorm.ErrRecordNotFound) || strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  "Fakultas tidak ditemukan",
			})
			return
		} else if strings.Contains(err.Error(), "associated study programs") {
			c.JSON(http.StatusConflict, gin.H{
				"status": "error",
				"error":  "Tidak dapat menghapus fakultas yang memiliki program studi. Harap hapus semua program studi terlebih dahulu.",
			})
			return
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  err.Error(),
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Fakultas berhasil dihapus",
	})
} 