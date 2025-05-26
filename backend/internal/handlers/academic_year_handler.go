package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// AcademicYearHandler handles HTTP requests related to academic years
type AcademicYearHandler struct {
	service *services.AcademicYearService
}

// NewAcademicYearHandler creates a new academic year handler
func NewAcademicYearHandler() *AcademicYearHandler {
	return &AcademicYearHandler{
		service: services.NewAcademicYearService(),
	}
}

// GetAllAcademicYears returns all academic years
func (h *AcademicYearHandler) GetAllAcademicYears(c *gin.Context) {
	stats := c.Query("stats")
	var result interface{}
	var err error

	if stats == "true" {
		result, err = h.service.GetAllAcademicYearsWithStats()
	} else {
		result, err = h.service.GetAllAcademicYears()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Academic years retrieved successfully",
		"data":    result,
	})
}

// GetAcademicYearByID returns an academic year by ID
func (h *AcademicYearHandler) GetAcademicYearByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	academicYear, err := h.service.GetAcademicYearByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if academicYear == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Academic year not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Academic year retrieved successfully",
		"data":    academicYear,
	})
}

// CreateAcademicYear creates a new academic year
func (h *AcademicYearHandler) CreateAcademicYear(c *gin.Context) {
	var academicYear models.AcademicYear

	if err := c.ShouldBindJSON(&academicYear); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.service.CreateAcademicYear(&academicYear); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Academic year created successfully",
		"data":    academicYear,
	})
}

// UpdateAcademicYear updates an academic year
func (h *AcademicYearHandler) UpdateAcademicYear(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var academicYear models.AcademicYear
	if err := c.ShouldBindJSON(&academicYear); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	academicYear.ID = uint(id)

	if err := h.service.UpdateAcademicYear(&academicYear); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Academic year updated successfully",
		"data":    academicYear,
	})
}

// DeleteAcademicYear deletes an academic year
func (h *AcademicYearHandler) DeleteAcademicYear(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteAcademicYear(uint(id)); err != nil {
		// Check if the error is about dependencies (courses, assignments, etc.)
		if strings.Contains(err.Error(), "cannot delete academic year: it is being used by") {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Academic year deleted successfully",
	})
}