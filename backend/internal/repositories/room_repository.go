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
	// Use Unscoped() to permanently delete the record instead of a soft delete
	return r.db.Unscoped().Delete(&models.Room{}, id).Error
} 