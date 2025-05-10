package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/gin-gonic/gin"
)

type LecturerAssignmentHandler struct {
	repo *repositories.LecturerAssignmentRepository
}

func NewLecturerAssignmentHandler() *LecturerAssignmentHandler {
	return &LecturerAssignmentHandler{
		repo: repositories.NewLecturerAssignmentRepository(),
	}
}

// CreateLecturerAssignment creates a new lecturer assignment
func (h *LecturerAssignmentHandler) CreateLecturerAssignment(c *gin.Context) {
	var input struct {
		UserID        uint `json:"user_id" binding:"required"`
		CourseID      uint `json:"course_id" binding:"required"`
		AcademicYearID uint `json:"academic_year_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid input: " + err.Error(),
		})
		return
	}

	// Validate that the lecturer exists
	lecturerRepo := repositories.NewLecturerRepository()
	lecturer, err := lecturerRepo.GetByUserID(input.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to verify lecturer: " + err.Error(),
		})
		return
	}

	if lecturer.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Lecturer not found with the provided UserID",
		})
		return
	}

	// Check if the assignment already exists
	exists, err := h.repo.AssignmentExists(input.UserID, input.CourseID, input.AcademicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to check for existing assignment: " + err.Error(),
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"status": "error",
			"error":  "Lecturer is already assigned to this course in the selected academic year",
		})
		return
	}

	assignment := models.LecturerAssignment{
		UserID:        input.UserID,
		CourseID:      input.CourseID,
		AcademicYearID: input.AcademicYearID,
	}

	if err := h.repo.Create(&assignment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to create assignment: " + err.Error(),
		})
		return
	}

	// Get the complete assignment with relationships
	createdAssignment, err := h.repo.GetByID(assignment.ID)
	if err != nil {
		// Just log the error but don't fail the request
		c.JSON(http.StatusCreated, gin.H{
			"status": "success",
			"data":   assignment,
			"message": "Assignment created successfully, but failed to load complete details",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"data":   createdAssignment,
	})
}

// GetAllLecturerAssignments returns all lecturer assignments
func (h *LecturerAssignmentHandler) GetAllLecturerAssignments(c *gin.Context) {
	// Check for academic year filter
	academicYearID := c.Query("academic_year_id")
	var academicYearIDUint uint = 0

	if academicYearID != "" {
		academicYearIDParsed, err := strconv.ParseUint(academicYearID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error",
				"error":  "Invalid academic year ID format",
			})
			return
		}
		academicYearIDUint = uint(academicYearIDParsed)
	}

	// If no academic year ID was provided, use the active one
	if academicYearIDUint == 0 {
		// Get active academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  "Failed to get active academic year: " + err.Error(),
			})
			return
		}

		if activeYear == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  "No active academic year found",
			})
			return
		}

		academicYearIDUint = activeYear.ID
	}

	// Get detailed assignment information directly
	responses, err := h.repo.GetLecturerAssignmentResponses(academicYearIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get assignment details: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   responses,
	})
}

// GetLecturerAssignmentByID returns a specific lecturer assignment
func (h *LecturerAssignmentHandler) GetLecturerAssignmentByID(c *gin.Context) {
	id := c.Param("id")
	idUint, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid ID format: " + err.Error(),
		})
		return
	}

	assignment, err := h.repo.GetByID(uint(idUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get assignment: " + err.Error(),
		})
		return
	}

	if assignment.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Assignment not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   assignment,
	})
}

// UpdateLecturerAssignment updates a lecturer assignment
func (h *LecturerAssignmentHandler) UpdateLecturerAssignment(c *gin.Context) {
	id := c.Param("id")
	idUint, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid ID format: " + err.Error(),
		})
		return
	}

	var input struct {
		UserID        uint `json:"user_id" binding:"required"`
		CourseID      uint `json:"course_id" binding:"required"`
		AcademicYearID uint `json:"academic_year_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid input: " + err.Error(),
		})
		return
	}

	// Validate that the lecturer exists
	lecturerRepo := repositories.NewLecturerRepository()
	lecturer, err := lecturerRepo.GetByUserID(input.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to verify lecturer: " + err.Error(),
		})
		return
	}

	if lecturer.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Lecturer not found with the provided UserID",
		})
		return
	}

	// Get the existing assignment
	existingAssignment, err := h.repo.GetByID(uint(idUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get existing assignment: " + err.Error(),
		})
		return
	}

	if existingAssignment.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Assignment not found",
		})
		return
	}

	// Check if the assignment already exists (only if something changed)
	if existingAssignment.UserID != input.UserID || 
	   existingAssignment.CourseID != input.CourseID || 
	   existingAssignment.AcademicYearID != input.AcademicYearID {
		
		exists, err := h.repo.AssignmentExists(input.UserID, input.CourseID, input.AcademicYearID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  "Failed to check for existing assignment: " + err.Error(),
			})
			return
		}

		if exists {
			c.JSON(http.StatusConflict, gin.H{
				"status": "error",
				"error":  "Lecturer is already assigned to this course in the selected academic year",
			})
			return
		}
	}

	// Update the assignment
	existingAssignment.UserID = input.UserID
	existingAssignment.CourseID = input.CourseID
	existingAssignment.AcademicYearID = input.AcademicYearID

	if err := h.repo.Update(&existingAssignment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to update assignment: " + err.Error(),
		})
		return
	}

	// Get the updated assignment with relationships
	updatedAssignment, err := h.repo.GetByID(existingAssignment.ID)
	if err != nil {
		// Just log the error but don't fail the request
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   existingAssignment,
			"message": "Assignment updated successfully, but failed to load complete details",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   updatedAssignment,
	})
}

// DeleteLecturerAssignment deletes a lecturer assignment
func (h *LecturerAssignmentHandler) DeleteLecturerAssignment(c *gin.Context) {
	id := c.Param("id")
	idUint, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid ID format: " + err.Error(),
		})
		return
	}

	// Check if the assignment exists
	assignment, err := h.repo.GetByID(uint(idUint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get assignment: " + err.Error(),
		})
		return
	}

	if assignment.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"error":  "Assignment not found",
		})
		return
	}

	if err := h.repo.Delete(uint(idUint)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to delete assignment: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Assignment deleted successfully",
	})
}

// GetAssignmentsByLecturer returns all assignments for a specific lecturer
func (h *LecturerAssignmentHandler) GetAssignmentsByLecturer(c *gin.Context) {
	lecturerID := c.Param("lecturer_id")
	lecturerIDUint, err := strconv.ParseUint(lecturerID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid lecturer ID format: " + err.Error(),
		})
		return
	}
	
	// Get academic year ID (optional)
	academicYearID := c.Query("academic_year_id")
	var academicYearIDUint uint = 0
	
	if academicYearID != "" {
		academicYearIDParsed, err := strconv.ParseUint(academicYearID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error",
				"error":  "Invalid academic year ID format",
			})
			return
		}
		academicYearIDUint = uint(academicYearIDParsed)
	}
	
	// If no academic year ID was provided, use the active one
	if academicYearIDUint == 0 {
		// Get active academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  "Failed to get active academic year: " + err.Error(),
			})
			return
		}
		
		if activeYear == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  "No active academic year found",
			})
			return
		}
		
		academicYearIDUint = activeYear.ID
	}
	
	// Get assignment data with preloaded relationships
	assignments, err := h.repo.GetByLecturerID(uint(lecturerIDUint), academicYearIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get assignments: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   assignments,
	})
}

// GetAssignmentsByCourse returns all assignments for a specific course
func (h *LecturerAssignmentHandler) GetAssignmentsByCourse(c *gin.Context) {
	courseID := c.Param("course_id")
	courseIDUint, err := strconv.ParseUint(courseID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid course ID format: " + err.Error(),
		})
		return
	}
	
	// Get academic year ID (optional)
	academicYearID := c.Query("academic_year_id")
	var academicYearIDUint uint = 0
	
	if academicYearID != "" {
		academicYearIDParsed, err := strconv.ParseUint(academicYearID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error",
				"error":  "Invalid academic year ID format",
			})
			return
		}
		academicYearIDUint = uint(academicYearIDParsed)
	}
	
	// If no academic year ID was provided, use the active one
	if academicYearIDUint == 0 {
		// Get active academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  "Failed to get active academic year: " + err.Error(),
			})
			return
		}
		
		if activeYear == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  "No active academic year found",
			})
			return
		}
		
		academicYearIDUint = activeYear.ID
	}
	
	// Get assignment data with preloaded relationships
	assignments, err := h.repo.GetByCourseID(uint(courseIDUint), academicYearIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get assignments: " + err.Error(),
		})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   assignments,
	})
}

// GetAvailableLecturers returns lecturers who are not assigned to the specified course in an academic year
func (h *LecturerAssignmentHandler) GetAvailableLecturers(c *gin.Context) {
	courseID := c.Param("course_id")
	courseIDUint, err := strconv.ParseUint(courseID, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"error":  "Invalid course ID format: " + err.Error(),
		})
		return
	}

	// Extract academic year ID from query params or use the active one
	academicYearID := c.Query("academic_year_id")
	var academicYearIDUint uint = 0

	if academicYearID != "" {
		academicYearIDParsed, err := strconv.ParseUint(academicYearID, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error",
				"error":  "Invalid academic year ID format",
			})
			return
		}
		academicYearIDUint = uint(academicYearIDParsed)
	}

	// If no academic year ID was provided, use the active one
	if academicYearIDUint == 0 {
		// Get active academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status": "error",
				"error":  "Failed to get active academic year: " + err.Error(),
			})
			return
		}

		if activeYear == nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status": "error",
				"error":  "No active academic year found",
			})
			return
		}

		academicYearIDUint = activeYear.ID
	}

	// Get the available lecturers
	lecturers, err := h.repo.GetAvailableLecturers(uint(courseIDUint), academicYearIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"error":  "Failed to get available lecturers: " + err.Error(),
		})
		return
	}

	// Prepare the response with detailed lecturer information
	type lecturerResponse struct {
		ID             uint   `json:"id"`
		UserID         int    `json:"user_id"`
		FullName       string `json:"full_name"`
		NIP            string `json:"nip"`
		NIDN           string `json:"nidn"`
		Email          string `json:"email"`
		StudyProgramID uint   `json:"study_program_id"`
		StudyProgram   string `json:"study_program"`
	}

	var response []lecturerResponse
	for _, lecturer := range lecturers {
		response = append(response, lecturerResponse{
			ID:             lecturer.ID,
			UserID:         lecturer.UserID,
			FullName:       lecturer.FullName,
			NIP:            lecturer.NIP,
			NIDN:           lecturer.NIDN,
			Email:          lecturer.Email,
			StudyProgramID: lecturer.StudyProgramID,
			StudyProgram:   lecturer.StudyProgramName,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   response,
	})
} 