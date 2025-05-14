package handlers

import (
	"net/http"
	"strconv"
	"time"
	"sort"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/delpresence/backend/internal/repositories"
)

// CourseScheduleHandler handles API requests for course schedules
type CourseScheduleHandler struct {
	service *services.CourseScheduleService
}

// NewCourseScheduleHandler creates a new instance of CourseScheduleHandler
func NewCourseScheduleHandler() *CourseScheduleHandler {
	return &CourseScheduleHandler{
		service: services.NewCourseScheduleService(),
	}
}

// GetAllSchedules returns all course schedules
func (h *CourseScheduleHandler) GetAllSchedules(c *gin.Context) {
	// Check for filter parameters
	academicYearID := c.Query("academic_year_id")
	lecturerID := c.Query("lecturer_id")
	studentGroupID := c.Query("student_group_id")
	day := c.Query("day")
	roomID := c.Query("room_id")
	buildingID := c.Query("building_id")
	courseID := c.Query("course_id")

	var schedules []models.CourseSchedule
	var err error

	// Apply filters based on query parameters
	if academicYearID != "" {
		id, convErr := strconv.ParseUint(academicYearID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid academic year ID"})
			return
		}
		schedules, err = h.service.GetSchedulesByAcademicYear(uint(id))
	} else if lecturerID != "" {
		id, convErr := strconv.ParseUint(lecturerID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid lecturer ID"})
			return
		}
		schedules, err = h.service.GetSchedulesByLecturer(uint(id))
	} else if studentGroupID != "" {
		id, convErr := strconv.ParseUint(studentGroupID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
			return
		}
		schedules, err = h.service.GetSchedulesByStudentGroup(uint(id))
	} else if day != "" {
		schedules, err = h.service.GetSchedulesByDay(day)
	} else if roomID != "" {
		id, convErr := strconv.ParseUint(roomID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid room ID"})
			return
		}
		schedules, err = h.service.GetSchedulesByRoom(uint(id))
	} else if buildingID != "" {
		id, convErr := strconv.ParseUint(buildingID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid building ID"})
			return
		}
		schedules, err = h.service.GetSchedulesByBuilding(uint(id))
	} else if courseID != "" {
		id, convErr := strconv.ParseUint(courseID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course ID"})
			return
		}
		schedules, err = h.service.GetSchedulesByCourse(uint(id))
	} else {
		schedules, err = h.service.GetAllSchedules()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	formattedSchedules := h.service.FormatSchedulesForResponse(schedules)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": formattedSchedules,
	})
}

// GetScheduleByID returns a course schedule by ID
func (h *CourseScheduleHandler) GetScheduleByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid schedule ID"})
		return
	}

	schedule, err := h.service.GetScheduleByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Schedule not found"})
		return
	}

	formattedSchedule := h.service.FormatScheduleForResponse(schedule)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": formattedSchedule,
	})
}

// CreateSchedule creates a new course schedule
func (h *CourseScheduleHandler) CreateSchedule(c *gin.Context) {
	var request struct {
		CourseID        uint   `json:"course_id" binding:"required"`
		RoomID          uint   `json:"room_id" binding:"required"`
		Day             string `json:"day" binding:"required"`
		StartTime       string `json:"start_time" binding:"required"`
		EndTime         string `json:"end_time" binding:"required"`
		UserID          uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID  uint   `json:"student_group_id" binding:"required"`
		AcademicYearID  uint   `json:"academic_year_id" binding:"required"`
		Capacity        int    `json:"capacity"`
		Enrolled        int    `json:"enrolled"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request: " + err.Error()})
		return
	}

	// Validate academic year exist and is active
	academicYearRepo := repositories.NewAcademicYearRepository()
	academicYear, err := academicYearRepo.FindByID(request.AcademicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error", 
			"message": "Failed to validate academic year: " + err.Error(),
		})
		return
	}

	if academicYear == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error", 
			"message": "Academic year not found",
		})
		return
	}
	
	// Verify current date is within academic year range
	now := time.Now()
	if now.Before(academicYear.StartDate) || now.After(academicYear.EndDate) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Schedule can only be created within the academic year period",
			"academic_year": gin.H{
				"name": academicYear.Name,
				"start_date": academicYear.StartDate.Format("2006-01-02"),
				"end_date": academicYear.EndDate.Format("2006-01-02"),
			},
		})
		return
	}

	// Validate lecturer ID exists
	userRepo := repositories.NewUserRepository()
	user, err := userRepo.FindByID(request.UserID)
	
	// If user not found in our database, check if it's a valid lecturer ID
	if user == nil {
		lecturerRepo := repositories.NewLecturerRepository()
		lecturer, err := lecturerRepo.GetByID(request.UserID)
		
		if err != nil || lecturer.ID == 0 {
			// Also check if it's a valid user_id in the lecturers table
			lecturer, err = lecturerRepo.GetByUserID(int(request.UserID))
			
			if err != nil || lecturer.ID == 0 {
				// Check if there's a lecturer assigned to this course
				lecturerAssignmentRepo := repositories.NewLecturerAssignmentRepository()
				assignments, err := lecturerAssignmentRepo.GetByCourseID(request.CourseID, request.AcademicYearID)
				
				if err != nil || len(assignments) == 0 {
					// Try without academic year filter as a fallback
					assignments, err = lecturerAssignmentRepo.GetByCourseID(request.CourseID, 0)
					
					if err != nil || len(assignments) == 0 {
						c.JSON(http.StatusBadRequest, gin.H{
							"status": "error",
							"message": "Invalid lecturer/user ID and no lecturer assigned to this course",
						})
						return
					}
				}
				
				// Use the lecturer from the assignment
				if len(assignments) > 0 && assignments[0].Lecturer != nil {
					// Update the request with the correct lecturer ID
					request.UserID = uint(assignments[0].Lecturer.UserID)
				} else {
					c.JSON(http.StatusBadRequest, gin.H{
						"status": "error",
						"message": "Invalid lecturer ID and unable to find lecturer for this course",
					})
					return
				}
			} else {
				// Found by user_id, use the lecturer's user_id
				request.UserID = uint(lecturer.UserID)
			}
		}
		// If we found a lecturer by ID, we can continue with the original request.UserID
	}

	// Check for conflicts before creating
	conflicts, err := h.service.CheckForScheduleConflicts(
		nil, 
		request.RoomID, 
		request.UserID,
		request.StudentGroupID, 
		request.Day, 
		request.StartTime, 
		request.EndTime,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check for conflicts: " + err.Error()})
		return
	}

	// If any conflicts found, return them to the user
	hasConflicts := false
	for _, conflicted := range conflicts {
		if conflicted {
			hasConflicts = true
			break
		}
	}

	if hasConflicts {
		c.JSON(http.StatusConflict, gin.H{
			"status": "error",
			"message": "Schedule conflicts detected",
			"conflicts": conflicts,
		})
		return
	}

	// Create schedule object from request
	schedule := models.CourseSchedule{
		CourseID:       request.CourseID,
		RoomID:         request.RoomID,
		Day:            request.Day,
		StartTime:      request.StartTime,
		EndTime:        request.EndTime,
		UserID:         request.UserID,
		StudentGroupID: request.StudentGroupID,
		AcademicYearID: request.AcademicYearID,
		Capacity:       request.Capacity,
		Enrolled:       request.Enrolled,
	}

	// Create the schedule
	createdSchedule, err := h.service.CreateSchedule(schedule)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Failed to create schedule: " + err.Error()})
		return
	}

	formattedSchedule := h.service.FormatScheduleForResponse(createdSchedule)
	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"message": "Schedule created successfully within academic year period (" + academicYear.StartDate.Format("2006-01-02") + " to " + academicYear.EndDate.Format("2006-01-02") + ")",
		"data": formattedSchedule,
	})
}

// UpdateSchedule updates an existing course schedule
func (h *CourseScheduleHandler) UpdateSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid schedule ID"})
		return
	}

	var request struct {
		CourseID        uint   `json:"course_id" binding:"required"`
		RoomID          uint   `json:"room_id" binding:"required"`
		Day             string `json:"day" binding:"required"`
		StartTime       string `json:"start_time" binding:"required"`
		EndTime         string `json:"end_time" binding:"required"`
		UserID          uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID  uint   `json:"student_group_id" binding:"required"`
		AcademicYearID  uint   `json:"academic_year_id" binding:"required"`
		Capacity        int    `json:"capacity"`
		Enrolled        int    `json:"enrolled"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request: " + err.Error()})
		return
	}

	// Validate academic year exist and is active
	academicYearRepo := repositories.NewAcademicYearRepository()
	academicYear, err := academicYearRepo.FindByID(request.AcademicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error", 
			"message": "Failed to validate academic year: " + err.Error(),
		})
		return
	}

	if academicYear == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error", 
			"message": "Academic year not found",
		})
		return
	}
	
	// Verify current date is within academic year range
	now := time.Now()
	if now.Before(academicYear.StartDate) || now.After(academicYear.EndDate) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Schedule can only be updated within the academic year period",
			"academic_year": gin.H{
				"name": academicYear.Name,
				"start_date": academicYear.StartDate.Format("2006-01-02"),
				"end_date": academicYear.EndDate.Format("2006-01-02"),
			},
		})
		return
	}

	// Check the schedule exists
	_, err = h.service.GetScheduleByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Schedule not found"})
		return
	}
	
	// Validate lecturer ID exists
	userRepo := repositories.NewUserRepository()
	user, err := userRepo.FindByID(request.UserID)
	
	// If user not found in our database, check if it's a valid lecturer ID
	if user == nil {
		lecturerRepo := repositories.NewLecturerRepository()
		lecturer, err := lecturerRepo.GetByID(request.UserID)
		
		if err != nil || lecturer.ID == 0 {
			// Also check if it's a valid user_id in the lecturers table
			lecturer, err = lecturerRepo.GetByUserID(int(request.UserID))
			
			if err != nil || lecturer.ID == 0 {
				// Check if there's a lecturer assigned to this course
				lecturerAssignmentRepo := repositories.NewLecturerAssignmentRepository()
				assignments, err := lecturerAssignmentRepo.GetByCourseID(request.CourseID, request.AcademicYearID)
				
				if err != nil || len(assignments) == 0 {
					// Try without academic year filter as a fallback
					assignments, err = lecturerAssignmentRepo.GetByCourseID(request.CourseID, 0)
					
					if err != nil || len(assignments) == 0 {
						c.JSON(http.StatusBadRequest, gin.H{
							"status": "error",
							"message": "Invalid lecturer/user ID and no lecturer assigned to this course",
						})
						return
					}
				}
				
				// Use the lecturer from the assignment
				if len(assignments) > 0 && assignments[0].Lecturer != nil {
					// Update the request with the correct lecturer ID
					request.UserID = uint(assignments[0].Lecturer.UserID)
				} else {
					c.JSON(http.StatusBadRequest, gin.H{
						"status": "error",
						"message": "Invalid lecturer ID and unable to find lecturer for this course",
					})
					return
				}
			} else {
				// Found by user_id, use the lecturer's user_id
				request.UserID = uint(lecturer.UserID)
			}
		}
		// If we found a lecturer by ID, we can continue with the original request.UserID
	}

	// Check for conflicts before updating
	scheduleID := uint(id)
	conflicts, err := h.service.CheckForScheduleConflicts(
		&scheduleID,
		request.RoomID,
		request.UserID,
		request.StudentGroupID,
		request.Day,
		request.StartTime,
		request.EndTime,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check for conflicts: " + err.Error()})
		return
	}

	// If any conflicts found, return them to the user
	hasConflicts := false
	for _, conflicted := range conflicts {
		if conflicted {
			hasConflicts = true
			break
		}
	}

	if hasConflicts {
		c.JSON(http.StatusConflict, gin.H{
			"status": "error",
			"message": "Schedule conflicts detected",
			"conflicts": conflicts,
		})
		return
	}

	// Create schedule object from request
	schedule := models.CourseSchedule{
		ID:             uint(id),
		CourseID:       request.CourseID,
		RoomID:         request.RoomID,
		Day:            request.Day,
		StartTime:      request.StartTime,
		EndTime:        request.EndTime,
		UserID:         request.UserID,
		StudentGroupID: request.StudentGroupID,
		AcademicYearID: request.AcademicYearID,
		Capacity:       request.Capacity,
		Enrolled:       request.Enrolled,
	}

	// Update the schedule
	updatedSchedule, err := h.service.UpdateSchedule(uint(id), schedule)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Failed to update schedule: " + err.Error()})
		return
	}

	formattedSchedule := h.service.FormatScheduleForResponse(updatedSchedule)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Schedule updated successfully within academic year period (" + academicYear.StartDate.Format("2006-01-02") + " to " + academicYear.EndDate.Format("2006-01-02") + ")",
		"data": formattedSchedule,
	})
}

// DeleteSchedule deletes a course schedule
func (h *CourseScheduleHandler) DeleteSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid schedule ID"})
		return
	}

	err = h.service.DeleteSchedule(uint(id))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Failed to delete schedule: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Schedule deleted successfully",
	})
}

// CheckScheduleConflicts checks for conflicts when adding or updating a schedule
func (h *CourseScheduleHandler) CheckScheduleConflicts(c *gin.Context) {
	var request struct {
		ScheduleID     *uint  `json:"schedule_id"`
		RoomID         uint   `json:"room_id" binding:"required"`
		UserID         uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID uint   `json:"student_group_id" binding:"required"`
		Day            string `json:"day" binding:"required"`
		StartTime      string `json:"start_time" binding:"required"`
		EndTime        string `json:"end_time" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request: " + err.Error()})
		return
	}

	conflicts, err := h.service.CheckForScheduleConflicts(
		request.ScheduleID,
		request.RoomID,
		request.UserID,
		request.StudentGroupID,
		request.Day,
		request.StartTime,
		request.EndTime,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check for conflicts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": conflicts,
	})
}

// GetMySchedules returns the schedules for the logged in lecturer
func (h *CourseScheduleHandler) GetMySchedules(c *gin.Context) {
	// Get the user ID from the JWT token context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status": "error",
			"message": "User not found in token",
		})
		return
	}
	
	// Convert to uint if needed
	var userIDUint uint
	switch v := userID.(type) {
	case float64:
		userIDUint = uint(v)
	case int:
		userIDUint = uint(v)
	case uint:
		userIDUint = v
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Invalid user ID type",
		})
		return
	}
	
	// Check for academic year filter
	var academicYearID uint = 0
	academicYearIDStr := c.Query("academic_year_id")
	if academicYearIDStr != "" && academicYearIDStr != "all" {
		id, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error",
				"message": "Invalid academic year ID",
			})
			return
		}
		academicYearID = uint(id)
	}
	
	// If no academic year specified, try to get the active one
	if academicYearID == 0 {
		academicYearRepo := repositories.NewAcademicYearRepository()
		activeYear, err := academicYearRepo.GetActiveAcademicYear()
		if err == nil && activeYear != nil {
			academicYearID = activeYear.ID
		}
	}
	
	// Get schedules for the lecturer, filtered by academic year if specified
	var schedules []models.CourseSchedule
	var err error
	
	if academicYearID > 0 {
		schedules, err = h.service.GetSchedulesByLecturerAndAcademicYear(userIDUint, academicYearID)
	} else {
		schedules, err = h.service.GetSchedulesByLecturer(userIDUint)
	}
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": err.Error(),
		})
		return
	}
	
	formattedSchedules := h.service.FormatSchedulesForResponse(schedules)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": formattedSchedules,
	})
}

// GetLecturerForCourse returns the lecturer assigned to a specific course
func (h *CourseScheduleHandler) GetLecturerForCourse(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("course_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Invalid course ID",
		})
		return
	}

	// Get lecturer assignment for this course from repository
	lecturerAssignmentRepo := repositories.NewLecturerAssignmentRepository()
	
	// Try to get any academic year, don't require an active one
	academicYearRepo := repositories.NewAcademicYearRepository()
	
	// First try to get all academic years and use the most recent one
	academicYears, err := academicYearRepo.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Failed to get academic years: " + err.Error(),
		})
		return
	}
	
	var academicYearID uint = 0
	var academicYearName string = "Default"
	
	// If we have academic years, use the most recent one
	if len(academicYears) > 0 {
		// Sort by ID descending to get the most recent one
		sort.Slice(academicYears, func(i, j int) bool {
			return academicYears[i].ID > academicYears[j].ID
		})
		
		academicYearID = academicYears[0].ID
		academicYearName = academicYears[0].Name
	}
	
	// Get assignments for this course without academic year filter
	assignments, assignmentErr := lecturerAssignmentRepo.GetByCourseID(uint(courseID), 0)
	
	// If we still have an error after trying
	if assignmentErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Failed to get lecturer assignments: " + assignmentErr.Error(),
		})
		return
	}
	
	// If no assignments found
	if len(assignments) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"message": "No lecturer assigned to this course",
		})
		return
	}
	
	// Return the first assigned lecturer (typically there should be only one)
	lecturer := assignments[0].Lecturer
	if lecturer == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"message": "Lecturer information not found",
		})
		return
	}
	
	// Get the User record associated with this lecturer's UserID
	userRepo := repositories.NewUserRepository()
	user, err := userRepo.FindByExternalUserID(lecturer.UserID)
	
	// If user not found in our database, create a temporary one for this response
	if user == nil {
		// Use the lecturer info to create a response
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data": gin.H{
				"lecturer_id": lecturer.ID, // Use the Lecturer.ID as fallback for user ID
				"user_id": lecturer.ID,     // Include user_id field using Lecturer.ID
				"external_user_id": lecturer.UserID, // Include external ID for reference
				"name": lecturer.FullName,
				"email": lecturer.Email,
				"academic_year_id": academicYearID,
				"academic_year_name": academicYearName,
			},
		})
		return
	}
	
	// Normal response when user is found
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"lecturer_id": user.ID, // Use User.ID as the reference ID for CourseSchedule.UserID
			"user_id": user.ID,     // Include user_id field to be explicit
			"external_user_id": lecturer.UserID, // Include external ID for reference
			"name": lecturer.FullName,
			"email": lecturer.Email,
			"academic_year_id": academicYearID,
			"academic_year_name": academicYearName,
		},
	})
} 