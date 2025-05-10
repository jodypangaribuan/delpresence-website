package models

import (
	"time"

	"gorm.io/gorm"
)

// Student represents a student in the system
type Student struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	DimID           int            `json:"dim_id" gorm:"not null"`
	UserID          int            `json:"user_id" gorm:"not null;comment:External user ID from campus system"`
	User            *User          `json:"-" gorm:"foreignKey:ExternalUserID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	UserName        string         `json:"user_name" gorm:"type:varchar(20)"`
	NIM             string         `json:"nim" gorm:"type:varchar(20);uniqueIndex;not null"`
	FullName        string         `json:"full_name" gorm:"type:varchar(100);not null"`
	Email           string         `json:"email" gorm:"type:varchar(255)"`
	StudyProgramID  int            `json:"study_program_id" gorm:"type:int"`
	StudyProgram    string         `json:"study_program" gorm:"type:varchar(100)"`
	Faculty         string         `json:"faculty" gorm:"type:varchar(100)"`
	YearEnrolled    int            `json:"year_enrolled" gorm:"type:int"`
	Status          string         `json:"status" gorm:"type:varchar(20)"`
	Dormitory       string         `json:"dormitory" gorm:"type:varchar(50)"`
	LastSync        time.Time      `json:"last_sync" gorm:"autoCreateTime"`
	CreatedAt       time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the table name for the Student model
func (Student) TableName() string {
	return "students"
}

// CampusStudentResponse represents the response from the campus API for students
type CampusStudentResponse struct {
	Result string `json:"result"`
	Data   struct {
		Students []CampusStudent `json:"mahasiswa"`
	} `json:"data"`
}

// CampusStudent represents a student from the campus API
type CampusStudent struct {
	DimID      int    `json:"dim_id"`
	UserID     int    `json:"user_id"`
	UserName   string `json:"user_name"`
	NIM        string `json:"nim"`
	Nama       string `json:"nama"`
	Email      string `json:"email"`
	ProdiID    int    `json:"prodi_id"`
	ProdiName  string `json:"prodi_name"`
	Fakultas   string `json:"fakultas"`
	Angkatan   int    `json:"angkatan"`
	Status     string `json:"status"`
	Asrama     string `json:"asrama"`
} 