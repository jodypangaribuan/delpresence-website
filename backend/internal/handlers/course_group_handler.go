package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/gin-gonic/gin"
)

// CourseGroupHandler handles course group-related API requests
type CourseGroupHandler struct {
	repo       *repositories.CourseGroupRepository
	courseRepo *repositories.CourseRepository
}

// NewCourseGroupHandler creates a new instance of CourseGroupHandler
func NewCourseGroupHandler() *CourseGroupHandler {
	return &CourseGroupHandler{
		repo:       repositories.NewCourseGroupRepository(),
		courseRepo: repositories.NewCourseRepository(),
	}
}

// GetAllCourseGroups returns all course groups
func (h *CourseGroupHandler) GetAllCourseGroups(c *gin.Context) {
	// Check if we need to filter by department
	departmentID := c.Query("department_id")
	
	var groups []models.CourseGroup
	var err error
	
	// Apply filter if provided
	if departmentID != "" {
		deptID, convErr := strconv.ParseUint(departmentID, 10, 32)
		if convErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid department ID"})
			return
		}
		groups, err = h.repo.GetByDepartment(uint(deptID))
	} else {
		groups, err = h.repo.GetAll()
	}
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": groups})
}

// GetCourseGroupByID returns a single course group by ID
func (h *CourseGroupHandler) GetCourseGroupByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course group ID"})
		return
	}
	
	group, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Course group not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": group})
}

// CreateCourseGroup creates a new course group
func (h *CourseGroupHandler) CreateCourseGroup(c *gin.Context) {
	var request struct {
		Code          string `json:"code" binding:"required"`
		Name          string `json:"name" binding:"required"`
		DepartmentID  uint   `json:"department_id" binding:"required"`
		FacultyID     uint   `json:"faculty_id" binding:"required"`
		CourseIDs     []uint `json:"course_ids"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Check if any of the courses are already in a group
	for _, courseID := range request.CourseIDs {
		isInGroup, groupID, err := h.repo.IsCourseInAnyGroup(courseID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
		
		if isInGroup {
			// Get the group name for the error message
			group, err := h.repo.GetByID(groupID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
				return
			}
			
			// Get the course name for the error message
			course, err := h.courseRepo.GetByID(courseID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
				return
			}
			
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": "Course '" + course.Name + "' is already in group '" + group.Name + "'",
				"course_id": courseID,
				"group_id": groupID,
			})
			return
		}
	}
	
	// Create the group
	group := models.CourseGroup{
		Code:         request.Code,
		Name:         request.Name,
		DepartmentID: request.DepartmentID,
		FacultyID:    request.FacultyID,
	}
	
	createdGroup, err := h.repo.Create(group, request.CourseIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": createdGroup})
}

// UpdateCourseGroup updates an existing course group
func (h *CourseGroupHandler) UpdateCourseGroup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course group ID"})
		return
	}
	
	// Verify course group exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Course group not found"})
		return
	}
	
	var request struct {
		Code          string `json:"code" binding:"required"`
		Name          string `json:"name" binding:"required"`
		DepartmentID  uint   `json:"department_id" binding:"required"`
		FacultyID     uint   `json:"faculty_id" binding:"required"`
		CourseIDs     []uint `json:"course_ids"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Check if any of the courses are already in another group
	for _, courseID := range request.CourseIDs {
		isInGroup, groupID, err := h.repo.IsCourseInAnyGroup(courseID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
			return
		}
		
		if isInGroup && groupID != uint(id) {
			// Get the group name for the error message
			group, err := h.repo.GetByID(groupID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
				return
			}
			
			// Get the course name for the error message
			course, err := h.courseRepo.GetByID(courseID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
				return
			}
			
			c.JSON(http.StatusBadRequest, gin.H{
				"status": "error", 
				"message": "Course '" + course.Name + "' is already in group '" + group.Name + "'",
				"course_id": courseID,
				"group_id": groupID,
			})
			return
		}
	}
	
	// Update the group
	group := models.CourseGroup{
		ID:           uint(id),
		Code:         request.Code,
		Name:         request.Name,
		DepartmentID: request.DepartmentID,
		FacultyID:    request.FacultyID,
	}
	
	updatedGroup, err := h.repo.Update(group, request.CourseIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": updatedGroup})
}

// DeleteCourseGroup deletes a course group
func (h *CourseGroupHandler) DeleteCourseGroup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid course group ID"})
		return
	}
	
	// Verify course group exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Course group not found"})
		return
	}
	
	err = h.repo.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Course group deleted successfully"})
} 