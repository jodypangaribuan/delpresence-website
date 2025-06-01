package handlers

import (
	"net/http"

	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// StudentAttendanceHandler handles attendance-related HTTP requests for students
type StudentAttendanceHandler struct {
	attendanceService *services.AttendanceService
	scheduleService   *services.CourseScheduleService
}

// NewStudentAttendanceHandler creates a new student attendance handler
func NewStudentAttendanceHandler() *StudentAttendanceHandler {
	return &StudentAttendanceHandler{
		attendanceService: services.NewAttendanceService(),
		scheduleService:   services.NewCourseScheduleService(),
	}
}

// GetActiveAttendanceSessions gets all active attendance sessions for a student's schedule
func (h *StudentAttendanceHandler) GetActiveAttendanceSessions(c *gin.Context) {
	// Extract student ID from the authenticated user
	userID := c.MustGet("userID").(uint)

	// Get student's course schedules
	schedules, err := h.scheduleService.GetStudentSchedules(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get student schedules",
			"error":   err.Error(),
		})
		return
	}

	// Get active attendance sessions for these schedules
	var activeSessions []map[string]interface{}

	// Extract schedule IDs
	var scheduleIDs []uint
	for _, schedule := range schedules {
		scheduleIDs = append(scheduleIDs, schedule.ID)
	}

	// Get active sessions for these schedules
	sessions, err := h.attendanceService.GetActiveSessionsBySchedules(scheduleIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get active attendance sessions",
			"error":   err.Error(),
		})
		return
	}

	// Map sessions to response format
	for _, session := range sessions {
		activeSessions = append(activeSessions, map[string]interface{}{
			"id":                 session.ID,
			"course_schedule_id": session.CourseScheduleID,
			"lecturer_id":        session.LecturerID,
			"date":               session.Date.Format("2006-01-02"),
			"start_time":         session.StartTime.Format("15:04"),
			"type":               session.Type,
			"status":             session.Status,
			"course_code":        session.CourseSchedule.Course.Code,
			"course_name":        session.CourseSchedule.Course.Name,
			"room_name":          session.CourseSchedule.Room.Name,
			"building_name":      session.CourseSchedule.Room.Building.Name,
		})
	}

	// Return the active sessions
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   activeSessions,
	})
}
