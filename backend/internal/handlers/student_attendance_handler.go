package handlers

import (
	"fmt"
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

	// Log the request for debugging
	fmt.Printf("Getting active attendance sessions for user ID=%d\n", userID)

	// Get student's course schedules
	schedules, err := h.scheduleService.GetStudentSchedules(userID)
	if err != nil {
		fmt.Printf("Error getting student schedules for user ID=%d: %v\n", userID, err)
		// Return empty list instead of error
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{},
		})
		return
	}

	// Log how many schedules were found
	fmt.Printf("Found %d schedules for user ID=%d\n", len(schedules), userID)

	// If no schedules found, return empty list
	if len(schedules) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{},
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

	// Log schedule IDs for debugging
	fmt.Printf("Checking for active sessions for schedule IDs: %v\n", scheduleIDs)

	// Get active sessions for these schedules
	sessions, err := h.attendanceService.GetActiveSessionsBySchedules(scheduleIDs)
	if err != nil {
		fmt.Printf("Error getting active sessions for schedules %v: %v\n", scheduleIDs, err)
		// Return empty list instead of error
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"data":   []map[string]interface{}{},
		})
		return
	}

	// Log how many active sessions were found
	fmt.Printf("Found %d active sessions for schedules %v\n", len(sessions), scheduleIDs)

	// Map sessions to response format
	for _, session := range sessions {
		// Check if CourseSchedule and related objects are loaded
		if session.CourseSchedule.ID == 0 || session.CourseSchedule.Course.ID == 0 || session.CourseSchedule.Room.ID == 0 {
			fmt.Printf("Warning: Session %d has incomplete related data\n", session.ID)
			continue
		}

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
