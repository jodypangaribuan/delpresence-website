package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// LecturerRepository is a repository for lecturer operations
type LecturerRepository struct {
	db *gorm.DB
}

// NewLecturerRepository creates a new lecturer repository
func NewLecturerRepository() *LecturerRepository {
	return &LecturerRepository{
		db: database.GetDB(),
	}
}

// Create creates a new lecturer
func (r *LecturerRepository) Create(lecturer *models.Lecturer) error {
	return r.db.Create(lecturer).Error
}

// Update updates an existing lecturer
func (r *LecturerRepository) Update(lecturer *models.Lecturer) error {
	return r.db.Save(lecturer).Error
}

// FindByID finds a lecturer by ID
func (r *LecturerRepository) FindByID(id uint) (*models.Lecturer, error) {
	var lecturer models.Lecturer
	err := r.db.First(&lecturer, id).Error
	if err != nil {
		return nil, err
	}
	return &lecturer, nil
}

// FindByLecturerID finds a lecturer by lecturer_id from campus
func (r *LecturerRepository) FindByLecturerID(lecturerID int) (*models.Lecturer, error) {
	var lecturer models.Lecturer
	err := r.db.Where("lecturer_id = ?", lecturerID).First(&lecturer).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &lecturer, nil
}

// FindAll finds all lecturers
func (r *LecturerRepository) FindAll() ([]models.Lecturer, error) {
	var lecturers []models.Lecturer
	err := r.db.Preload("StudyProgram").Find(&lecturers).Error
	if err != nil {
		return nil, err
	}
	return lecturers, nil
}

// DeleteByID deletes a lecturer by ID
func (r *LecturerRepository) DeleteByID(id uint) error {
	return r.db.Delete(&models.Lecturer{}, id).Error
}

// Upsert creates or updates a lecturer
func (r *LecturerRepository) Upsert(lecturer *models.Lecturer) error {
	// Find existing lecturer by lecturer ID
	existing, err := r.FindByLecturerID(lecturer.LecturerID)
	if err != nil {
		return err
	}

	// If lecturer exists, update it
	if existing != nil {
		lecturer.ID = existing.ID
		return r.Update(lecturer)
	}

	// Otherwise, create new lecturer
	return r.Create(lecturer)
}

// UpsertMany creates or updates multiple lecturers
func (r *LecturerRepository) UpsertMany(lecturers []models.Lecturer) error {
	// Start a transaction
	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	// Process each lecturer
	for i := range lecturers {
		if err := r.Upsert(&lecturers[i]); err != nil {
			tx.Rollback()
			return err
		}
	}

	// Commit the transaction
	return tx.Commit().Error
}

// Search finds lecturers by name, NIDN, or other criteria
func (r *LecturerRepository) Search(query string) ([]models.Lecturer, error) {
	var lecturers []models.Lecturer
	
	// Create the LIKE search pattern
	searchPattern := "%" + query + "%"
	
	// Search for matching lecturers using the correct database column names
	err := r.db.Where("full_name ILIKE ?", searchPattern).
		Or("n_ip ILIKE ?", searchPattern).
		Or("n_id_n ILIKE ?", searchPattern).
		Limit(10). // Limit results to prevent performance issues
		Find(&lecturers).Error
	
	if err != nil {
		return nil, err
	}
	
	return lecturers, nil
}

// GetByUserID finds a lecturer by their UserID (external ID from campus API)
func (r *LecturerRepository) GetByUserID(userID int) (models.Lecturer, error) {
	var lecturer models.Lecturer
	
	err := r.db.Where("user_id = ?", userID).First(&lecturer).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Lecturer{}, nil
		}
		return models.Lecturer{}, err
	}
	return lecturer, nil
}

// GetByID finds a lecturer by their ID
func (r *LecturerRepository) GetByID(id uint) (models.Lecturer, error) {
	var lecturer models.Lecturer
	
	err := r.db.Where("id = ?", id).First(&lecturer).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return models.Lecturer{}, nil
		}
		return models.Lecturer{}, err
	}
	return lecturer, nil
} 