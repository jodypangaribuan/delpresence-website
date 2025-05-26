package repositories

import (
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// RoomRepository is a repository for room operations
type RoomRepository struct {
	db *gorm.DB
}

// NewRoomRepository creates a new room repository
func NewRoomRepository() *RoomRepository {
	return &RoomRepository{
		db: database.GetDB(),
	}
}

// Create creates a new room
func (r *RoomRepository) Create(room *models.Room) error {
	return r.db.Create(room).Error
}

// Update updates an existing room
func (r *RoomRepository) Update(room *models.Room) error {
	return r.db.Save(room).Error
}

// FindByID finds a room by ID
func (r *RoomRepository) FindByID(id uint) (*models.Room, error) {
	var room models.Room
	err := r.db.Preload("Building").First(&room, id).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

// FindByCode finds a room by code
func (r *RoomRepository) FindByCode(code string) (*models.Room, error) {
	var room models.Room
	err := r.db.Preload("Building").Where("code = ?", code).First(&room).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &room, nil
}

// FindAll finds all rooms
func (r *RoomRepository) FindAll() ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Preload("Building").Find(&rooms).Error
	if err != nil {
		return nil, err
	}
	return rooms, nil
}

// FindByBuildingID finds all rooms by building ID
func (r *RoomRepository) FindByBuildingID(buildingID uint) ([]models.Room, error) {
	var rooms []models.Room
	err := r.db.Preload("Building").Where("building_id = ?", buildingID).Find(&rooms).Error
	if err != nil {
		return nil, err
	}
	return rooms, nil
}

// DeleteByID deletes a room by ID
func (r *RoomRepository) DeleteByID(id uint) error {
	// Use soft delete (don't use Unscoped())
	return r.db.Delete(&models.Room{}, id).Error
}

// FindDeletedByCode finds a soft-deleted room by code
func (r *RoomRepository) FindDeletedByCode(code string) (*models.Room, error) {
	var room models.Room
	err := r.db.Unscoped().Preload("Building").Where("code = ? AND deleted_at IS NOT NULL", code).First(&room).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &room, nil
}

// RestoreByCode restores a soft-deleted room by code
func (r *RoomRepository) RestoreByCode(code string) (*models.Room, error) {
	// Find the deleted record
	deletedRoom, err := r.FindDeletedByCode(code)
	if err != nil {
		return nil, err
	}
	if deletedRoom == nil {
		return nil, nil
	}
	
	// Restore the record
	if err := r.db.Unscoped().Model(&models.Room{}).Where("id = ?", deletedRoom.ID).Update("deleted_at", nil).Error; err != nil {
		return nil, err
	}
	
	// Return the restored record
	return r.FindByID(deletedRoom.ID)
}

// CheckCodeExists checks if a code exists, including soft-deleted records
func (r *RoomRepository) CheckCodeExists(code string, excludeID uint) (bool, error) {
	var count int64
	query := r.db.Unscoped().Model(&models.Room{}).Where("code = ?", code)
	
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