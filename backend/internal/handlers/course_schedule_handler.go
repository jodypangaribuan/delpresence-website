package handlers

import (
	"net/http"
	"strconv"
	"sort"
	"fmt"
	"strings"
	"regexp"

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
		LecturerID      uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID  uint   `json:"student_group_id" binding:"required"`
		AcademicYearID  uint   `json:"academic_year_id" binding:"required"`
		Capacity        int    `json:"capacity"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	// Validate academic year
	academicYearRepo := repositories.NewAcademicYearRepository()
	academicYear, err := academicYearRepo.FindByID(request.AcademicYearID)
	if err != nil || academicYear == nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid academic year ID"})
		return
	}

	// Validate course
	courseRepo := repositories.NewCourseRepository()
	course, err := courseRepo.GetByID(request.CourseID)
	if err != nil || course.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course ID"})
		return
	}

	// Validate and get the correct assigned lecturer for this course
	assignedLecturerID, err := h.validateLecturerAssignment(request.CourseID, request.AcademicYearID, request.LecturerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": err.Error(),
		})
		return
	}

	// Validate room
	roomRepo := repositories.NewRoomRepository()
	room, err := roomRepo.FindByID(request.RoomID)
	if err != nil || room == nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid room ID"})
		return
	}

	// Validate student group
	studentGroupRepo := repositories.NewStudentGroupRepository()
	studentGroup, err := studentGroupRepo.GetByID(request.StudentGroupID)
	if err != nil || studentGroup.ID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}

	// Validate day of week
	validDays := map[string]bool{
		"senin": true, "selasa": true, "rabu": true,
		"kamis": true, "jumat": true, "sabtu": true, "minggu": true,
	}
	
	if !validDays[strings.ToLower(request.Day)] {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Invalid day of week. Must be one of: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu",
		})
		return
	}

	// Validate time format (HH:MM)
	timeRegex := regexp.MustCompile(`^([01]?[0-9]|2[0-3]):[0-5][0-9]$`)
	if !timeRegex.MatchString(request.StartTime) || !timeRegex.MatchString(request.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Invalid time format. Times must be in HH:MM format",
		})
		return
	}

	// Parse start and end times
	startTimeParts := strings.Split(request.StartTime, ":")
	endTimeParts := strings.Split(request.EndTime, ":")
	
	startHour, _ := strconv.Atoi(startTimeParts[0])
	startMinute, _ := strconv.Atoi(startTimeParts[1])
	endHour, _ := strconv.Atoi(endTimeParts[0])
	endMinute, _ := strconv.Atoi(endTimeParts[1])
	
	// Convert to minutes for comparison
	startTimeMinutes := startHour*60 + startMinute
	endTimeMinutes := endHour*60 + endMinute
	
	// Verify end time is after start time
	if endTimeMinutes <= startTimeMinutes {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "End time must be after start time",
		})
		return
	}

	// Check for room conflicts
	roomConflict, err := h.service.CheckRoomScheduleConflict(request.RoomID, request.Day, request.StartTime, request.EndTime, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check room conflicts"})
		return
	}
	
	if roomConflict {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Room is already scheduled for this time",
		})
		return
	}

	// Check for lecturer conflicts
	lecturerConflict, err := h.service.CheckLecturerScheduleConflict(assignedLecturerID, request.Day, request.StartTime, request.EndTime, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check lecturer conflicts"})
		return
	}
	
	if lecturerConflict {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Lecturer is already scheduled for this time",
		})
		return
	}

	// Check for student group conflicts
	studentGroupConflict, err := h.service.CheckStudentGroupScheduleConflict(request.StudentGroupID, request.Day, request.StartTime, request.EndTime, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check student group conflicts"})
		return
	}
	
	if studentGroupConflict {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Student group is already scheduled for this time",
		})
		return
	}

	// All validations passed, create the schedule
	schedule := models.CourseSchedule{
		CourseID:       request.CourseID,
		RoomID:         request.RoomID,
		Day:            request.Day,
		StartTime:      request.StartTime,
		EndTime:        request.EndTime,
		UserID:         assignedLecturerID, // Use the assigned or verified lecturer ID
		StudentGroupID: request.StudentGroupID,
		AcademicYearID: request.AcademicYearID,
		Capacity:       request.Capacity,
	}

	createdSchedule, err := h.service.CreateSchedule(schedule)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": createdSchedule})
}

// UpdateSchedule updates an existing course schedule
func (h *CourseScheduleHandler) UpdateSchedule(c *gin.Context) {
	// Get schedule ID from the URL
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid schedule ID"})
		return
	}

	// Fetch existing schedule to ensure it exists
	existingSchedule, err := h.service.GetScheduleByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Schedule not found"})
		return
	}

	// Parse request body
	var request struct {
		CourseID        uint   `json:"course_id"`
		RoomID          uint   `json:"room_id"`
		Day             string `json:"day"`
		StartTime       string `json:"start_time"`
		EndTime         string `json:"end_time"`
		LecturerID      uint   `json:"lecturer_id"`
		StudentGroupID  uint   `json:"student_group_id"`
		AcademicYearID  uint   `json:"academic_year_id"`
		Capacity        int    `json:"capacity"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	// Store original course ID and academic year ID for comparison
	originalCourseID := existingSchedule.CourseID
	originalAcademicYearID := existingSchedule.AcademicYearID
	
	// Check if the course is being changed
	courseChanged := request.CourseID != 0 && request.CourseID != originalCourseID
	academicYearChanged := request.AcademicYearID != 0 && request.AcademicYearID != originalAcademicYearID
	
	// Determine the effective course ID and academic year ID for validation
	effectiveCourseID := originalCourseID
	if courseChanged {
		effectiveCourseID = request.CourseID
	}
	
	effectiveAcademicYearID := originalAcademicYearID
	if academicYearChanged {
		effectiveAcademicYearID = request.AcademicYearID
	}
	
	// If course or academic year is changing, verify the lecturer assignment
	if courseChanged || academicYearChanged || request.LecturerID != 0 {
		// Validate and get the correct assigned lecturer for this course
		assignedLecturerID, err := h.validateLecturerAssignment(effectiveCourseID, effectiveAcademicYearID, request.LecturerID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": err.Error(),
			})
			return
		}
		
		// Set the validated lecturer ID
		request.LecturerID = assignedLecturerID
	}
	
	// Update fields if provided
	schedule := existingSchedule

	if request.CourseID != 0 {
		schedule.CourseID = request.CourseID
	}

	if request.RoomID != 0 {
		schedule.RoomID = request.RoomID
	}

	if request.Day != "" {
		// Validate day of week
		validDays := map[string]bool{
			"senin": true, "selasa": true, "rabu": true,
			"kamis": true, "jumat": true, "sabtu": true, "minggu": true,
		}
		
		if !validDays[strings.ToLower(request.Day)] {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": "Invalid day of week. Must be one of: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu",
			})
			return
		}
		
		schedule.Day = request.Day
	}

	// Validate time format if provided
	timeRegex := regexp.MustCompile(`^([01]?[0-9]|2[0-3]):[0-5][0-9]$`)
	
	startTimeProvided := request.StartTime != ""
	endTimeProvided := request.EndTime != ""
	
	if startTimeProvided && !timeRegex.MatchString(request.StartTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Invalid start time format. Times must be in HH:MM format",
		})
		return
	}
	
	if endTimeProvided && !timeRegex.MatchString(request.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Invalid end time format. Times must be in HH:MM format",
		})
		return
	}
	
	// If both start and end times are provided, verify end is after start
	if startTimeProvided && endTimeProvided {
		startTimeParts := strings.Split(request.StartTime, ":")
		endTimeParts := strings.Split(request.EndTime, ":")
		
		startHour, _ := strconv.Atoi(startTimeParts[0])
		startMinute, _ := strconv.Atoi(startTimeParts[1])
		endHour, _ := strconv.Atoi(endTimeParts[0])
		endMinute, _ := strconv.Atoi(endTimeParts[1])
		
		// Convert to minutes for comparison
		startTimeMinutes := startHour*60 + startMinute
		endTimeMinutes := endHour*60 + endMinute
		
		// Verify end time is after start time
		if endTimeMinutes <= startTimeMinutes {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": "End time must be after start time",
			})
			return
		}
	} else if startTimeProvided && !endTimeProvided {
		// Only start time was provided, use with existing end time
		endTimeParts := strings.Split(schedule.EndTime, ":")
		startTimeParts := strings.Split(request.StartTime, ":")
		
		startHour, _ := strconv.Atoi(startTimeParts[0])
		startMinute, _ := strconv.Atoi(startTimeParts[1])
		endHour, _ := strconv.Atoi(endTimeParts[0])
		endMinute, _ := strconv.Atoi(endTimeParts[1])
		
		// Convert to minutes for comparison
		startTimeMinutes := startHour*60 + startMinute
		endTimeMinutes := endHour*60 + endMinute
		
		// Verify end time is after start time
		if endTimeMinutes <= startTimeMinutes {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": "End time must be after start time",
			})
			return
		}
	} else if !startTimeProvided && endTimeProvided {
		// Only end time was provided, use with existing start time
		startTimeParts := strings.Split(schedule.StartTime, ":")
		endTimeParts := strings.Split(request.EndTime, ":")
		
		startHour, _ := strconv.Atoi(startTimeParts[0])
		startMinute, _ := strconv.Atoi(startTimeParts[1])
		endHour, _ := strconv.Atoi(endTimeParts[0])
		endMinute, _ := strconv.Atoi(endTimeParts[1])
		
		// Convert to minutes for comparison
		startTimeMinutes := startHour*60 + startMinute
		endTimeMinutes := endHour*60 + endMinute
		
		// Verify end time is after start time
		if endTimeMinutes <= startTimeMinutes {
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": "End time must be after start time",
			})
			return
		}
	}

	if startTimeProvided {
		schedule.StartTime = request.StartTime
	}

	if endTimeProvided {
		schedule.EndTime = request.EndTime
	}

	if request.StudentGroupID != 0 {
		schedule.StudentGroupID = request.StudentGroupID
	}

	if request.AcademicYearID != 0 {
		schedule.AcademicYearID = request.AcademicYearID
	}

	if request.Capacity != 0 {
		schedule.Capacity = request.Capacity
	}

	if request.LecturerID != 0 {
		schedule.UserID = request.LecturerID
	}

	// Check for conflicts before updating
	scheduleID := uint(id)
	
	// Check room conflicts
	roomConflict, err := h.service.CheckRoomScheduleConflict(
		schedule.RoomID, 
		schedule.Day, 
		schedule.StartTime, 
		schedule.EndTime, 
		&scheduleID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check room conflicts"})
		return
	}
	
	if roomConflict {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Room is already scheduled for this time",
		})
		return
	}
	
	// Check lecturer conflicts
	lecturerConflict, err := h.service.CheckLecturerScheduleConflict(
		schedule.UserID, 
		schedule.Day, 
		schedule.StartTime, 
		schedule.EndTime, 
		&scheduleID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check lecturer conflicts"})
		return
	}
	
	if lecturerConflict {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Lecturer is already scheduled for this time",
		})
		return
	}
	
	// Check student group conflicts
	studentGroupConflict, err := h.service.CheckStudentGroupScheduleConflict(
		schedule.StudentGroupID, 
		schedule.Day, 
		schedule.StartTime, 
		schedule.EndTime, 
		&scheduleID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check student group conflicts"})
		return
	}
	
	if studentGroupConflict {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Student group is already scheduled for this time",
		})
		return
	}

	// Update the schedule
	updatedSchedule, err := h.service.UpdateSchedule(schedule)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "data": updatedSchedule})
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
	
	// First, look up the lecturer record in the database to get the correct user_id to filter by
	lecturerRepo := repositories.NewLecturerRepository()
	
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
				"status": "error",
				"message": "Invalid user ID format",
			})
			return
		}
		userIDInt = id
	default:
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Invalid user ID type",
		})
		return
	}
	
	// Get the lecturer by userID from authentication
	lecturer, err := lecturerRepo.GetByUserID(userIDInt)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status": "error",
			"message": "Lecturer not found: " + err.Error(),
		})
		return
	}
	
	// Check for academic year filter
	var academicYearID uint = 0
	academicYearIDStr := c.Query("academic_year_id")
	if academicYearIDStr != "" && academicYearIDStr != "all" {
		id, err := strconv.ParseUint(academicYearIDStr, 10, 32)
		if err != nil {
			// Instead of returning an error, just log it and continue with default behavior
			fmt.Printf("Invalid academic year ID: %s, using active year instead\n", academicYearIDStr)
		} else {
			academicYearID = uint(id)
		}
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
	
	// Get schedules for the lecturer, filtered by academic year if specified
	var schedules []models.CourseSchedule
	
	if academicYearID > 0 {
		schedules, err = h.service.GetSchedulesByLecturerAndAcademicYear(uint(lecturer.UserID), academicYearID)
	} else {
		schedules, err = h.service.GetSchedulesByLecturer(uint(lecturer.UserID))
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

// validateLecturerAssignment is a helper function to validate a lecturer is assigned to a course for a given academic year
func (h *CourseScheduleHandler) validateLecturerAssignment(courseID, academicYearID uint, providedUserID uint) (uint, error) {
	// Look up the assigned lecturer for this course in the specified academic year
	lecturerAssignmentRepo := repositories.NewLecturerAssignmentRepository()
	assignments, err := lecturerAssignmentRepo.GetByCourseID(courseID, academicYearID)
	
	// If admin explicitly provided a lecturer ID, use it without requiring an assignment
	if providedUserID != 0 {
		// Verify the lecturer exists in our system
		lecturerRepo := repositories.NewLecturerRepository()
		
		// First try to get lecturer by user_id (external ID)
		lecturer, err := lecturerRepo.GetByUserID(int(providedUserID))
		if err == nil && lecturer.ID > 0 {
			return providedUserID, nil
		}
		
		// If not found by user_id, try by lecturer.ID directly
		lecturer, err = lecturerRepo.GetByID(providedUserID)
		if err == nil && lecturer.ID > 0 {
			// If found by ID, use the actual user_id from the lecturer record if available
			if lecturer.UserID > 0 {
				return uint(lecturer.UserID), nil
			}
			return providedUserID, nil
		}
		
		// If we couldn't find the lecturer at all, return an error
		return 0, fmt.Errorf("invalid lecturer/user ID: %d", providedUserID)
	}
	
	// If no lecturer ID was provided, check for assigned lecturers
	if err != nil || len(assignments) == 0 {
		return 0, fmt.Errorf("no lecturer is assigned to this course for the given academic year")
	}
	
	// Use the first assigned lecturer
	assignedLecturerID := uint(assignments[0].UserID)
	return assignedLecturerID, nil
} 