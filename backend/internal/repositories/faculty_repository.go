package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// FacultyRepository is a repository for faculty operations
type FacultyRepository struct {
	db *gorm.DB
}

// NewFacultyRepository creates a new faculty repository
func NewFacultyRepository() *FacultyRepository {
	return &FacultyRepository{
		db: database.GetDB(),
	}
}

// Create creates a new faculty
func (r *FacultyRepository) Create(faculty *models.Faculty) error {
	return r.db.Create(faculty).Error
}

// Update updates an existing faculty
func (r *FacultyRepository) Update(faculty *models.Faculty) error {
	return r.db.Save(faculty).Error
}

// FindByID finds a faculty by ID
func (r *FacultyRepository) FindByID(id uint) (*models.Faculty, error) {
	var faculty models.Faculty
	err := r.db.First(&faculty, id).Error
	if err != nil {
		return nil, err
	}
	return &faculty, nil
}

// FindByCode finds a faculty by code
func (r *FacultyRepository) FindByCode(code string) (*models.Faculty, error) {
	var faculty models.Faculty
	err := r.db.Where("code = ?", code).First(&faculty).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &faculty, nil
}

// FindDeletedByCode finds a soft-deleted faculty by code
func (r *FacultyRepository) FindDeletedByCode(code string) (*models.Faculty, error) {
	var faculty models.Faculty
	err := r.db.Unscoped().Where("code = ? AND deleted_at IS NOT NULL", code).First(&faculty).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &faculty, nil
}

// RestoreByCode restores a soft-deleted faculty by code
func (r *FacultyRepository) RestoreByCode(code string) (*models.Faculty, error) {
	// Find the deleted record
	deletedFaculty, err := r.FindDeletedByCode(code)
	if err != nil {
		return nil, err
	}
	if deletedFaculty == nil {
		return nil, nil
	}
	
	// Restore the record
	if err := r.db.Unscoped().Model(&models.Faculty{}).Where("id = ?", deletedFaculty.ID).Update("deleted_at", nil).Error; err != nil {
		return nil, err
	}
	
	// Return the restored record
	return r.FindByID(deletedFaculty.ID)
}

// CheckCodeExists checks if a code exists, including soft-deleted records
func (r *FacultyRepository) CheckCodeExists(code string, excludeID uint) (bool, error) {
	var count int64
	query := r.db.Unscoped().Model(&models.Faculty{}).Where("code = ?", code)
	
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

// FindAll finds all faculties
func (r *FacultyRepository) FindAll() ([]models.Faculty, error) {
	var faculties []models.Faculty
	err := r.db.Find(&faculties).Error
	if err != nil {
		return nil, err
	}
	return faculties, nil
}

// DeleteByID deletes a faculty by ID
func (r *FacultyRepository) DeleteByID(id uint) error {
	// Use Delete() without Unscoped() to perform a soft delete
	return r.db.Delete(&models.Faculty{}, id).Error
}

// GetFacultyStats gets statistics for a faculty including study program count
func (r *FacultyRepository) GetFacultyStats(facultyID uint) (map[string]int64, error) {
	stats := make(map[string]int64)
	
	// Count study programs
	var programCount int64
	if err := r.db.Model(&models.StudyProgram{}).Where("faculty_id = ?", facultyID).Count(&programCount).Error; err != nil {
		return nil, err
	}
	stats["program_count"] = programCount
	
	// Count lecturers (if we have the relationship)
	var lecturerCount int64
	if err := r.db.Model(&models.Lecturer{}).
		Joins("JOIN study_programs ON lecturers.study_program_id = study_programs.id").
		Where("study_programs.faculty_id = ?", facultyID).
		Count(&lecturerCount).Error; err != nil {
		return nil, err
	}
	stats["lecturer_count"] = lecturerCount
	
	return stats, nil
}

// CountStudyPrograms counts the number of study programs in a faculty
func (r *FacultyRepository) CountStudyPrograms(facultyID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.StudyProgram{}).Where("faculty_id = ?", facultyID).Count(&count).Error
	return count, err
} 