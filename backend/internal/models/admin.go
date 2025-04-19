package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Admin represents an administrator in the system
type Admin struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	UUID      string         `json:"uuid" gorm:"type:varchar(36);uniqueIndex;not null"`
	UserID    uint           `json:"user_id" gorm:"not null"` // Relation to User model
	User      *User          `json:"user,omitempty" gorm:"foreignKey:ID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	FullName  string         `json:"full_name" gorm:"type:varchar(100);not null"`
	Email     string         `json:"email" gorm:"type:varchar(255);not null"`
	Position  string         `json:"position" gorm:"type:varchar(100)"`
	Department string        `json:"department" gorm:"type:varchar(100)"`
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the table name for the Admin model
func (Admin) TableName() string {
	return "admins"
}

// BeforeCreate is a GORM hook that generates a UUID before creating a new admin
func (a *Admin) BeforeCreate(tx *gorm.DB) error {
	if a.UUID == "" {
		a.UUID = uuid.New().String()
	}
	return nil
}