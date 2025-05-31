package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/gin-gonic/gin"
)

// StudentCourseHandler handles endpoints for student-specific course data
type StudentCourseHandler struct {
	courseRepo             *repositories.CourseRepository
	studentGroupRepo       *repositories.StudentGroupRepository
	lecturerAssignmentRepo *repositories.LecturerAssignmentRepository
	academicYearRepo       *repositories.AcademicYearRepository
	courseScheduleRepo     *repositories.CourseScheduleRepository
}

// NewStudentCourseHandler creates a new instance of StudentCourseHandler
func NewStudentCourseHandler() *StudentCourseHandler {
	return &StudentCourseHandler{
		courseRepo:             repositories.NewCourseRepository(),
		studentGroupRepo:       repositories.NewStudentGroupRepository(),
		lecturerAssignmentRepo: repositories.NewLecturerAssignmentRepository(),
		academicYearRepo:       repositories.NewAcademicYearRepository(),
		courseScheduleRepo:     repositories.NewCourseScheduleRepository(),
	}
}

// GetStudentCourses returns the courses for the logged in student
func (h *StudentCourseHandler) GetStudentCourses(c *gin.Context) {
	// Get the user ID from the JWT token context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "User not found in token",
		})
		return
	}

	// Convert to the appropriate type
	var userIDInt int
	switch v := userID.(type) {
	case float64:
		userIDInt = int(v)
	case int:
		userIDInt = v
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
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Invalid user ID type",
		})
		return
	}

	// Get the student by userID from authentication
	studentRepo := repositories.NewStudentRepository()
	student, err := studentRepo.FindByUserID(userIDInt)
	if err != nil || student == nil {
		// Return empty courses list instead of error when student not found
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"data":    []interface{}{},
			"message": "No student record found for the current user",
		})
		return
	}

	// Get student groups for this student
	studentGroups, err := h.studentGroupRepo.GetGroupsByStudentID(student.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get student groups",
		})
		return
	}

	// If the student isn't in any groups, return empty courses
	if len(studentGroups) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"data":    []interface{}{},
			"message": "Student is not assigned to any groups",
		})
		return
	}

	// Check if we should filter by academic year
	academicYearIDStr := c.Query("academic_year_id")
	var academicYearID uint
	if academicYearIDStr != "" {
		id, convErr := strconv.ParseUint(academicYearIDStr, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearID = uint(id)
	}

	// Get academic year information if provided
	var academicYearName string
	if academicYearID > 0 {
		academicYear, err := h.academicYearRepo.FindByID(academicYearID)
		if err == nil && academicYear != nil {
			academicYearName = academicYear.Name
		}
	}

	type CourseWithDetails struct {
		ID               uint   `json:"id"`
		CourseID         uint   `json:"course_id"`
		CourseCode       string `json:"course_code"`
		CourseName       string `json:"course_name"`
		Credits          int    `json:"sks"`
		Semester         int    `json:"semester"`
		LecturerID       uint   `json:"lecturer_id"`
		LecturerName     string `json:"lecturer_name"`
		StudentGroupID   uint   `json:"student_group_id"`
		StudentGroupName string `json:"student_group_name"`
		AcademicYearID   uint   `json:"academic_year_id"`
		AcademicYearName string `json:"academic_year_name"`
		Description      string `json:"description,omitempty"`
	}

	// Get courses for all student groups
	var coursesList []CourseWithDetails

	// Process each student group
	for _, group := range studentGroups {
		// Get schedules for this student group
		var schedules []models.CourseSchedule
		var err error

		if academicYearID > 0 {
			// Filter by academic year if specified
			schedules, err = h.courseScheduleRepo.GetByStudentGroupAndAcademicYear(group.ID, academicYearID)
		} else {
			// Get all schedules for this group
			schedules, err = h.courseScheduleRepo.GetByStudentGroup(group.ID)
		}

		if err != nil {
			// Log error but continue with other groups
			continue
		}

		// Create a map to avoid duplicate courses
		processedCourseIDs := make(map[uint]bool)

		// Process each schedule to extract course information
		for _, schedule := range schedules {
			// Skip if we've already processed this course
			if processedCourseIDs[schedule.CourseID] {
				continue
			}

			// Mark this course as processed
			processedCourseIDs[schedule.CourseID] = true

			// Get the full course details
			course, err := h.courseRepo.FindByID(schedule.CourseID)
			if err != nil || course == nil {
				continue
			}

			// Create course with details
			courseWithDetails := CourseWithDetails{
				ID:               course.ID,
				CourseID:         course.ID,
				CourseCode:       course.Code,
				CourseName:       course.Name,
				Credits:          course.Credits,
				Semester:         course.Semester,
				StudentGroupID:   group.ID,
				StudentGroupName: group.Name,
				AcademicYearID:   course.AcademicYearID,
				AcademicYearName: academicYearName,
				LecturerName:     "Belum ditentukan", // Default value when no lecturer is assigned
			}

			// Get lecturer assignment for this course
			assignments, err := h.lecturerAssignmentRepo.GetByCourseID(course.ID, course.AcademicYearID)
			if err == nil && len(assignments) > 0 {
				// Get lecturer information
				lecturerRepo := repositories.NewLecturerRepository()
				lecturer, err := lecturerRepo.GetByID(uint(assignments[0].UserID))
				if err == nil && lecturer.FullName != "" {
					courseWithDetails.LecturerID = uint(lecturer.ID)
					courseWithDetails.LecturerName = lecturer.FullName
				} else {
					// Try other methods to get lecturer name
					// Try by UserID first
					lecturer, err = lecturerRepo.GetByUserID(int(assignments[0].UserID))
					if err == nil && lecturer.FullName != "" {
						courseWithDetails.LecturerID = uint(lecturer.ID)
						courseWithDetails.LecturerName = lecturer.FullName
					}
				}

				// Add debug information
				fmt.Printf("Course %s - Lecturer assignment found: UserID=%d, Name=%s\n",
					course.Name, assignments[0].UserID, courseWithDetails.LecturerName)
			} else {
				// Add debug information
				fmt.Printf("Course %s - No lecturer assignment found\n", course.Name)
			}

			coursesList = append(coursesList, courseWithDetails)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   coursesList,
	})
}
