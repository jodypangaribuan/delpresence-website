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
		// Get any available academic year
		academicYearRepo := repositories.NewAcademicYearRepository()
		// Get the most recent one
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

	// Check if an assignment already exists for this lecturer and course (without academic year constraint)
	exists, err := h.repo.AssignmentExistsForCourse(input.UserID, input.CourseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal memeriksa penugasan yang ada: " + err.Error(),
		})
		return
	}

	// Check if any lecturer is already assigned to this course
	existingAssignments, err := h.repo.GetByCourseID(input.CourseID, input.AcademicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal memeriksa penugasan yang ada: " + err.Error(),
		})
		return
	}

	if len(existingAssignments) > 0 {
		c.JSON(http.StatusConflict, gin.H{
			"status":  "error",
			"message": "Tidak dapat menugaskan dosen: Satu mata kuliah hanya dapat ditugaskan kepada satu dosen. Hapus penugasan dosen yang ada terlebih dahulu.",
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"status":  "error",
			"message": "Dosen ini sudah ditugaskan untuk mata kuliah ini",
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
			"message": "ID mata kuliah tidak valid",
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
			"message": "Penugasan dosen berhasil dibuat",
			"data":    assignment,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Penugasan dosen berhasil dibuat",
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
					"message": "Dosen lain sudah ditugaskan untuk mata kuliah ini",
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
					"message": "ID dosen tidak valid - tidak ditemukan dosen dengan ID ini",
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
				"message": "ID mata kuliah tidak valid",
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
	if existingAssignment.UserID != originalUserID {
		// Update all schedules for this course to use the new lecturer, filtered by academic year
		scheduleRepo := repositories.NewCourseScheduleRepository()
		updateErr := scheduleRepo.UpdateSchedulesForCourseInAcademicYear(
			existingAssignment.CourseID, 
			existingAssignment.AcademicYearID,
			uint(existingAssignment.UserID))
		
		if updateErr != nil {
			// Log the error but continue - don't fail the whole operation
			fmt.Printf("Warning: Failed to update related course schedules for academic year %d: %v\n", 
				existingAssignment.AcademicYearID, updateErr)
		} else {
			fmt.Printf("Successfully updated related course schedules for course_id=%d, academic_year_id=%d to use lecturer_id=%d\n", 
				existingAssignment.CourseID, existingAssignment.AcademicYearID, existingAssignment.UserID)
		}
	}

	// If the course has changed (this is a rare case), clean up old schedules or update them
	if existingAssignment.CourseID != originalCourseID && originalCourseID != 0 {
		// Get the original assignments if any exist for the new combination
		assignments, err := h.repo.GetByCourseID(existingAssignment.CourseID, existingAssignment.AcademicYearID)
		
		// If there are other assignments for this course in this academic year, use that lecturer instead
		if err == nil && len(assignments) > 0 {
			// Find an assignment that's not the current one
			var otherAssignment models.LecturerAssignment
			for _, a := range assignments {
				if a.ID != existingAssignment.ID {
					otherAssignment = a
					break
				}
			}
			
			// If we found another assignment, update schedules to use that lecturer
			if otherAssignment.ID != 0 {
				scheduleRepo := repositories.NewCourseScheduleRepository()
				updateErr := scheduleRepo.UpdateSchedulesForCourseInAcademicYear(
					originalCourseID, 
					existingAssignment.AcademicYearID,
					uint(otherAssignment.UserID))
				
				if updateErr != nil {
					fmt.Printf("Warning: Failed to update related course schedules for previous course: %v\n", updateErr)
				} else {
					fmt.Printf("Successfully updated schedules for previous course_id=%d to use alternative lecturer_id=%d\n", 
						originalCourseID, otherAssignment.UserID)
				}
			}
		}
	}

	// Get the refreshed assignment with details
	refreshedAssignment, err := h.repo.GetByID(uint(assignmentID))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Penugasan dosen berhasil diperbarui",
			"data":    existingAssignment,
		})
		return
	}

	// Get formatted response
	formattedResponse, err := h.repo.GetLecturerAssignmentResponseByID(refreshedAssignment.ID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"message": "Penugasan dosen berhasil diperbarui",
			"data":    refreshedAssignment,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Penugasan dosen berhasil diperbarui",
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
	
	// Before deleting, store the course ID, academic year ID and user ID for schedule updates
	courseID := assignment.CourseID
	academicYearID := assignment.AcademicYearID
	userID := assignment.UserID
	
	// Check if there are any other lecturer assignments for this course in this academic year
	assignments, err := h.repo.GetByCourseID(courseID, academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to check other assignments: " + err.Error(),
		})
		return
	}
	
	// Count other assignments excluding the one being deleted
	var otherAssignmentCount int = 0
	var alternativeLecturerID int = 0
	for _, otherAssignment := range assignments {
		if otherAssignment.ID != uint(id) {
			otherAssignmentCount++
			alternativeLecturerID = otherAssignment.UserID
			break
		}
	}

	// Check if there are any course schedules associated with this lecturer and course
	scheduleRepo := repositories.NewCourseScheduleRepository()
	schedules, err := scheduleRepo.GetByCourseAndAcademicYear(courseID, academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to check for associated schedules: " + err.Error(),
		})
		return
	}

	// If there are schedules and this is the only lecturer assignment, prevent deletion
	if len(schedules) > 0 && otherAssignmentCount == 0 {
		c.JSON(http.StatusConflict, gin.H{
			"status":  "error",
			"message": "Tidak dapat menghapus penugasan: Masih terdapat jadwal perkuliahan yang terkait dengan dosen ini. Silakan hapus jadwal terlebih dahulu atau tugaskan dosen lain untuk mata kuliah ini.",
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
	
	// After deleting the assignment, update course schedules if needed
	// If there are other assignments for this course, update schedules to use one of those lecturers
	if otherAssignmentCount > 0 && alternativeLecturerID != 0 {
		// Check if there are any schedules with this lecturer
		lecturerSchedules, err := scheduleRepo.GetByLecturerAndAcademicYear(uint(userID), academicYearID)
		if err == nil && len(lecturerSchedules) > 0 {
			// Update these schedules to use the alternative lecturer
			updateErr := scheduleRepo.UpdateSchedulesForCourseInAcademicYear(
				courseID, 
				academicYearID,
				uint(alternativeLecturerID))
			
			if updateErr != nil {
				fmt.Printf("Warning: Failed to update schedules with alternative lecturer after deletion: %v\n", updateErr)
			} else {
				fmt.Printf("Successfully updated schedules to use alternative lecturer_id=%d after deletion\n", 
					alternativeLecturerID)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Penugasan dosen berhasil dihapus",
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

	// If no academic year specified, try to get any available one
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		// Get all academic years and use the most recent one
		academicYears, err := academicYearRepo.FindAll()
		if err == nil && len(academicYears) > 0 {
			// Sort by ID descending to get the most recent one
			sort.Slice(academicYears, func(i, j int) bool {
				return academicYears[i].ID > academicYears[j].ID
			})
			academicYearID = academicYears[0].ID
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

	// If no academic year specified, try to get any available one
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		// Get all academic years and use the most recent one
		academicYears, err := academicYearRepo.FindAll()
		if err == nil && len(academicYears) > 0 {
			// Sort by ID descending to get the most recent one
			sort.Slice(academicYears, func(i, j int) bool {
				return academicYears[i].ID > academicYears[j].ID
			})
			academicYearID = academicYears[0].ID
		}
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

	// First, look up the lecturer record in the database to get the correct user_id to filter by
	lecturerRepo := repositories.NewLecturerRepository()
	
	// Convert the userID from context to the expected type
	var userIDInt int
	switch v := userID.(type) {
	case int:
		userIDInt = v
	case int64:
		userIDInt = int(v)
	case float64:
		userIDInt = int(v)
	case uint:
		userIDInt = int(v)
	case string:
		id, err := strconv.Atoi(v)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid user ID format",
			})
			return
		}
		userIDInt = id
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid user ID type",
		})
		return
	}
	
	// Get the lecturer by userID from authentication
	lecturer, err := lecturerRepo.GetByUserID(userIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Lecturer not found: " + err.Error(),
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

	// If no academic year specified, try to get any available one
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		// Get all academic years and use the most recent one
		academicYears, err := academicYearRepo.FindAll()
		if err == nil && len(academicYears) > 0 {
			// Sort by ID descending to get the most recent one
			sort.Slice(academicYears, func(i, j int) bool {
				return academicYears[i].ID > academicYears[j].ID
			})
			academicYearID = academicYears[0].ID
		}
	}

	// Use the lecturer's UserID from the database to get assignments
	assignments, err := h.repo.GetByLecturerID(lecturer.UserID, academicYearID)
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