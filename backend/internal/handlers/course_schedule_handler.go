package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
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
		"data":   formattedSchedules,
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
		"data":   formattedSchedule,
	})
}

// CreateSchedule creates a new course schedule
func (h *CourseScheduleHandler) CreateSchedule(c *gin.Context) {
	var request struct {
		CourseID       uint   `json:"course_id" binding:"required"`
		RoomID         uint   `json:"room_id" binding:"required"`
		Day            string `json:"day" binding:"required"`
		StartTime      string `json:"start_time" binding:"required"`
		EndTime        string `json:"end_time" binding:"required"`
		LecturerID     uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID uint   `json:"student_group_id" binding:"required"`
		AcademicYearID uint   `json:"academic_year_id" binding:"required"`
		Capacity       int    `json:"capacity"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	// Check for duplicate schedule (same course, day, time)
	scheduleRepo := repositories.NewCourseScheduleRepository()
	var existingSchedules []models.CourseSchedule
	err := scheduleRepo.DB().
		Where("course_id = ? AND day = ? AND start_time = ? AND end_time = ? AND academic_year_id = ?",
			request.CourseID, request.Day, request.StartTime, request.EndTime, request.AcademicYearID).
		Find(&existingSchedules).Error

	if err == nil && len(existingSchedules) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Duplicate schedule: A schedule with the same course, day, and time already exists",
		})
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
			"status":  "error",
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
			"status":  "error",
			"message": "Invalid day of week. Must be one of: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu",
		})
		return
	}

	// Validate time format (HH:MM)
	timeRegex := regexp.MustCompile(`^([01]?[0-9]|2[0-3]):[0-5][0-9]$`)
	if !timeRegex.MatchString(request.StartTime) || !timeRegex.MatchString(request.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
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
			"status":  "error",
			"message": "End time must be after start time",
		})
		return
	}

	// Room conflict check is now skipped to allow flexible room scheduling
	// This allows rooms to be used for multiple classes at the same time if needed

	// Lecturer conflict check is now skipped to allow flexible scheduling
	// This allows lecturers to teach multiple classes at the same time if needed

	// Student group conflict check is now skipped to allow flexible scheduling
	// This allows student groups to attend multiple classes at the same time if needed

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
		CourseID       uint   `json:"course_id"`
		RoomID         uint   `json:"room_id"`
		Day            string `json:"day"`
		StartTime      string `json:"start_time"`
		EndTime        string `json:"end_time"`
		LecturerID     uint   `json:"lecturer_id"`
		StudentGroupID uint   `json:"student_group_id"`
		AcademicYearID uint   `json:"academic_year_id"`
		Capacity       int    `json:"capacity"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	// Determine the effective values for checking duplicates
	effectiveCourseID := existingSchedule.CourseID
	if request.CourseID != 0 {
		effectiveCourseID = request.CourseID
	}

	effectiveDay := existingSchedule.Day
	if request.Day != "" {
		effectiveDay = request.Day
	}

	effectiveStartTime := existingSchedule.StartTime
	if request.StartTime != "" {
		effectiveStartTime = request.StartTime
	}

	effectiveEndTime := existingSchedule.EndTime
	if request.EndTime != "" {
		effectiveEndTime = request.EndTime
	}

	effectiveAcademicYearID := existingSchedule.AcademicYearID
	if request.AcademicYearID != 0 {
		effectiveAcademicYearID = request.AcademicYearID
	}

	// Check for duplicate schedule (same course, day, time) excluding this schedule
	scheduleRepo := repositories.NewCourseScheduleRepository()
	var existingSchedules []models.CourseSchedule
	err = scheduleRepo.DB().
		Where("id <> ? AND course_id = ? AND day = ? AND start_time = ? AND end_time = ? AND academic_year_id = ?",
			id, effectiveCourseID, effectiveDay, effectiveStartTime, effectiveEndTime, effectiveAcademicYearID).
		Find(&existingSchedules).Error

	if err == nil && len(existingSchedules) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Duplicate schedule: A schedule with the same course, day, and time already exists",
		})
		return
	}

	// Store original course ID and academic year ID for comparison
	originalCourseID := existingSchedule.CourseID
	originalAcademicYearID := existingSchedule.AcademicYearID

	// Check if the course is being changed
	courseChanged := request.CourseID != 0 && request.CourseID != originalCourseID
	academicYearChanged := request.AcademicYearID != 0 && request.AcademicYearID != originalAcademicYearID

	// Determine the effective course ID and academic year ID for validation
	effectiveCourseID = originalCourseID
	if courseChanged {
		effectiveCourseID = request.CourseID
	}

	effectiveAcademicYearID = originalAcademicYearID
	if academicYearChanged {
		effectiveAcademicYearID = request.AcademicYearID
	}

	// If course or academic year is changing, verify the lecturer assignment
	if courseChanged || academicYearChanged || request.LecturerID != 0 {
		// Validate and get the correct assigned lecturer for this course
		assignedLecturerID, err := h.validateLecturerAssignment(effectiveCourseID, effectiveAcademicYearID, request.LecturerID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
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

	if request.StudentGroupID != 0 {
		schedule.StudentGroupID = request.StudentGroupID
		fmt.Printf("Updating student group ID to: %d\n", request.StudentGroupID)
	}

	if request.AcademicYearID != 0 {
		schedule.AcademicYearID = request.AcademicYearID
	}

	if request.Day != "" {
		// Validate day of week
		validDays := map[string]bool{
			"senin": true, "selasa": true, "rabu": true,
			"kamis": true, "jumat": true, "sabtu": true, "minggu": true,
		}

		if !validDays[strings.ToLower(request.Day)] {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
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
			"status":  "error",
			"message": "Invalid start time format. Times must be in HH:MM format",
		})
		return
	}

	if endTimeProvided && !timeRegex.MatchString(request.EndTime) {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
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
				"status":  "error",
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
				"status":  "error",
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
				"status":  "error",
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

	if request.Capacity != 0 {
		schedule.Capacity = request.Capacity
	}

	if request.LecturerID != 0 {
		schedule.UserID = request.LecturerID
	}

	// Check for conflicts before updating
	// All conflict checks are now skipped to allow flexible scheduling
	// This allows resources to be used for multiple classes at the same time

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
		"status":  "success",
		"message": "Schedule deleted successfully",
	})
}

// CheckScheduleConflicts checks for various scheduling conflicts
func (h *CourseScheduleHandler) CheckScheduleConflicts(c *gin.Context) {
	var request struct {
		ScheduleID     *uint  `json:"schedule_id"`
		RoomID         uint   `json:"room_id" binding:"required"`
		LecturerID     uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID uint   `json:"student_group_id" binding:"required"`
		Day            string `json:"day" binding:"required"`
		StartTime      string `json:"start_time" binding:"required"`
		EndTime        string `json:"end_time" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}

	conflicts, err := h.service.CheckForScheduleConflicts(
		request.ScheduleID,
		request.RoomID,
		request.LecturerID,
		request.StudentGroupID,
		request.Day,
		request.StartTime,
		request.EndTime,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}

	// All conflicts are now just warnings, not blocking errors
	hasBlockingConflict := false // No blocking conflicts - all are warnings

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": map[string]interface{}{
			"conflicts":                      conflicts,
			"has_blocking_conflict":          hasBlockingConflict,
			"room_conflict_warning":          conflicts["room"],
			"lecturer_conflict_warning":      conflicts["lecturer"],
			"student_group_conflict_warning": conflicts["student_group"],
			"message":                        "Room, lecturer, and student group conflicts are non-blocking and will allow flexible scheduling",
		},
	})
}

// GetMySchedules returns the schedules for the logged in lecturer
func (h *CourseScheduleHandler) GetMySchedules(c *gin.Context) {
	// Get the user ID from the JWT token context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
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

	// Debug log to check userID
	fmt.Printf("Looking up lecturer with userID: %d\n", userIDInt)

	// Get the lecturer by userID from authentication
	lecturer, err := lecturerRepo.GetByUserID(userIDInt)

	// Variables to track which ID we finally use
	var finalUserID uint
	var idSource string

	if err != nil {
		// Try alternative method to find lecturer
		fmt.Printf("Error finding lecturer by userID %d: %v\n", userIDInt, err)
		// Try to find lecturer by ID directly
		lecturer, err = lecturerRepo.GetByID(uint(userIDInt))
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "error",
				"message": "Lecturer not found: " + err.Error(),
			})
			return
		}
		finalUserID = lecturer.ID
		idSource = "lecturer.ID"
	} else {
		finalUserID = uint(lecturer.UserID)
		idSource = "lecturer.UserID"
	}

	// Log lecturer found
	fmt.Printf("Found lecturer: ID=%d, UserID=%d, Name=%s, using %s=%d for queries\n",
		lecturer.ID, lecturer.UserID, lecturer.FullName, idSource, finalUserID)

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
			fmt.Printf("Using academicYearID: %d\n", academicYearID)
		}
	}

	// Get schedules for the lecturer, filtered by academic year if specified
	var schedules []models.CourseSchedule
	var tryMethods = []struct {
		name  string
		tryFn func() ([]models.CourseSchedule, error)
	}{
		{
			name: "by lecturer UserID",
			tryFn: func() ([]models.CourseSchedule, error) {
				if academicYearID > 0 {
					return h.service.GetSchedulesByLecturerAndAcademicYear(uint(lecturer.UserID), academicYearID)
				}
				return h.service.GetSchedulesByLecturer(uint(lecturer.UserID))
			},
		},
		{
			name: "by lecturer ID",
			tryFn: func() ([]models.CourseSchedule, error) {
				if academicYearID > 0 {
					return h.service.GetSchedulesByLecturerAndAcademicYear(lecturer.ID, academicYearID)
				}
				return h.service.GetSchedulesByLecturer(lecturer.ID)
			},
		},
		{
			name: "by user ID from token",
			tryFn: func() ([]models.CourseSchedule, error) {
				if academicYearID > 0 {
					return h.service.GetSchedulesByLecturerAndAcademicYear(uint(userIDInt), academicYearID)
				}
				return h.service.GetSchedulesByLecturer(uint(userIDInt))
			},
		},
		{
			name: "by lecturer assignments",
			tryFn: func() ([]models.CourseSchedule, error) {
				assignmentRepo := repositories.NewLecturerAssignmentRepository()
				var allSchedules []models.CourseSchedule

				// Try multiple lecturer IDs for assignments
				lecturerIDs := []int{lecturer.UserID, int(lecturer.ID), userIDInt}

				for _, lid := range lecturerIDs {
					assignments, err := assignmentRepo.GetByLecturerID(lid, academicYearID)
					if err == nil && len(assignments) > 0 {
						fmt.Printf("Found %d assignments for lecturer ID %d\n", len(assignments), lid)

						for _, assignment := range assignments {
							var courseSchedules []models.CourseSchedule
							if academicYearID > 0 {
								courseSchedules, _ = h.service.GetSchedulesByCourseAndAcademicYear(assignment.CourseID, academicYearID)
							} else {
								courseSchedules, _ = h.service.GetSchedulesByCourse(assignment.CourseID)
							}
							allSchedules = append(allSchedules, courseSchedules...)
						}
					}
				}

				if len(allSchedules) > 0 {
					return allSchedules, nil
				}
				return nil, errors.New("no assignments found")
			},
		},
	}

	// Try each method until we find schedules
	var methodUsed string
	for _, method := range tryMethods {
		fmt.Printf("Trying to get schedules %s\n", method.name)
		foundSchedules, err := method.tryFn()
		if err == nil && len(foundSchedules) > 0 {
			schedules = foundSchedules
			methodUsed = method.name
			break
		}
	}

	fmt.Printf("Found %d schedules for lecturer using method: %s\n", len(schedules), methodUsed)

	// If still no schedules found, return an empty array rather than an error
	if len(schedules) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{}, // Empty array
		})
		return
	}

	formattedSchedules := h.service.FormatSchedulesForResponse(schedules)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   formattedSchedules,
	})
}

// GetLecturerForCourse returns the lecturer assigned to a specific course
func (h *CourseScheduleHandler) GetLecturerForCourse(c *gin.Context) {
	courseID, err := strconv.ParseUint(c.Param("course_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
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
			"status":  "error",
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
			"status":  "error",
			"message": "Failed to get lecturer assignments: " + assignmentErr.Error(),
		})
		return
	}

	// If no assignments found
	if len(assignments) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "No lecturer assigned to this course",
		})
		return
	}

	// Return the first assigned lecturer (typically there should be only one)
	lecturer := assignments[0].Lecturer
	if lecturer == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
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
				"lecturer_id":        lecturer.ID,     // Use the Lecturer.ID as fallback for user ID
				"user_id":            lecturer.ID,     // Include user_id field using Lecturer.ID
				"external_user_id":   lecturer.UserID, // Include external ID for reference
				"name":               lecturer.FullName,
				"email":              lecturer.Email,
				"academic_year_id":   academicYearID,
				"academic_year_name": academicYearName,
			},
		})
		return
	}

	// Normal response when user is found
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": gin.H{
			"lecturer_id":        user.ID,         // Use User.ID as the reference ID for CourseSchedule.UserID
			"user_id":            user.ID,         // Include user_id field to be explicit
			"external_user_id":   lecturer.UserID, // Include external ID for reference
			"name":               lecturer.FullName,
			"email":              lecturer.Email,
			"academic_year_id":   academicYearID,
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

// GetStudentSchedules returns the schedules for the logged in student
func (h *CourseScheduleHandler) GetStudentSchedules(c *gin.Context) {
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
		// Return empty schedules list instead of error when student not found
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"data":    []interface{}{},
			"message": "No student record found for the current user",
		})
		return
	}

	// Get student groups for this student
	studentGroupRepo := repositories.NewStudentGroupRepository()
	studentGroups, err := studentGroupRepo.GetGroupsByStudentID(student.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get student groups",
		})
		return
	}

	// If the student isn't in any groups, return empty schedules
	if len(studentGroups) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"status":  "success",
			"data":    []interface{}{},
			"message": "Student is not assigned to any groups",
		})
		return
	}

	// Get schedules for all student groups
	var allSchedules []models.CourseSchedule

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

	for _, group := range studentGroups {
		var schedules []models.CourseSchedule
		var err error

		if academicYearIDStr != "" {
			// Get schedules for this group in the specified academic year
			schedules, err = h.service.GetSchedulesByStudentGroupAndAcademicYear(group.ID, academicYearID)
		} else {
			// Get all schedules for this group
			schedules, err = h.service.GetSchedulesByStudentGroup(group.ID)
		}

		if err != nil {
			continue
		}

		allSchedules = append(allSchedules, schedules...)
	}

	formattedSchedules := h.service.FormatSchedulesForResponse(allSchedules)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   formattedSchedules,
	})
}
