package models

import (
	"time"

	"gorm.io/gorm"
)

// Course represents a course in the system
type Course struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	Code            string         `gorm:"uniqueIndex:idx_courses_code_deleted_at;not null" json:"code"`
	Name            string         `gorm:"not null" json:"name"`
	Credits         int            `gorm:"not null" json:"credits"`
	Semester        int            `gorm:"not null" json:"semester"`
	DepartmentID    uint           `gorm:"not null" json:"department_id"`
	Department      Department     `gorm:"foreignKey:DepartmentID" json:"department"`
	FacultyID       uint           `gorm:"not null" json:"faculty_id"`
	Faculty         Faculty        `gorm:"foreignKey:FacultyID" json:"faculty"`
	CourseType      string         `gorm:"not null" json:"course_type"` // theory, practice, or mixed
	AcademicYearID  uint           `gorm:"not null" json:"academic_year_id"`
	AcademicYear    AcademicYear   `gorm:"foreignKey:AcademicYearID" json:"academic_year"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index;uniqueIndex:idx_courses_code_deleted_at" json:"deleted_at,omitempty"`
}

// Department represents a department/study program
type Department struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"uniqueIndex:idx_departments_name_deleted_at;not null" json:"name"`
	FacultyID uint           `gorm:"not null" json:"faculty_id"`
	Faculty   Faculty        `gorm:"foreignKey:FacultyID" json:"faculty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index;uniqueIndex:idx_departments_name_deleted_at" json:"deleted_at,omitempty"`
}

// Faculty struct is defined in faculty.go - removed duplicate declaration 