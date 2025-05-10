package models

import (
	"time"

	"gorm.io/gorm"
)

// Employee represents an employee in the system
type Employee struct {
	ID              uint           `json:"id" gorm:"primaryKey"`
	EmployeeID      int            `json:"employee_id" gorm:"not null;comment:External employee ID from campus system"`
	UserID          int            `json:"user_id" gorm:"comment:External user ID from campus system"`
	User            *User          `json:"-" gorm:"foreignKey:ExternalUserID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	NIP             string         `json:"nip" gorm:"type:varchar(20)"`
	FullName        string         `json:"full_name" gorm:"type:varchar(100);not null"`
	Email           string         `json:"email" gorm:"type:varchar(255)"`
	Position        string         `json:"position" gorm:"type:varchar(100)"`
	Department      string         `json:"department" gorm:"type:varchar(100)"`
	EmploymentType  string         `json:"employment_type" gorm:"type:varchar(50)"`
	JoinDate        *time.Time     `json:"join_date"`
	LastSync        time.Time      `json:"last_sync" gorm:"autoCreateTime"`
	CreatedAt       time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt       time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt       gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the table name for the Employee model
func (Employee) TableName() string {
	return "employees"
}

// CampusEmployeeResponse represents the response from the campus API for employees
type CampusEmployeeResponse struct {
	Data []CampusEmployee `json:"data"`
}

// CampusEmployee represents an employee from the campus API
type CampusEmployee struct {
	PegawaiID      interface{} `json:"pegawai_id"`
	NIP            string      `json:"nip"`
	Nama           string      `json:"nama"`
	Email          string      `json:"email"`
	UserName       string      `json:"user_name"`
	UserID         interface{} `json:"user_id"`
	Alias          string      `json:"alias "`
	Posisi         string      `json:"posisi "`
	StatusPegawai  string      `json:"status_pegawai"`
} 