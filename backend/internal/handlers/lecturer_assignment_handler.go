package handlers

import (
	"fmt"
	"net/http"
	"sort"
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
		UserID         int  `json:"user_id" binding:"required"`
		CourseID       uint `json:"course_id" binding:"required"`
		AcademicYearID uint `json:"academic_year_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid input: " + err.Error(),
		})
		return
	}

	// Set default academic year if not provided
	if input.AcademicYearID == 0 {
		// Try to get active academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		
		if err == nil && activeYear != nil {
			input.AcademicYearID = activeYear.ID
		} else {
			// If no active year, get the most recent one
			academicYears, err := academicYearRepo.FindAll()
			if err == nil && len(academicYears) > 0 {
				// Sort by ID descending to get the most recent one
				sort.Slice(academicYears, func(i, j int) bool {
					return academicYears[i].ID > academicYears[j].ID
				})
				input.AcademicYearID = academicYears[0].ID
			} else {
				// If still no academic year, use ID 1 as fallback
				input.AcademicYearID = 1
			}
		}
	}

	// Check if an assignment already exists for this lecturer and course (without academic year constraint)
	exists, err := h.repo.AssignmentExistsForCourse(input.UserID, input.CourseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to check if assignment exists: " + err.Error(),
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"status":  "error",
			"message": "This lecturer is already assigned to this course",
		})
		return
	}

	// Validate that we have either a valid lecturer user_id or a direct lecturer ID
	actualUserID := input.UserID // Default to using the provided user_id
	
	lecturerRepo := repositories.NewLecturerRepository()
	
	// First try to get lecturer by user_id
	lecturer, err := lecturerRepo.GetByUserID(input.UserID)
	if err != nil || lecturer.ID == 0 {
		// If not found by user_id, try by lecturer.ID directly
		lecturer, err = lecturerRepo.GetByID(uint(input.UserID))
		if err != nil || lecturer.ID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid lecturer ID - no lecturer found with this ID",
			})
			return
		}
		
		// If found by ID, use the actual user_id from the lecturer record
		if lecturer.UserID > 0 {
			actualUserID = lecturer.UserID
			fmt.Printf("Using lecturer's user_id %d instead of direct ID %d\n", actualUserID, input.UserID)
		}
	}

	courseRepo := repositories.NewCourseRepository()
	course, err := courseRepo.GetByID(input.CourseID)
	if err != nil || course.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid course ID",
		})
		return
	}

	// Create the assignment with the proper user_id
	assignment := models.LecturerAssignment{
		UserID:         actualUserID,
		CourseID:       input.CourseID,
		AcademicYearID: input.AcademicYearID,
	}

	err = h.repo.Create(&assignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to create assignment: " + err.Error(),
		})
		return
	}

	// Get the detailed response
	response, err := h.repo.GetLecturerAssignmentResponseByID(assignment.ID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Lecturer assignment created successfully",
			"data":    assignment,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lecturer assignment created successfully",
		"data":    response,
	})
}

// GetAllLecturerAssignments returns all lecturer assignments
func (h *LecturerAssignmentHandler) GetAllLecturerAssignments(c *gin.Context) {
	// Get academic year ID from query parameter, if provided
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearIDUint uint = 0

	if academicYearIDStr != "" && academicYearIDStr != "all" {
		academicYearID, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearIDUint = uint(academicYearID)
	}

	// Get assignments with detailed responses
	responses, err := h.repo.GetLecturerAssignmentResponses(academicYearIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get lecturer assignments: " + err.Error(),
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid ID",
		})
		return
	}

	response, err := h.repo.GetLecturerAssignmentResponseByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get lecturer assignment: " + err.Error(),
		})
		return
	}

	if response == nil || response.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Lecturer assignment not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   response,
	})
}

// UpdateLecturerAssignment updates a lecturer assignment
func (h *LecturerAssignmentHandler) UpdateLecturerAssignment(c *gin.Context) {
	id := c.Param("id")
	fmt.Printf("\n==== Starting UpdateLecturerAssignment for ID: %s ====\n", id)
	
	// Convert ID to uint
	assignmentID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid ID",
		})
		return
	}

	// Get existing assignment
	existingAssignment, err := h.repo.GetByID(uint(assignmentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to retrieve existing assignment: " + err.Error(),
		})
		return
	}

	if existingAssignment.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Lecturer assignment not found",
		})
		return
	}

	// Store the original values for later comparison
	originalUserID := existingAssignment.UserID
	originalCourseID := existingAssignment.CourseID
	// Note: We're storing original values only for fields we need to compare

	// Parse input data
	var input struct {
		UserID         int  `json:"user_id"`
		CourseID       uint `json:"course_id"`
		AcademicYearID uint `json:"academic_year_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid input: " + err.Error(),
		})
		return
	}

	// Check for conflicts only if changing user_id or course_id
	if (input.UserID != 0 && input.UserID != existingAssignment.UserID) ||
		(input.CourseID != 0 && input.CourseID != existingAssignment.CourseID) {
		
		// Determine which values to check against
		userIDToCheck := existingAssignment.UserID
		if input.UserID != 0 {
			userIDToCheck = input.UserID
		}
		
		courseIDToCheck := existingAssignment.CourseID
		if input.CourseID != 0 {
			courseIDToCheck = input.CourseID
		}
		
		// Check if another assignment already exists with the new values (ignoring academic year)
		exists, err := h.repo.AssignmentExistsForCourse(userIDToCheck, courseIDToCheck)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Failed to check for conflicts: " + err.Error(),
			})
			return
		}
		
		// If another assignment exists and it's not the current one, return conflict
		if exists {
			// Check if it's the current assignment
			currentExists, err := h.repo.AssignmentExistsForCourse(existingAssignment.UserID, existingAssignment.CourseID)
			if err != nil || !currentExists || 
			   (input.UserID != 0 && input.UserID != existingAssignment.UserID) ||
			   (input.CourseID != 0 && input.CourseID != existingAssignment.CourseID) {
				c.JSON(http.StatusConflict, gin.H{
					"status":  "error",
					"message": "Another lecturer is already assigned to this course",
				})
				return
			}
		}
	}
	
	if input.UserID != 0 {
		// Validate that we have either a valid lecturer user_id or a direct lecturer ID
		actualUserID := input.UserID // Default to using the provided user_id
		
		lecturerRepo := repositories.NewLecturerRepository()
		
		// First try to get lecturer by user_id
		lecturer, err := lecturerRepo.GetByUserID(input.UserID)
		if err != nil || lecturer.ID == 0 {
			// If not found by user_id, try by lecturer.ID directly
			lecturer, err = lecturerRepo.GetByID(uint(input.UserID))
			if err != nil || lecturer.ID == 0 {
				c.JSON(http.StatusBadRequest, gin.H{
					"status":  "error",
					"message": "Invalid lecturer ID - no lecturer found with this ID",
				})
				return
			}
			
			// If found by ID, use the actual user_id from the lecturer record
			if lecturer.UserID > 0 {
				actualUserID = lecturer.UserID
				fmt.Printf("Using lecturer's user_id %d instead of direct ID %d\n", actualUserID, input.UserID)
			}
		}
		
		existingAssignment.UserID = actualUserID
	}

	if input.CourseID != 0 {
		// Validate course
		courseRepo := repositories.NewCourseRepository()
		course, err := courseRepo.GetByID(input.CourseID)
		if err != nil || course.ID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid course ID",
			})
			return
		}
		existingAssignment.CourseID = input.CourseID
	}

	// Only update academic year if explicitly provided
	if input.AcademicYearID != 0 {
		// Validate academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		academicYear, err := academicYearRepo.FindByID(input.AcademicYearID)
		if err != nil || academicYear == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		existingAssignment.AcademicYearID = input.AcademicYearID
	}

	// Update the assignment
	err = h.repo.Update(&existingAssignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to update assignment: " + err.Error(),
		})
		return
	}

	// If the lecturer has changed, update related course schedules
	if existingAssignment.UserID != originalUserID && 
	   existingAssignment.CourseID == originalCourseID {
		
		// Update all schedules for this course to use the new lecturer
		scheduleRepo := repositories.NewCourseScheduleRepository()
		updateErr := scheduleRepo.UpdateSchedulesForCourse(
			existingAssignment.CourseID, 
			uint(existingAssignment.UserID))
		
		if updateErr != nil {
			// Log the error but continue - don't fail the whole operation
			fmt.Printf("Warning: Failed to update related course schedules: %v\n", updateErr)
		} else {
			fmt.Printf("Successfully updated related course schedules for course_id=%d to use lecturer_id=%d\n", 
				existingAssignment.CourseID, existingAssignment.UserID)
		}
	}

	// Get the refreshed assignment with details
	refreshedAssignment, err := h.repo.GetByID(uint(assignmentID))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Lecturer assignment updated successfully",
			"data":    existingAssignment,
		})
		return
	}

	// Get formatted response
	formattedResponse, err := h.repo.GetLecturerAssignmentResponseByID(refreshedAssignment.ID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Lecturer assignment updated successfully",
			"data":    refreshedAssignment,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lecturer assignment updated successfully",
		"data":    formattedResponse,
	})
	
	fmt.Printf("==== End of UpdateLecturerAssignment for ID: %s ====\n\n", id)
}

// DeleteLecturerAssignment deletes a lecturer assignment
func (h *LecturerAssignmentHandler) DeleteLecturerAssignment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid ID",
		})
		return
	}

	// Verify that the assignment exists
	assignment, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to retrieve assignment: " + err.Error(),
		})
		return
	}

	if assignment.ID == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Lecturer assignment not found",
		})
		return
	}

	// Delete the assignment
	err = h.repo.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to delete assignment: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Lecturer assignment deleted successfully",
	})
}

// GetAssignmentsByLecturer returns all assignments for a specific lecturer
func (h *LecturerAssignmentHandler) GetAssignmentsByLecturer(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid lecturer ID",
		})
		return
	}

	// Get academic year ID from query parameter, if provided
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearID uint = 0

	if academicYearIDStr != "" && academicYearIDStr != "all" {
		academicYearIDUint, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearID = uint(academicYearIDUint)
	}

	// Get assignments for the lecturer
	assignments, err := h.repo.GetByLecturerID(int(id), academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get assignments: " + err.Error(),
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
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid course ID",
		})
		return
	}

	// Get academic year ID from query parameter, if provided
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearID uint = 0

	if academicYearIDStr != "" && academicYearIDStr != "all" {
		academicYearIDUint, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearID = uint(academicYearIDUint)
	}

	// If no academic year specified, try to get the active one
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err == nil && activeYear != nil {
			academicYearID = activeYear.ID
		}
	}

	// Get assignments for the course
	assignments, err := h.repo.GetByCourseID(uint(id), academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get assignments: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   assignments,
	})
}

// GetAvailableLecturers returns all lecturers available for assignment to a course
func (h *LecturerAssignmentHandler) GetAvailableLecturers(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid course ID",
		})
		return
	}

	// Get academic year ID from query parameter, if provided
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearID uint = 0

	if academicYearIDStr != "" {
		academicYearIDUint, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearID = uint(academicYearIDUint)
	}

	// If no academic year specified, try to get any academic year
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		
		// Get all academic years and use the most recent one if available
		academicYears, err := academicYearRepo.FindAll()
		if err == nil && len(academicYears) > 0 {
			// Sort by ID descending to get the most recent one
			sort.Slice(academicYears, func(i, j int) bool {
				return academicYears[i].ID > academicYears[j].ID
			})
			
			academicYearID = academicYears[0].ID
		}
		
		// Even if we don't find an academic year, continue with ID=0
		// This will make the repository return lecturers without academic year filtering
	}

	// Get available lecturers
	lecturers, err := h.repo.GetAvailableLecturers(uint(courseID), academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get available lecturers: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   lecturers,
	})
}

// GetMyAssignments returns assignments for the current lecturer
func (h *LecturerAssignmentHandler) GetMyAssignments(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "User not authenticated",
		})
		return
	}

	// Get external user ID (lecturer ID in the external system) or use userID as fallback
	externalUserID, exists := c.Get("external_user_id")
	if !exists || externalUserID == nil {
		// Use userID as fallback
		externalUserID = userID
	}

	// Convert external user ID to int
	var lecturerUserID int
	switch v := externalUserID.(type) {
	case int:
		lecturerUserID = v
	case int64:
		lecturerUserID = int(v)
	case float64:
		lecturerUserID = int(v)
	case uint:
		lecturerUserID = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid lecturer ID",
			})
			return
		}
		lecturerUserID = id
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid lecturer ID type",
		})
		return
	}

	// Get academic year ID from query parameter, if provided
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearID uint = 0

	if academicYearIDStr != "" && academicYearIDStr != "all" {
		academicYearIDUint, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearID = uint(academicYearIDUint)
	}

	// If no academic year specified, try to get the active one
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err == nil && activeYear != nil {
			academicYearID = activeYear.ID
		}
	}

	// Get assignments for the lecturer
	assignments, err := h.repo.GetByLecturerID(lecturerUserID, academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get assignments: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   assignments,
	})
} 