package models

import (
	"time"

	"gorm.io/gorm"
)

// AcademicYear represents an academic year period in the university
type AcademicYear struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"type:varchar(100);uniqueIndex;not null"`
	StartDate time.Time      `json:"start_date" gorm:"not null"`
	EndDate   time.Time      `json:"end_date" gorm:"not null"`
	Semester  string         `json:"semester" gorm:"type:varchar(20);not null"` // Ganjil, Genap
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the table name for the AcademicYear model
func (AcademicYear) TableName() string {
	return "academic_years"
} 