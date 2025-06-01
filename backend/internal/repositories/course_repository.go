package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// CourseRepository handles database operations for courses
type CourseRepository struct {
	db *gorm.DB
}

// NewCourseRepository creates a new instance of CourseRepository
func NewCourseRepository() *CourseRepository {
	return &CourseRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all courses
func (r *CourseRepository) GetAll() ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").Find(&courses).Error
	return courses, err
}

// GetByID returns a course by its ID
func (r *CourseRepository) GetByID(id uint) (models.Course, error) {
	var course models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").First(&course, id).Error
	return course, err
}

// FindByID returns a course by its ID as a pointer
func (r *CourseRepository) FindByID(id uint) (*models.Course, error) {
	var course models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").First(&course, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &course, nil
}

// Create creates a new course
func (r *CourseRepository) Create(course models.Course) (models.Course, error) {
	err := r.db.Create(&course).Error
	return course, err
}

// Update updates an existing course
func (r *CourseRepository) Update(course models.Course) (models.Course, error) {
	err := r.db.Save(&course).Error
	return course, err
}

// Delete deletes a course
func (r *CourseRepository) Delete(id uint) error {
	return r.db.Delete(&models.Course{}, id).Error
}

// GetByDepartment returns courses by department ID
func (r *CourseRepository) GetByDepartment(departmentID uint) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").
		Where("department_id = ?", departmentID).
		Find(&courses).Error
	return courses, err
}

// GetByAcademicYear returns courses by academic year ID
func (r *CourseRepository) GetByAcademicYear(academicYearID uint) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").
		Where("academic_year_id = ?", academicYearID).
		Find(&courses).Error
	return courses, err
}

// GetBySemester returns courses by semester
func (r *CourseRepository) GetBySemester(semester int) ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").
		Where("semester = ?", semester).
		Find(&courses).Error
	return courses, err
}

// GetByActiveAcademicYear returns courses from the active academic year
func (r *CourseRepository) GetByActiveAcademicYear() ([]models.Course, error) {
	var courses []models.Course
	err := r.db.Preload("Department").Preload("Faculty").Preload("AcademicYear").
		Joins("JOIN academic_years ON courses.academic_year_id = academic_years.id").
		Where("academic_years.is_active = ?", true).
		Find(&courses).Error
	return courses, err
}

// FindDeletedByCode finds a soft-deleted course by code
func (r *CourseRepository) FindDeletedByCode(code string) (*models.Course, error) {
	var course models.Course
	err := r.db.Unscoped().
		Preload("Department").
		Preload("Faculty").
		Preload("AcademicYear").
		Where("code = ? AND deleted_at IS NOT NULL", code).
		First(&course).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &course, nil
}

// RestoreByCode restores a soft-deleted course by code
func (r *CourseRepository) RestoreByCode(code string) (*models.Course, error) {
	// Find the deleted record
	deletedCourse, err := r.FindDeletedByCode(code)
	if err != nil {
		return nil, err
	}
	if deletedCourse == nil {
		return nil, nil
	}

	// Restore the record
	if err := r.db.Unscoped().Model(&models.Course{}).Where("id = ?", deletedCourse.ID).Update("deleted_at", nil).Error; err != nil {
		return nil, err
	}

	// Return the restored record
	return r.FindByID(deletedCourse.ID)
}

// CheckCodeExists checks if a code exists, including soft-deleted records
func (r *CourseRepository) CheckCodeExists(code string, excludeID uint) (bool, error) {
	var count int64
	query := r.db.Unscoped().Model(&models.Course{}).Where("code = ?", code)

	// Exclude the current record if updating
	if excludeID > 0 {
		query = query.Where("id != ?", excludeID)
	}

	err := query.Count(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
