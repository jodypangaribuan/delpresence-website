package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// StudyProgramRepository is a repository for study program operations
type StudyProgramRepository struct {
	db *gorm.DB
}

// NewStudyProgramRepository creates a new study program repository
func NewStudyProgramRepository() *StudyProgramRepository {
	return &StudyProgramRepository{
		db: database.GetDB(),
	}
}

// Create creates a new study program
func (r *StudyProgramRepository) Create(program *models.StudyProgram) error {
	return r.db.Create(program).Error
}

// Update updates an existing study program
func (r *StudyProgramRepository) Update(program *models.StudyProgram) error {
	return r.db.Save(program).Error
}

// FindByID finds a study program by ID
func (r *StudyProgramRepository) FindByID(id uint) (*models.StudyProgram, error) {
	var program models.StudyProgram
	err := r.db.Preload("Faculty").First(&program, id).Error
	if err != nil {
		return nil, err
	}
	return &program, nil
}

// FindByCode finds a study program by code
func (r *StudyProgramRepository) FindByCode(code string) (*models.StudyProgram, error) {
	var program models.StudyProgram
	err := r.db.Preload("Faculty").Where("code = ?", code).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &program, nil
}

// FindAll finds all study programs
func (r *StudyProgramRepository) FindAll() ([]models.StudyProgram, error) {
	var programs []models.StudyProgram
	err := r.db.Preload("Faculty").Find(&programs).Error
	if err != nil {
		return nil, err
	}
	return programs, nil
}

// FindByFacultyID finds all study programs by faculty ID
func (r *StudyProgramRepository) FindByFacultyID(facultyID uint) ([]models.StudyProgram, error) {
	var programs []models.StudyProgram
	err := r.db.Preload("Faculty").Where("faculty_id = ?", facultyID).Find(&programs).Error
	if err != nil {
		return nil, err
	}
	return programs, nil
}

// DeleteByID deletes a study program by ID
func (r *StudyProgramRepository) DeleteByID(id uint) error {
	// Use Unscoped() to permanently delete the record instead of a soft delete
	return r.db.Unscoped().Delete(&models.StudyProgram{}, id).Error
}

// GetStudyProgramStats gets statistics for a study program
func (r *StudyProgramRepository) GetStudyProgramStats(programID uint) (map[string]int64, error) {
	stats := make(map[string]int64)
	
	// Count lecturers in this program
	var lecturerCount int64
	if err := r.db.Model(&models.Lecturer{}).Where("study_program_id = ?", programID).Count(&lecturerCount).Error; err != nil {
		return nil, err
	}
	stats["lecturer_count"] = lecturerCount
	
	return stats, nil
} 