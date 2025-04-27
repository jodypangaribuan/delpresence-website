package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// CourseGroupRepository handles database operations for course groups
type CourseGroupRepository struct {
	db *gorm.DB
}

// NewCourseGroupRepository creates a new instance of CourseGroupRepository
func NewCourseGroupRepository() *CourseGroupRepository {
	return &CourseGroupRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all course groups with their courses
func (r *CourseGroupRepository) GetAll() ([]models.CourseGroup, error) {
	var groups []models.CourseGroup
	err := r.db.Preload("Department").Preload("Faculty").Preload("Courses").Find(&groups).Error
	
	// Calculate statistics for each group
	for i := range groups {
		groups[i].CalculateStats()
	}
	
	return groups, err
}

// GetByID returns a course group by its ID
func (r *CourseGroupRepository) GetByID(id uint) (models.CourseGroup, error) {
	var group models.CourseGroup
	err := r.db.Preload("Department").Preload("Faculty").Preload("Courses").First(&group, id).Error
	
	// Calculate statistics
	group.CalculateStats()
	
	return group, err
}

// Create creates a new course group
func (r *CourseGroupRepository) Create(group models.CourseGroup, courseIDs []uint) (models.CourseGroup, error) {
	tx := r.db.Begin()
	
	// Create the group first
	if err := tx.Create(&group).Error; err != nil {
		tx.Rollback()
		return group, err
	}
	
	// Associate courses if provided
	if len(courseIDs) > 0 {
		for _, courseID := range courseIDs {
			association := models.CourseToGroup{
				CourseID:      courseID,
				CourseGroupID: group.ID,
			}
			if err := tx.Create(&association).Error; err != nil {
				tx.Rollback()
				return group, err
			}
		}
	}
	
	tx.Commit()
	
	// Reload the group with courses and calculate stats
	r.db.Preload("Department").Preload("Faculty").Preload("Courses").First(&group, group.ID)
	group.CalculateStats()
	
	return group, nil
}

// Update updates an existing course group
func (r *CourseGroupRepository) Update(group models.CourseGroup, courseIDs []uint) (models.CourseGroup, error) {
	tx := r.db.Begin()
	
	// Update basic group information
	if err := tx.Save(&group).Error; err != nil {
		tx.Rollback()
		return group, err
	}
	
	// Delete existing course associations
	if err := tx.Where("course_group_id = ?", group.ID).Delete(&models.CourseToGroup{}).Error; err != nil {
		tx.Rollback()
		return group, err
	}
	
	// Create new course associations
	if len(courseIDs) > 0 {
		for _, courseID := range courseIDs {
			association := models.CourseToGroup{
				CourseID:      courseID,
				CourseGroupID: group.ID,
			}
			if err := tx.Create(&association).Error; err != nil {
				tx.Rollback()
				return group, err
			}
		}
	}
	
	tx.Commit()
	
	// Reload the group with courses and calculate stats
	r.db.Preload("Department").Preload("Faculty").Preload("Courses").First(&group, group.ID)
	group.CalculateStats()
	
	return group, nil
}

// Delete deletes a course group
func (r *CourseGroupRepository) Delete(id uint) error {
	tx := r.db.Begin()
	
	// Delete course associations first
	if err := tx.Where("course_group_id = ?", id).Delete(&models.CourseToGroup{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	
	// Delete the group
	if err := tx.Delete(&models.CourseGroup{}, id).Error; err != nil {
		tx.Rollback()
		return err
	}
	
	return tx.Commit().Error
}

// GetByDepartment returns course groups by department ID
func (r *CourseGroupRepository) GetByDepartment(departmentID uint) ([]models.CourseGroup, error) {
	var groups []models.CourseGroup
	err := r.db.Preload("Department").Preload("Faculty").Preload("Courses").
		Where("department_id = ?", departmentID).
		Find(&groups).Error
	
	// Calculate statistics for each group
	for i := range groups {
		groups[i].CalculateStats()
	}
	
	return groups, err
}

// IsCourseInAnyGroup checks if a course is already in a group
func (r *CourseGroupRepository) IsCourseInAnyGroup(courseID uint) (bool, uint, error) {
	var association models.CourseToGroup
	result := r.db.Where("course_id = ?", courseID).First(&association)
	
	if result.Error == gorm.ErrRecordNotFound {
		return false, 0, nil
	}
	
	if result.Error != nil {
		return false, 0, result.Error
	}
	
	return true, association.CourseGroupID, nil
} 