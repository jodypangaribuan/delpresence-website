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
	// Use Unscoped() to permanently delete the record instead of a soft delete
	return r.db.Unscoped().Delete(&models.Faculty{}, id).Error
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