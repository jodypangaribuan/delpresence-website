package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
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
		Enrolled        int    `json:"enrolled"`
		Notes           string `json:"notes"`
		IsActive        bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request: " + err.Error()})
		return
	}

	// Check for conflicts before creating
	conflicts, err := h.service.CheckForScheduleConflicts(
		nil, 
		request.RoomID, 
		request.LecturerID, 
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
		LecturerID:     request.LecturerID,
		StudentGroupID: request.StudentGroupID,
		AcademicYearID: request.AcademicYearID,
		Capacity:       request.Capacity,
		Enrolled:       request.Enrolled,
		Notes:          request.Notes,
		IsActive:       request.IsActive,
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
		"message": "Schedule created successfully",
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
		LecturerID      uint   `json:"lecturer_id" binding:"required"`
		StudentGroupID  uint   `json:"student_group_id" binding:"required"`
		AcademicYearID  uint   `json:"academic_year_id" binding:"required"`
		Capacity        int    `json:"capacity"`
		Enrolled        int    `json:"enrolled"`
		Notes           string `json:"notes"`
		IsActive        bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid request: " + err.Error()})
		return
	}

	// Check the schedule exists
	_, err = h.service.GetScheduleByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Schedule not found"})
		return
	}

	// Check for conflicts before updating
	scheduleID := uint(id)
	conflicts, err := h.service.CheckForScheduleConflicts(
		&scheduleID,
		request.RoomID,
		request.LecturerID,
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
		LecturerID:     request.LecturerID,
		StudentGroupID: request.StudentGroupID,
		AcademicYearID: request.AcademicYearID,
		Capacity:       request.Capacity,
		Enrolled:       request.Enrolled,
		Notes:          request.Notes,
		IsActive:       request.IsActive,
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
		"message": "Schedule updated successfully",
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
		LecturerID     uint   `json:"lecturer_id" binding:"required"`
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
		request.LecturerID,
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