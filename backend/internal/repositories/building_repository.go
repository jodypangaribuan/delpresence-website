package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// BuildingRepository is a repository for building operations
type BuildingRepository struct {
	db *gorm.DB
}

// NewBuildingRepository creates a new building repository
func NewBuildingRepository() *BuildingRepository {
	return &BuildingRepository{
		db: database.GetDB(),
	}
}

// Create creates a new building
func (r *BuildingRepository) Create(building *models.Building) error {
	return r.db.Create(building).Error
}

// Update updates an existing building
func (r *BuildingRepository) Update(building *models.Building) error {
	return r.db.Save(building).Error
}

// FindByID finds a building by ID
func (r *BuildingRepository) FindByID(id uint) (*models.Building, error) {
	var building models.Building
	err := r.db.First(&building, id).Error
	if err != nil {
		return nil, err
	}
	return &building, nil
}

// FindByCode finds a building by code
func (r *BuildingRepository) FindByCode(code string) (*models.Building, error) {
	var building models.Building
	err := r.db.Where("code = ?", code).First(&building).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &building, nil
}

// FindAll finds all buildings
func (r *BuildingRepository) FindAll() ([]models.Building, error) {
	var buildings []models.Building
	err := r.db.Find(&buildings).Error
	if err != nil {
		return nil, err
	}
	return buildings, nil
}

// DeleteByID deletes a building by ID
func (r *BuildingRepository) DeleteByID(id uint) error {
	// Use Unscoped() to permanently delete the record instead of a soft delete
	return r.db.Unscoped().Delete(&models.Building{}, id).Error
}

// CountRooms counts the number of rooms in a building
func (r *BuildingRepository) CountRooms(buildingID uint) (int64, error) {
	var count int64
	err := r.db.Model(&models.Room{}).Where("building_id = ?", buildingID).Count(&count).Error
	return count, err
} 