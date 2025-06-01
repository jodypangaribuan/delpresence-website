package handlers

import (
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"

	"log"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

type TeachingAssistantAssignmentHandler struct {
	repo *repositories.TeachingAssistantAssignmentRepository
}

func NewTeachingAssistantAssignmentHandler() *TeachingAssistantAssignmentHandler {
	return &TeachingAssistantAssignmentHandler{
		repo: repositories.NewTeachingAssistantAssignmentRepository(),
	}
}

// CreateTeachingAssistantAssignment creates a new teaching assistant assignment
func (h *TeachingAssistantAssignmentHandler) CreateTeachingAssistantAssignment(c *gin.Context) {
	var input struct {
		EmployeeID     uint `json:"employee_id" binding:"required"`
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

	// Get the lecturer ID from the token (the logged-in user who is making the assignment)
	userID, exists := c.Get("userID") // Changed from user_id to userID to match middleware
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "User ID not found in token",
		})
		return
	}

	// Debug the userID value
	log.Printf("CreateTeachingAssistantAssignment userID: %v, type: %T", userID, userID)

	// Convert userID to uint regardless of its original type
	var userIDUint uint
	switch v := userID.(type) {
	case float64:
		userIDUint = uint(v)
	case float32:
		userIDUint = uint(v)
	case int:
		userIDUint = uint(v)
	case int64:
		userIDUint = uint(v)
	case uint:
		userIDUint = v
	case uint64:
		userIDUint = uint(v)
	case string:
		uintVal, err := strconv.ParseUint(v, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid user ID format",
			})
			return
		}
		userIDUint = uint(uintVal)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid user ID type",
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

	// Get the employee to extract user_id
	employeeRepo := repositories.NewEmployeeRepository()
	employee, err := employeeRepo.FindByID(input.EmployeeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal menemukan data employee: " + err.Error(),
		})
		return
	}

	// Check if an assignment already exists for this teaching assistant and course
	exists, err = h.repo.AssignmentExistsForCourse(employee.UserID, input.CourseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal memeriksa penugasan yang ada: " + err.Error(),
		})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{
			"status":  "error",
			"message": "Asisten dosen sudah ditugaskan pada mata kuliah ini",
		})
		return
	}

	// Create the assignment
	assignment := models.TeachingAssistantAssignment{
		UserID:         employee.UserID, // Use UserID from employee
		CourseID:       input.CourseID,
		AcademicYearID: input.AcademicYearID,
		AssignedByID:   userIDUint, // Use our extracted userID value
	}

	result, err := h.repo.Create(assignment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat penugasan asisten dosen: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Penugasan asisten dosen berhasil dibuat",
		"data":    result,
	})
}

// GetAllTeachingAssistantAssignments returns all teaching assistant assignments
func (h *TeachingAssistantAssignmentHandler) GetAllTeachingAssistantAssignments(c *gin.Context) {
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

	// Get detailed assignments
	assignments, err := h.repo.GetTeachingAssistantAssignmentResponses(academicYearID)
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

// GetTeachingAssistantAssignmentByID returns a specific teaching assistant assignment
func (h *TeachingAssistantAssignmentHandler) GetTeachingAssistantAssignmentByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid assignment ID",
		})
		return
	}

	assignment, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Assignment not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   assignment,
	})
}

// DeleteTeachingAssistantAssignment deletes a teaching assistant assignment
func (h *TeachingAssistantAssignmentHandler) DeleteTeachingAssistantAssignment(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid assignment ID",
		})
		return
	}

	log.Printf("Attempting to delete teaching assistant assignment with ID: %d", id)

	// Check if the assignment exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		log.Printf("Error getting teaching assistant assignment: %v", err)
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Assignment not found",
		})
		return
	}

	// Delete the assignment
	err = h.repo.Delete(uint(id))
	if err != nil {
		log.Printf("Error deleting teaching assistant assignment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to delete assignment: " + err.Error(),
		})
		return
	}

	log.Printf("Successfully deleted teaching assistant assignment with ID: %d", id)
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Assignment deleted successfully",
	})
}

// GetAssignmentsByTeachingAssistant returns all assignments for a specific teaching assistant
func (h *TeachingAssistantAssignmentHandler) GetAssignmentsByTeachingAssistant(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid teaching assistant ID",
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

	// Get assignments for the teaching assistant
	assignments, err := h.repo.GetByEmployeeID(uint(id), academicYearID)
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

// GetAssignmentsByCourse returns all teaching assistant assignments for a specific course
func (h *TeachingAssistantAssignmentHandler) GetAssignmentsByCourse(c *gin.Context) {
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

// GetAvailableTeachingAssistants returns all teaching assistants available for assignment to a course
func (h *TeachingAssistantAssignmentHandler) GetAvailableTeachingAssistants(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		log.Printf("Error parsing course ID: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid course ID",
		})
		return
	}

	log.Printf("Getting available teaching assistants for course ID: %d", courseID)

	// Get academic year ID from query parameter, if provided
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearID uint = 0

	if academicYearIDStr != "" {
		academicYearIDUint, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			log.Printf("Error parsing academic year ID: %v", err)
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
			log.Printf("Using most recent academic year ID: %d", academicYearID)
		} else if err != nil {
			log.Printf("Error fetching academic years: %v", err)
		} else {
			log.Printf("No academic years found, continuing without filtering by academic year")
		}
	}

	// Get available teaching assistants
	employees, err := h.repo.GetAvailableTeachingAssistants(uint(courseID), academicYearID)
	if err != nil {
		log.Printf("Error getting available teaching assistants: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get available teaching assistants: " + err.Error(),
		})
		return
	}

	log.Printf("Successfully retrieved %d available teaching assistants", len(employees))
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   employees,
	})
}

// GetAssignmentsByLecturer returns all teaching assistant assignments created by a specific lecturer
func (h *TeachingAssistantAssignmentHandler) GetAssignmentsByLecturer(c *gin.Context) {
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
	assignments, err := h.repo.GetByLecturerID(uint(id), academicYearID)
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

// GetMyTeachingAssistantAssignments returns teaching assistant assignments for the current logged-in lecturer
func (h *TeachingAssistantAssignmentHandler) GetMyTeachingAssistantAssignments(c *gin.Context) {
	// Get user ID from token - changed from user_id to userID to match middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "User ID not found in token",
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

	// Debug the userID value
	log.Printf("GetMyTeachingAssistantAssignments userID: %v, type: %T", userID, userID)

	// Convert userID to uint regardless of its original type
	var userIDUint uint
	switch v := userID.(type) {
	case float64:
		userIDUint = uint(v)
	case float32:
		userIDUint = uint(v)
	case int:
		userIDUint = uint(v)
	case int64:
		userIDUint = uint(v)
	case uint:
		userIDUint = v
	case uint64:
		userIDUint = uint(v)
	case string:
		uintVal, err := strconv.ParseUint(v, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid user ID format",
			})
			return
		}
		userIDUint = uint(uintVal)
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid user ID type",
		})
		return
	}

	// Get assignments for the lecturer
	assignments, err := h.repo.GetByLecturerID(userIDUint, academicYearID)
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

// GetMyAssignedSchedules returns schedules for courses where the current user is assigned as a teaching assistant
func (h *TeachingAssistantAssignmentHandler) GetMyAssignedSchedules(c *gin.Context) {
	// Get the user ID from the token (the logged-in teaching assistant)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "User ID not found in token",
		})
		return
	}

	// Get the user role
	userRole, roleExists := c.Get("role")
	if !roleExists {
		userRole = "unknown"
	}

	// Convert userID to uint regardless of its original type
	var userIDUint uint
	switch v := userID.(type) {
	case float64:
		userIDUint = uint(v)
	case int:
		userIDUint = uint(v)
	case uint:
		userIDUint = v
	case int64:
		userIDUint = uint(v)
	default:
		// Try to parse as string
		if idStr, ok := userID.(string); ok {
			if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
				userIDUint = uint(id)
			}
		}
	}

	if userIDUint == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid user ID",
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

	var assignments []models.TeachingAssistantAssignment
	var err error

	// Check if the user is a Dosen (lecturer) or Pegawai (employee/assistant)
	role := strings.ToLower(fmt.Sprintf("%v", userRole))
	if role == "dosen" {
		// If user is a Dosen, get assignments where they assigned teaching assistants
		assignments, err = h.repo.GetByLecturerID(userIDUint, academicYearID)
	} else {
		// For regular teaching assistants
		// Find the employee ID for this user
		employeeRepo := repositories.NewEmployeeRepository()
		employee, err := employeeRepo.FindByUserID(int(userIDUint))
		if err != nil || employee == nil {
			// Instead of failing, create a response for new assistants who don't have employee records yet
			log.Printf("Employee record not found for user ID %d. This may be a new teaching assistant.", userIDUint)
			c.JSON(http.StatusOK, gin.H{
				"status":  "success",
				"data":    []models.CourseSchedule{}, // Return empty schedules array
				"message": "You don't have any assigned courses yet. Please contact your lecturer or administrator to assign you to courses.",
			})
			return
		}

		// Get assignments for the teaching assistant
		assignments, err = h.repo.GetByEmployeeID(employee.ID, academicYearID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get assignments: " + err.Error(),
		})
		return
	}

	// Use course schedule repository to fetch schedules for these courses
	courseScheduleRepo := repositories.NewCourseScheduleRepository()
	var schedules []models.CourseSchedule

	for _, assignment := range assignments {
		courseSchedules, err := courseScheduleRepo.GetByCourse(assignment.CourseID)
		if err != nil {
			continue
		}
		schedules = append(schedules, courseSchedules...)
	}

	// Gunakan CourseScheduleService untuk memformat jadwal dengan benar
	// agar semua informasi yang dibutuhkan tersedia di frontend
	courseScheduleService := services.NewCourseScheduleService()
	formattedSchedules := courseScheduleService.FormatSchedulesForResponse(schedules)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   formattedSchedules,
	})
}
