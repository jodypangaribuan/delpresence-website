package models

import (
	"time"

	"gorm.io/gorm"
)

// LecturerAssignment represents the assignment of a lecturer to a course
type LecturerAssignment struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	UserID        uint           `json:"user_id" gorm:"comment:References UserID in Lecturer table"`
	CourseID      uint           `json:"course_id"`
	AcademicYearID uint          `json:"academic_year_id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations - joins on Lecturer.UserID which is the external user ID from campus system
	Lecturer     Lecturer     `json:"lecturer" gorm:"foreignKey:UserID;references:UserID"`
	Course       Course       `json:"course" gorm:"foreignKey:CourseID"`
	AcademicYear AcademicYear `json:"academic_year" gorm:"foreignKey:AcademicYearID"`
}

// LecturerAssignmentResponse represents a detailed response for lecturer assignments
type LecturerAssignmentResponse struct {
	ID           uint      `json:"id"`
	UserID       uint      `json:"user_id"`
	LecturerName string    `json:"lecturer_name"`
	CourseID     uint      `json:"course_id"`
	CourseCode   string    `json:"course_code"`
	CourseName   string    `json:"course_name"`
	AcademicYear string    `json:"academic_year"`
	Semester     int       `json:"semester"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// TableName overrides the table name
func (LecturerAssignment) TableName() string {
	return "lecturer_assignments"
} 