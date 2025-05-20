package models

import (
	"time"

	"gorm.io/gorm"
)

// Faculty represents a faculty (fakultas) in the system
type Faculty struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Code             string         `json:"code" gorm:"type:varchar(10);uniqueIndex:idx_faculties_code_deleted_at;not null"`
	Name             string         `json:"name" gorm:"type:varchar(100);not null"`
	Dean             string         `json:"dean" gorm:"type:varchar(100)"`
	EstablishmentYear int            `json:"establishment_year" gorm:"type:int"`
	LecturerCount    int            `json:"lecturer_count" gorm:"type:int;default:0"`
	CreatedAt        time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:idx_faculties_code_deleted_at"`
}

// TableName returns the table name for the Faculty model
func (Faculty) TableName() string {
	return "faculties"
} 