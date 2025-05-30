package models

import (
	"time"

	"gorm.io/gorm"
)

// CourseSchedule represents a schedule for a course
type CourseSchedule struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	CourseID       uint           `gorm:"not null" json:"course_id"`
	Course         Course         `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	RoomID         uint           `gorm:"not null" json:"room_id"`
	Room           Room           `gorm:"foreignKey:RoomID" json:"room,omitempty"`
	Day            string         `gorm:"not null" json:"day"`
	StartTime      string         `gorm:"not null" json:"start_time"`
	EndTime        string         `gorm:"not null" json:"end_time"`
	UserID         uint           `gorm:"column:lecturer_id;not null" json:"user_id"`
	Lecturer       User           `gorm:"foreignKey:UserID;references:ID" json:"lecturer,omitempty"`
	StudentGroupID uint           `gorm:"not null" json:"student_group_id"`
	StudentGroup   StudentGroup   `gorm:"foreignKey:StudentGroupID" json:"student_group,omitempty"`
	AcademicYearID uint           `gorm:"not null" json:"academic_year_id"`
	AcademicYear   AcademicYear   `gorm:"foreignKey:AcademicYearID" json:"academic_year,omitempty"`
	Capacity       int            `json:"capacity"`
	Enrolled       int            `json:"enrolled"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName returns the table name for the CourseSchedule model
func (CourseSchedule) TableName() string {
	return "course_schedules"
}
