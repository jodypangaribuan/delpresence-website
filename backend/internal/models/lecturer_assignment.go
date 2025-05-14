package models

import (
	"time"
	"gorm.io/gorm"
)

// LecturerAssignment represents the assignment of a lecturer to a course
type LecturerAssignment struct {
	// Primary key
	ID             uint           `json:"id" gorm:"primaryKey"`
	
	// Lecturer details
	UserID         int            `json:"user_id" gorm:"index:idx_lecturer_assignment_user_id"`
	Lecturer       *Lecturer      `json:"lecturer" gorm:"-"` // Dynamically loaded, not stored directly in the database
	
	// Course details
	CourseID       uint           `json:"course_id" gorm:"index:idx_lecturer_assignment_course_id"`
	Course         Course         `json:"course" gorm:"foreignKey:CourseID"`
	
	// Academic year details
	AcademicYearID uint           `json:"academic_year_id" gorm:"index:idx_lecturer_assignment_academic_year_id"`
	AcademicYear   AcademicYear   `json:"academic_year" gorm:"foreignKey:AcademicYearID"`
	
	// Timestamp fields at the end
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// LecturerAssignmentResponse represents a detailed response for lecturer assignments
type LecturerAssignmentResponse struct {
	ID              uint      `json:"id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	// Lecturer details
	UserID          int       `json:"user_id"`
	LecturerName    string    `json:"lecturer_name"`
	LecturerNIP     string    `json:"lecturer_nip,omitempty"`
	LecturerEmail   string    `json:"lecturer_email,omitempty"`
	
	// Course details
	CourseID        uint      `json:"course_id"`
	CourseName      string    `json:"course_name"`
	CourseCode      string    `json:"course_code"`
	CourseSemester  int       `json:"course_semester"`
	
	// Academic year details
	AcademicYearID      uint   `json:"academic_year_id"`
	AcademicYearName    string `json:"academic_year_name"`
	AcademicYearSemester string `json:"academic_year_semester"`
}

// TableName specifies the table name for lecturer assignments
func (LecturerAssignment) TableName() string {
	return "lecturer_assignments"
} 