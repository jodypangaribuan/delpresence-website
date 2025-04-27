package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// LecturerAssignmentRepository provides methods to interact with lecturer assignments in the database
type LecturerAssignmentRepository struct {
	db *gorm.DB
}

// NewLecturerAssignmentRepository creates a new lecturer assignment repository
func NewLecturerAssignmentRepository() *LecturerAssignmentRepository {
	return &LecturerAssignmentRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all lecturer assignments for a specific academic year
func (r *LecturerAssignmentRepository) GetAll(academicYearID uint) ([]models.LecturerAssignment, error) {
	var assignments []models.LecturerAssignment
	err := r.db.Preload("Lecturer").
		Preload("Course").
		Preload("AcademicYear").
		Where("academic_year_id = ?", academicYearID).
		Find(&assignments).Error
	return assignments, err
}

// GetByID returns a lecturer assignment by ID
func (r *LecturerAssignmentRepository) GetByID(id uint) (models.LecturerAssignment, error) {
	var assignment models.LecturerAssignment
	err := r.db.Preload("Lecturer").
		Preload("Course").
		Preload("AcademicYear").
		First(&assignment, id).Error
	if err == gorm.ErrRecordNotFound {
		return models.LecturerAssignment{}, nil
	}
	return assignment, err
}

// GetByLecturerID returns all assignments for a specific lecturer in an academic year
func (r *LecturerAssignmentRepository) GetByLecturerID(userID, academicYearID uint) ([]models.LecturerAssignment, error) {
	var assignments []models.LecturerAssignment
	err := r.db.Preload("Lecturer").
		Preload("Course").
		Preload("AcademicYear").
		Where("user_id = ? AND academic_year_id = ?", userID, academicYearID).
		Find(&assignments).Error
	return assignments, err
}

// GetByCourseID returns all assignments for a specific course in an academic year
func (r *LecturerAssignmentRepository) GetByCourseID(courseID, academicYearID uint) ([]models.LecturerAssignment, error) {
	var assignments []models.LecturerAssignment
	err := r.db.Preload("Lecturer").
		Preload("Course").
		Preload("AcademicYear").
		Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID).
		Find(&assignments).Error
	return assignments, err
}

// Create creates a new lecturer assignment
func (r *LecturerAssignmentRepository) Create(assignment *models.LecturerAssignment) error {
	return r.db.Create(assignment).Error
}

// Update updates a lecturer assignment
func (r *LecturerAssignmentRepository) Update(assignment *models.LecturerAssignment) error {
	return r.db.Save(assignment).Error
}

// Delete deletes a lecturer assignment
func (r *LecturerAssignmentRepository) Delete(id uint) error {
	return r.db.Delete(&models.LecturerAssignment{}, id).Error
}

// AssignmentExists checks if a lecturer is already assigned to a course in an academic year
func (r *LecturerAssignmentRepository) AssignmentExists(userID, courseID, academicYearID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.LecturerAssignment{}).
		Where("user_id = ? AND course_id = ? AND academic_year_id = ?", userID, courseID, academicYearID).
		Count(&count).Error
	return count > 0, err
}

// GetAvailableLecturers returns lecturers who are not assigned to the specified course in an academic year
func (r *LecturerAssignmentRepository) GetAvailableLecturers(courseID, academicYearID uint) ([]models.Lecturer, error) {
	var lecturers []models.Lecturer
	
	// Get UserIDs of lecturers already assigned to this course in this academic year
	subQuery := r.db.Model(&models.LecturerAssignment{}).
		Select("user_id").
		Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID)
	
	// Get all lecturers not in the assigned list - checking against UserID column
	err := r.db.Where("user_id NOT IN (?)", subQuery).
		Find(&lecturers).Error
	
	return lecturers, err
}

// GetLecturerAssignmentResponses returns all lecturer assignments with detailed information
func (r *LecturerAssignmentRepository) GetLecturerAssignmentResponses() ([]models.LecturerAssignmentResponse, error) {
	var responses []models.LecturerAssignmentResponse
	
	result := r.db.Model(&models.LecturerAssignment{}).
		Select("lecturer_assignments.id, lecturer_assignments.user_id, lecturers.full_name as lecturer_name, "+
			"lecturer_assignments.course_id, courses.code as course_code, courses.name as course_name, "+
			"lecturer_assignments.academic_year, lecturer_assignments.semester, "+
			"lecturer_assignments.created_at, lecturer_assignments.updated_at").
		Joins("LEFT JOIN lecturers ON lecturer_assignments.user_id = lecturers.user_id").
		Joins("LEFT JOIN courses ON lecturer_assignments.course_id = courses.id").
		Where("lecturer_assignments.deleted_at IS NULL").
		Find(&responses)
	
	return responses, result.Error
}

// GetLecturerAssignmentResponseByID returns a specific lecturer assignment with detailed information
func (r *LecturerAssignmentRepository) GetLecturerAssignmentResponseByID(id uint) (*models.LecturerAssignmentResponse, error) {
	var response models.LecturerAssignmentResponse
	
	result := r.db.Model(&models.LecturerAssignment{}).
		Select("lecturer_assignments.id, lecturer_assignments.user_id, lecturers.full_name as lecturer_name, "+
			"lecturer_assignments.course_id, courses.code as course_code, courses.name as course_name, "+
			"lecturer_assignments.academic_year, lecturer_assignments.semester, "+
			"lecturer_assignments.created_at, lecturer_assignments.updated_at").
		Joins("LEFT JOIN lecturers ON lecturer_assignments.user_id = lecturers.user_id").
		Joins("LEFT JOIN courses ON lecturer_assignments.course_id = courses.id").
		Where("lecturer_assignments.id = ? AND lecturer_assignments.deleted_at IS NULL", id).
		First(&response)
	
	return &response, result.Error
} 