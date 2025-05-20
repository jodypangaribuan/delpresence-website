package models

import (
	"time"

	"gorm.io/gorm"
)

// StudyProgram represents a study program (program studi) in the system
type StudyProgram struct {
	ID                uint           `json:"id" gorm:"primaryKey"`
	Code              string         `json:"code" gorm:"type:varchar(10);uniqueIndex:idx_study_programs_code_deleted_at;not null"`
	Name              string         `json:"name" gorm:"type:varchar(100);not null"`
	FacultyID         uint           `json:"faculty_id" gorm:"not null"`
	Faculty           Faculty        `json:"faculty" gorm:"foreignKey:FacultyID"`
	Degree            string         `json:"degree" gorm:"type:varchar(10)"`
	Accreditation     string         `json:"accreditation" gorm:"type:varchar(50)"`
	HeadOfDepartment  string         `json:"head_of_department" gorm:"type:varchar(200)"`
	LecturerCount     int            `json:"lecturer_count" gorm:"type:int;default:0"`
	StudentCount      int            `json:"student_count" gorm:"type:int;default:0"`
	CreatedAt         time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:idx_study_programs_code_deleted_at"`
}

// TableName returns the table name for the StudyProgram model
func (StudyProgram) TableName() string {
	return "study_programs"
} 