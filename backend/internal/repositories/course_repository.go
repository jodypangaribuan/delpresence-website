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