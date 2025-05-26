package models

import (
	"time"

	"gorm.io/gorm"
)

// StudentGroup represents a group of students
type StudentGroup struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Name          string         `gorm:"not null" json:"name"`
	DepartmentID  uint           `json:"department_id"`
	Department    StudyProgram   `gorm:"foreignKey:DepartmentID" json:"department"`
	Students      []*Student     `gorm:"many2many:student_to_groups;" json:"students,omitempty"`
	StudentCount  int            `gorm:"-" json:"student_count"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName returns the table name for the StudentGroup model
func (StudentGroup) TableName() string {
	return "student_groups"
}

// StudentToGroup is a join table for the many-to-many relationship between students and groups
type StudentToGroup struct {
	StudentID     uint      `gorm:"primaryKey" json:"student_id"`
	UserID        int       `gorm:"not null" json:"user_id"`
	StudentGroupID uint     `gorm:"primaryKey" json:"student_group_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TableName returns the table name for the StudentToGroup model
func (StudentToGroup) TableName() string {
	return "student_to_groups"
} 