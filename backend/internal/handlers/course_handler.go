package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/gin-gonic/gin"
)

// CourseHandler handles course-related API requests
type CourseHandler struct {
	repo *repositories.CourseRepository
}

// NewCourseHandler creates a new instance of CourseHandler
func NewCourseHandler() *CourseHandler {
	return &CourseHandler{
		repo: repositories.NewCourseRepository(),
	}
}

// GetAllCourses returns all courses
func (h *CourseHandler) GetAllCourses(c *gin.Context) {
	// Check if we need to filter by department or academic year
	departmentID := c.Query("department_id")
	academicYearID := c.Query("academic_year_id")
	semester := c.Query("semester")
	activeAcademicYear := c.Query("active_academic_year")
	
	var courses []models.Course
	var err error
	
	// Apply filters if provided
	if departmentID != "" {
		deptID, convErr := strconv.ParseUint(departmentID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid department ID"})
			return
		}
		courses, err = h.repo.GetByDepartment(uint(deptID))
	} else if academicYearID != "" {
		ayID, convErr := strconv.ParseUint(academicYearID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid academic year ID"})
			return
		}
		courses, err = h.repo.GetByAcademicYear(uint(ayID))
	} else if semester != "" {
		sem, convErr := strconv.Atoi(semester)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid semester"})
			return
		}
		courses, err = h.repo.GetBySemester(sem)
	} else if activeAcademicYear == "true" {
		courses, err = h.repo.GetByActiveAcademicYear()
	} else {
		courses, err = h.repo.GetAll()
	}
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": courses})
}

// GetCourseByID returns a single course by ID
func (h *CourseHandler) GetCourseByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course ID"})
		return
	}
	
	course, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Course not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": course})
}

// CreateCourse creates a new course
func (h *CourseHandler) CreateCourse(c *gin.Context) {
	var course models.Course
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	createdCourse, err := h.repo.Create(course)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": createdCourse})
}

// UpdateCourse updates an existing course
func (h *CourseHandler) UpdateCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course ID"})
		return
	}
	
	// Verify course exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Course not found"})
		return
	}
	
	var course models.Course
	if err := c.ShouldBindJSON(&course); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	course.ID = uint(id)
	updatedCourse, err := h.repo.Update(course)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": updatedCourse})
}

// DeleteCourse deletes a course
func (h *CourseHandler) DeleteCourse(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course ID"})
		return
	}
	
	// Verify course exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Course not found"})
		return
	}
	
	// Check if the course has any lecturer assignments
	lecturerAssignmentRepo := repositories.NewLecturerAssignmentRepository()
	assignments, err := lecturerAssignmentRepo.GetByCourseID(uint(id), 0) // 0 means any academic year
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check course assignments: " + err.Error()})
		return
	}
	
	if len(assignments) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Cannot delete course: This course is assigned to one or more lecturers. Please remove all lecturer assignments first.",
		})
		return
	}
	
	// Check if the course has any schedules
	scheduleRepo := repositories.NewCourseScheduleRepository()
	schedules, err := scheduleRepo.GetByCourse(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Failed to check course schedules: " + err.Error()})
		return
	}
	
	if len(schedules) > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error",
			"message": "Cannot delete course: This course has one or more schedules. Please remove all course schedules first.",
		})
		return
	}
	
	err = h.repo.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Course deleted successfully"})
} 