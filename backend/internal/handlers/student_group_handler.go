package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/gin-gonic/gin"
)

// StudentGroupHandler handles API requests related to student groups
type StudentGroupHandler struct {
	repo       *repositories.StudentGroupRepository
	studentRepo *repositories.StudentRepository
}

// NewStudentGroupHandler creates a new instance of StudentGroupHandler
func NewStudentGroupHandler() *StudentGroupHandler {
	return &StudentGroupHandler{
		repo:       repositories.NewStudentGroupRepository(),
		studentRepo: repositories.NewStudentRepository(),
	}
}

// GetAllStudentGroups returns all student groups
func (h *StudentGroupHandler) GetAllStudentGroups(c *gin.Context) {
	// Parse query parameters for filtering
	departmentID := c.Query("department_id")
	
	var groups []models.StudentGroup
	var err error
	
	// Apply filters if provided
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

// GetStudentGroupByID returns a student group by ID
func (h *StudentGroupHandler) GetStudentGroupByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	group, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": group})
}

// CreateStudentGroup creates a new student group
func (h *StudentGroupHandler) CreateStudentGroup(c *gin.Context) {
	var request struct {
		Name           string `json:"name" binding:"required"`
		DepartmentID   uint   `json:"department_id" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Create the group
	group := models.StudentGroup{
		Name:          request.Name,
		DepartmentID:  request.DepartmentID,
		StudentCount:  0,
	}
	
	createdGroup, err := h.repo.Create(group)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"status": "success", "data": createdGroup})
}

// UpdateStudentGroup updates an existing student group
func (h *StudentGroupHandler) UpdateStudentGroup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	// Verify student group exists
	existingGroup, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	var request struct {
		Name           string `json:"name" binding:"required"`
		DepartmentID   uint   `json:"department_id" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Update the group
	existingGroup.Name = request.Name
	existingGroup.DepartmentID = request.DepartmentID
	
	updatedGroup, err := h.repo.Update(*existingGroup)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": updatedGroup})
}

// DeleteStudentGroup deletes a student group
func (h *StudentGroupHandler) DeleteStudentGroup(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	// Verify student group exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Delete the group
	err = h.repo.Delete(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Student group deleted successfully"})
}

// GetGroupMembers returns all members of a student group
func (h *StudentGroupHandler) GetGroupMembers(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	// Verify student group exists
	_, err = h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Get group members
	students, err := h.repo.GetGroupMembers(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Initialize an empty array if no students found to avoid null in the response
	if students == nil {
		students = []models.Student{}
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": students})
}

// GetAvailableStudents returns students that can be added to a group based on department
func (h *StudentGroupHandler) GetAvailableStudents(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	// Verify student group exists and get its department
	group, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Get available students
	students, err := h.repo.GetAvailableStudents(uint(id), group.DepartmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Initialize an empty array if no students found to avoid null in the response
	if students == nil {
		students = []models.Student{}
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": students})
}

// AddStudentToGroup adds a student to a group
func (h *StudentGroupHandler) AddStudentToGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	var request struct {
		StudentID uint `json:"student_id" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Verify student group exists
	group, err := h.repo.GetByID(uint(groupID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Verify student exists
	student, err := h.studentRepo.FindByID(request.StudentID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student not found"})
		return
	}
	
	// Verify student matches the group's department
	if student.StudyProgramID != int(group.DepartmentID) {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Student's department does not match the group's department"})
		return
	}
	
	// Add student to group
	err = h.repo.AddStudentToGroup(uint(groupID), request.StudentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Student added to group successfully"})
}

// AddMultipleStudentsToGroup adds multiple students to a group
func (h *StudentGroupHandler) AddMultipleStudentsToGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	var request struct {
		StudentIDs []uint `json:"student_ids" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Verify student group exists
	_, err = h.repo.GetByID(uint(groupID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Add each student to the group
	var successCount int
	var failedStudents []uint
	
	for _, studentID := range request.StudentIDs {
		err = h.repo.AddStudentToGroup(uint(groupID), studentID)
		if err != nil {
			failedStudents = append(failedStudents, studentID)
		} else {
			successCount++
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Students added to group",
		"data": gin.H{
			"success_count": successCount,
			"failed_students": failedStudents,
		},
	})
}

// RemoveStudentFromGroup removes a student from a group
func (h *StudentGroupHandler) RemoveStudentFromGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	studentID, err := strconv.ParseUint(c.Param("student_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student ID"})
		return
	}
	
	// Verify student group exists
	_, err = h.repo.GetByID(uint(groupID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Remove student from group
	err = h.repo.RemoveStudentFromGroup(uint(groupID), uint(studentID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Student removed from group successfully"})
}

// RemoveMultipleStudentsFromGroup removes multiple students from a group
func (h *StudentGroupHandler) RemoveMultipleStudentsFromGroup(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Invalid student group ID"})
		return
	}
	
	var request struct {
		StudentIDs []uint `json:"student_ids" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": err.Error()})
		return
	}
	
	// Verify student group exists
	_, err = h.repo.GetByID(uint(groupID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Student group not found"})
		return
	}
	
	// Remove each student from the group
	var successCount int
	var failedStudents []uint
	
	for _, studentID := range request.StudentIDs {
		err = h.repo.RemoveStudentFromGroup(uint(groupID), studentID)
		if err != nil {
			failedStudents = append(failedStudents, studentID)
		} else {
			successCount++
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"message": "Students removed from group",
		"data": gin.H{
			"success_count": successCount,
			"failed_students": failedStudents,
		},
	})
} 