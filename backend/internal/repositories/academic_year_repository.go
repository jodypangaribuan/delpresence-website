package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
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

// CountActive counts the number of active academic years
func (r *AcademicYearRepository) CountActive() (int64, error) {
	var count int64
	err := r.db.Model(&models.AcademicYear{}).Where("is_active = ?", true).Count(&count).Error
	return count, err
}

// ActivateByID activates an academic year and deactivates all others
func (r *AcademicYearRepository) ActivateByID(id uint) error {
	// Start a transaction
	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Deactivate all academic years with a proper WHERE condition
	if err := tx.Model(&models.AcademicYear{}).Where("id <> ?", id).Update("is_active", false).Error; err != nil {
		tx.Rollback()
		return err
	}

	// Activate the specified academic year
	if err := tx.Model(&models.AcademicYear{}).Where("id = ?", id).Update("is_active", true).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// DeactivateAll deactivates all academic years
func (r *AcademicYearRepository) DeactivateAll() error {
	// Add a WHERE condition to prevent the "WHERE conditions required" error
	return r.db.Model(&models.AcademicYear{}).Where("is_active = ?", true).Update("is_active", false).Error
}

// FindActive finds the active academic year
func (r *AcademicYearRepository) FindActive() (*models.AcademicYear, error) {
	var academicYear models.AcademicYear
	err := r.db.Where("is_active = ?", true).First(&academicYear).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &academicYear, nil
}

// GetActiveAcademicYear returns the active academic year
// This is an alias for FindActive to maintain compatibility with handler usage
func (r *AcademicYearRepository) GetActiveAcademicYear() (*models.AcademicYear, error) {
	return r.FindActive()
} 