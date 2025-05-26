package models

import (
	"time"

	"gorm.io/gorm"
)

// Room represents a room in a building
type Room struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Code         string         `json:"code" gorm:"type:varchar(10);uniqueIndex:idx_rooms_code_deleted_at;not null"`
	Name         string         `json:"name" gorm:"type:varchar(100);not null"`
	BuildingID   uint           `json:"building_id" gorm:"not null"`
	Building     Building       `json:"building" gorm:"foreignKey:BuildingID"`
	Floor        int            `json:"floor" gorm:"type:int;default:1"`
	Capacity     int            `json:"capacity" gorm:"type:int;default:0"`
	CreatedAt    time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:idx_rooms_code_deleted_at"`
}

// TableName returns the table name for the Room model
func (Room) TableName() string {
	return "rooms"
} 