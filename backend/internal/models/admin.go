package models

import (
	"time"

	"gorm.io/gorm"
)

// Admin represents an administrator in the system
type Admin struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
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