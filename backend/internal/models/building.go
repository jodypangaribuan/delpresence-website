package models

import (
	"time"

	"gorm.io/gorm"
)

// Building represents a building in the campus
type Building struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Code        string         `json:"code" gorm:"type:varchar(10);uniqueIndex:idx_buildings_code_deleted_at;not null"`
	Name        string         `json:"name" gorm:"type:varchar(100);not null"`
	Floors      int            `json:"floors" gorm:"type:int;default:1"`
	Description string         `json:"description" gorm:"type:text"`
	CreatedAt   time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:idx_buildings_code_deleted_at"`
}

// TableName returns the table name for the Building model
func (Building) TableName() string {
	return "buildings"
} 