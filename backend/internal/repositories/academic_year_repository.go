package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
	"time"
)

// AcademicYearRepository is a repository for academic year operations
type AcademicYearRepository struct {
	db *gorm.DB
}

// NewAcademicYearRepository creates a new academic year repository
func NewAcademicYearRepository() *AcademicYearRepository {
	return &AcademicYearRepository{
		db: database.GetDB(),
	}
}

// Create creates a new academic year
func (r *AcademicYearRepository) Create(academicYear *models.AcademicYear) error {
	return r.db.Create(academicYear).Error
}

// Update updates an existing academic year
func (r *AcademicYearRepository) Update(academicYear *models.AcademicYear) error {
	return r.db.Save(academicYear).Error
}

// FindByID finds an academic year by ID
func (r *AcademicYearRepository) FindByID(id uint) (*models.AcademicYear, error) {
	var academicYear models.AcademicYear
	err := r.db.First(&academicYear, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &academicYear, nil
}

// FindByName finds an academic year by name
func (r *AcademicYearRepository) FindByName(name string) (*models.AcademicYear, error) {
	var academicYear models.AcademicYear
	err := r.db.Where("name = ?", name).First(&academicYear).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &academicYear, nil
}

// FindByNameIncludingDeleted finds an academic year by name including soft-deleted records
func (r *AcademicYearRepository) FindByNameIncludingDeleted(name string) (*models.AcademicYear, error) {
	var academicYear models.AcademicYear
	err := r.db.Unscoped().Where("name = ?", name).First(&academicYear).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &academicYear, nil
}

// FindAll finds all academic years
func (r *AcademicYearRepository) FindAll() ([]models.AcademicYear, error) {
	var academicYears []models.AcademicYear
	err := r.db.Find(&academicYears).Error
	if err != nil {
		return nil, err
	}
	return academicYears, nil
}

// DeleteByID deletes an academic year by ID
func (r *AcademicYearRepository) DeleteByID(id uint) error {
	return r.db.Delete(&models.AcademicYear{}, id).Error
}

// RestoreSoftDeletedByName finds a soft-deleted academic year by name and restores it with new data
func (r *AcademicYearRepository) RestoreSoftDeletedByName(name string, newData *models.AcademicYear) (*models.AcademicYear, error) {
	var academicYear models.AcademicYear
	
	// Find the soft-deleted record
	err := r.db.Unscoped().Where("name = ? AND deleted_at IS NOT NULL", name).First(&academicYear).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // No soft-deleted record found
		}
		return nil, err
	}
	
	// Update the record with new data and clear the DeletedAt field
	err = r.db.Unscoped().Model(&academicYear).Updates(map[string]interface{}{
		"start_date": newData.StartDate,
		"end_date":   newData.EndDate,
		"semester":   newData.Semester,
		"deleted_at": nil, // This clears the DeletedAt field, effectively restoring the record
	}).Error
	
	if err != nil {
		return nil, err
	}
	
	// Return the restored record with its ID
	newData.ID = academicYear.ID
	return newData, nil
}

// GetActiveAcademicYear returns the currently active academic year
// An academic year is considered active if the current date falls between its start and end dates
func (r *AcademicYearRepository) GetActiveAcademicYear() (*models.AcademicYear, error) {
	var academicYear models.AcademicYear
	now := time.Now()
	
	err := r.db.Where("start_date <= ? AND end_date >= ?", now, now).First(&academicYear).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // No active academic year found
		}
		return nil, err
	}
	
	return &academicYear, nil
} 