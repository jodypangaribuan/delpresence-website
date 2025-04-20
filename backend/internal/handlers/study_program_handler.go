package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// StudyProgramHandler handles HTTP requests related to study programs
type StudyProgramHandler struct {
	service *services.StudyProgramService
}

// NewStudyProgramHandler creates a new study program handler
func NewStudyProgramHandler() *StudyProgramHandler {
	return &StudyProgramHandler{
		service: services.NewStudyProgramService(),
	}
}

// GetAllStudyPrograms returns all study programs
func (h *StudyProgramHandler) GetAllStudyPrograms(c *gin.Context) {
	stats := c.Query("stats")
	facultyID := c.Query("faculty_id")
	
	var result interface{}
	var err error

	// Filter by faculty if provided
	if facultyID != "" {
		id, err := strconv.ParseUint(facultyID, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid faculty ID format"})
			return
		}
		
		result, err = h.service.GetStudyProgramsByFacultyID(uint(id))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else if stats == "true" {
		result, err = h.service.GetAllStudyProgramsWithStats()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		result, err = h.service.GetAllStudyPrograms()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Study programs retrieved successfully",
		"data":    result,
	})
}

// GetStudyProgramByID returns a study program by ID
func (h *StudyProgramHandler) GetStudyProgramByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	stats := c.Query("stats")
	var result interface{}

	if stats == "true" {
		result, err = h.service.GetStudyProgramWithStats(uint(id))
	} else {
		result, err = h.service.GetStudyProgramByID(uint(id))
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Study program not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Study program retrieved successfully",
		"data":    result,
	})
}

// CreateStudyProgram creates a new study program
func (h *StudyProgramHandler) CreateStudyProgram(c *gin.Context) {
	var program models.StudyProgram

	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Ensure lecturer_count and student_count are properly set
	if program.LecturerCount < 0 {
		program.LecturerCount = 0
	}
	if program.StudentCount < 0 {
		program.StudentCount = 0
	}

	if err := h.service.CreateStudyProgram(&program); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Study program created successfully",
		"data":    program,
	})
}

// UpdateStudyProgram updates a study program
func (h *StudyProgramHandler) UpdateStudyProgram(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var program models.StudyProgram
	if err := c.ShouldBindJSON(&program); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Ensure lecturer_count and student_count are properly set
	if program.LecturerCount < 0 {
		program.LecturerCount = 0
	}
	if program.StudentCount < 0 {
		program.StudentCount = 0
	}

	program.ID = uint(id)
	if err := h.service.UpdateStudyProgram(&program); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Study program updated successfully",
		"data":    program,
	})
}

// DeleteStudyProgram deletes a study program
func (h *StudyProgramHandler) DeleteStudyProgram(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteStudyProgram(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Study program deleted successfully",
	})
} 