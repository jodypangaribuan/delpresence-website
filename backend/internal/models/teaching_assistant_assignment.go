package models

import (
	"time"

	"gorm.io/gorm"
)

// TeachingAssistantAssignment represents the assignment of a teaching assistant to a course
type TeachingAssistantAssignment struct {
	// Primary key
	ID uint `json:"id" gorm:"primaryKey"`

	// Teaching Assistant details (employee)
	UserID   int       `json:"user_id" gorm:"index:idx_ta_assignment_user_id"`
	Employee *Employee `json:"employee" gorm:"-"` // Dynamically loaded, not stored directly in the database

	// Course details
	CourseID uint   `json:"course_id" gorm:"index:idx_ta_assignment_course_id"`
	Course   Course `json:"course" gorm:"foreignKey:CourseID"`

	// Academic year details
	AcademicYearID uint         `json:"academic_year_id" gorm:"index:idx_ta_assignment_academic_year_id"`
	AcademicYear   AcademicYear `json:"academic_year" gorm:"foreignKey:AcademicYearID"`

	// The lecturer who assigned this teaching assistant
	AssignedByID uint `json:"assigned_by_id" gorm:"index:idx_ta_assignment_assigned_by"`

	// Timestamp fields at the end
	CreatedAt time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TeachingAssistantAssignmentResponse represents a detailed response for teaching assistant assignments
type TeachingAssistantAssignmentResponse struct {
	ID             uint `json:"id"`
	UserID         int  `json:"user_id"`
	CourseID       uint `json:"course_id"`
	AcademicYearID uint `json:"academic_year_id"`
	AssignedByID   uint `json:"assigned_by_id"`

	// Employee details
	EmployeeName     string `json:"employee_name"`
	EmployeeNIP      string `json:"employee_nip"`
	EmployeeEmail    string `json:"employee_email"`
	EmployeePosition string `json:"employee_position"`

	// Course details
	CourseName     string `json:"course_name"`
	CourseCode     string `json:"course_code"`
	CourseSemester int    `json:"course_semester"`

	// Academic year details
	AcademicYearName     string `json:"academic_year_name"`
	AcademicYearSemester string `json:"academic_year_semester"`

	// Assigned by details
	AssignedByName string `json:"assigned_by_name"`

	// Timestamp details
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName specifies the table name for teaching assistant assignments
func (TeachingAssistantAssignment) TableName() string {
	return "teaching_assistant_assignments"
}
