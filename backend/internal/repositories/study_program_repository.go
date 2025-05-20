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

// FindDeletedByCode finds a soft-deleted study program by code
func (r *StudyProgramRepository) FindDeletedByCode(code string) (*models.StudyProgram, error) {
	var program models.StudyProgram
	err := r.db.Unscoped().Preload("Faculty").Where("code = ? AND deleted_at IS NOT NULL", code).First(&program).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &program, nil
}

// RestoreByCode restores a soft-deleted study program by code
func (r *StudyProgramRepository) RestoreByCode(code string) (*models.StudyProgram, error) {
	// Find the deleted record
	deletedProgram, err := r.FindDeletedByCode(code)
	if err != nil {
		return nil, err
	}
	if deletedProgram == nil {
		return nil, nil
	}
	
	// Restore the record
	if err := r.db.Unscoped().Model(&models.StudyProgram{}).Where("id = ?", deletedProgram.ID).Update("deleted_at", nil).Error; err != nil {
		return nil, err
	}
	
	// Return the restored record
	return r.FindByID(deletedProgram.ID)
}

// CheckCodeExists checks if a code exists, including soft-deleted records
func (r *StudyProgramRepository) CheckCodeExists(code string, excludeID uint) (bool, error) {
	var count int64
	query := r.db.Unscoped().Model(&models.StudyProgram{}).Where("code = ?", code)
	
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
	// Use Delete() without Unscoped() to perform a soft delete
	return r.db.Delete(&models.StudyProgram{}, id).Error
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