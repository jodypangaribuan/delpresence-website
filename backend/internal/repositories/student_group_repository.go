package repositories

import (
	"errors"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// StudentGroupRepository handles database operations for student groups
type StudentGroupRepository struct {
	db *gorm.DB
}

// NewStudentGroupRepository creates a new student group repository
func NewStudentGroupRepository() *StudentGroupRepository {
	return &StudentGroupRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all student groups
func (r *StudentGroupRepository) GetAll() ([]models.StudentGroup, error) {
	var groups []models.StudentGroup
	result := r.db.Preload("Department").Find(&groups)

	// Calculate student count for each group
	for i := range groups {
		var count int64
		r.db.Model(&models.StudentToGroup{}).Where("student_group_id = ?", groups[i].ID).Count(&count)
		groups[i].StudentCount = int(count)
	}

	return groups, result.Error
}

// GetByID returns a student group by ID
func (r *StudentGroupRepository) GetByID(id uint) (*models.StudentGroup, error) {
	var group models.StudentGroup
	result := r.db.Preload("Department").First(&group, id)
	if result.Error != nil {
		return nil, result.Error
	}

	// Get student count
	var count int64
	r.db.Model(&models.StudentToGroup{}).Where("student_group_id = ?", group.ID).Count(&count)
	group.StudentCount = int(count)

	return &group, nil
}

// GetByDepartment returns student groups filtered by department
func (r *StudentGroupRepository) GetByDepartment(departmentID uint) ([]models.StudentGroup, error) {
	var groups []models.StudentGroup
	result := r.db.Where("department_id = ?", departmentID).Preload("Department").Find(&groups)

	// Calculate student count for each group
	for i := range groups {
		var count int64
		r.db.Model(&models.StudentToGroup{}).Where("student_group_id = ?", groups[i].ID).Count(&count)
		groups[i].StudentCount = int(count)
	}

	return groups, result.Error
}

// GetBySemester returns student groups filtered by semester
// This function is deprecated and will be removed
func (r *StudentGroupRepository) GetBySemester(semester int) ([]models.StudentGroup, error) {
	var groups []models.StudentGroup
	result := r.db.Preload("Department").Find(&groups)

	// Calculate student count for each group
	for i := range groups {
		var count int64
		r.db.Model(&models.StudentToGroup{}).Where("student_group_id = ?", groups[i].ID).Count(&count)
		groups[i].StudentCount = int(count)
	}

	return groups, result.Error
}

// Create creates a new student group
func (r *StudentGroupRepository) Create(group models.StudentGroup) (*models.StudentGroup, error) {
	result := r.db.Create(&group)
	if result.Error != nil {
		return nil, result.Error
	}
	return &group, nil
}

// Update updates an existing student group
func (r *StudentGroupRepository) Update(group models.StudentGroup) (*models.StudentGroup, error) {
	result := r.db.Save(&group)
	if result.Error != nil {
		return nil, result.Error
	}
	return &group, nil
}

// Delete deletes a student group
func (r *StudentGroupRepository) Delete(id uint) error {
	// Begin a transaction
	tx := r.db.Begin()

	// Delete all student associations first
	if err := tx.Where("student_group_id = ?", id).Delete(&models.StudentToGroup{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Then delete the group
	if err := tx.Delete(&models.StudentGroup{}, id).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// GetGroupMembers returns all students in a specific group
func (r *StudentGroupRepository) GetGroupMembers(groupID uint) ([]models.Student, error) {
	var students []models.Student

	// Join with the pivot table to get students in the group using both IDs
	// This query ensures we get the current student records even if IDs have changed
	result := r.db.Raw(`
		SELECT s.* FROM students s
		JOIN student_to_groups stg ON s.user_id = stg.user_id
		WHERE stg.student_group_id = ?
	`, groupID).Scan(&students)

	return students, result.Error
}

// AddStudentToGroup adds a student to a group
func (r *StudentGroupRepository) AddStudentToGroup(groupID, studentID uint) error {
	// Check if student is already in the group by UserID
	var student models.Student
	if err := r.db.First(&student, studentID).Error; err != nil {
		return err
	}

	var count int64
	r.db.Model(&models.StudentToGroup{}).
		Where("student_group_id = ? AND user_id = ?", groupID, student.UserID).
		Count(&count)

	if count > 0 {
		return errors.New("student is already in this group")
	}

	// Add student to group with their UserID
	association := models.StudentToGroup{
		StudentGroupID: groupID,
		StudentID:      studentID,
		UserID:         student.UserID,
	}

	return r.db.Create(&association).Error
}

// RemoveStudentFromGroup removes a student from a group
func (r *StudentGroupRepository) RemoveStudentFromGroup(groupID, studentID uint) error {
	// First get the student to find their UserID
	var student models.Student
	if err := r.db.First(&student, studentID).Error; err != nil {
		return err
	}

	// Now remove by UserID instead of StudentID to ensure it works even if StudentID has changed
	result := r.db.Where("student_group_id = ? AND user_id = ?", groupID, student.UserID).
		Delete(&models.StudentToGroup{})

	if result.RowsAffected == 0 {
		return errors.New("student is not in this group")
	}

	return result.Error
}

// IsStudentInGroup checks if a student is already in a group
func (r *StudentGroupRepository) IsStudentInGroup(groupID, studentID uint) (bool, error) {
	// Get the student first to access their UserID
	var student models.Student
	if err := r.db.First(&student, studentID).Error; err != nil {
		return false, err
	}

	// Check using UserID instead of StudentID
	var count int64
	result := r.db.Model(&models.StudentToGroup{}).
		Where("student_group_id = ? AND user_id = ?", groupID, student.UserID).
		Count(&count)

	return count > 0, result.Error
}

// GetStudentGroups returns all groups that a student belongs to
func (r *StudentGroupRepository) GetStudentGroups(studentID uint) ([]models.StudentGroup, error) {
	var groups []models.StudentGroup

	// Join with the pivot table to get groups the student belongs to
	result := r.db.Joins("JOIN student_to_groups ON student_groups.id = student_to_groups.student_group_id").
		Where("student_to_groups.student_id = ?", studentID).
		Preload("Department").
		Find(&groups)

	// Calculate student count for each group
	for i := range groups {
		var count int64
		r.db.Model(&models.StudentToGroup{}).Where("student_group_id = ?", groups[i].ID).Count(&count)
		groups[i].StudentCount = int(count)
	}

	return groups, result.Error
}

// GetAvailableStudents returns all students that are not in the group
func (r *StudentGroupRepository) GetAvailableStudents(groupID uint, departmentID uint) ([]models.Student, error) {
	var students []models.Student

	// Find all students who are not in the group by UserID rather than StudentID
	result := r.db.Raw(`
		SELECT * FROM students 
		WHERE user_id NOT IN (
			SELECT user_id FROM student_to_groups 
			WHERE student_group_id = ?
		)
	`, groupID).Scan(&students)

	return students, result.Error
}

// GetGroupsByStudentID returns all student groups that a student belongs to
func (r *StudentGroupRepository) GetGroupsByStudentID(studentID uint) ([]models.StudentGroup, error) {
	var groups []models.StudentGroup

	// Find all groups this student belongs to using the join table
	err := r.db.
		Joins("JOIN student_to_groups ON student_to_groups.student_group_id = student_groups.id").
		Where("student_to_groups.student_id = ?", studentID).
		Find(&groups).Error

	return groups, err
}
