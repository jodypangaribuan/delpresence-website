package models

import (
	"time"

	"gorm.io/gorm"
)

// AttendanceType represents the type of attendance method used
type AttendanceType string

const (
	AttendanceTypeQRCode          AttendanceType = "QR_CODE"
	AttendanceTypeFaceRecognition AttendanceType = "FACE_RECOGNITION"
	AttendanceTypeManual          AttendanceType = "MANUAL"
	AttendanceTypeBoth            AttendanceType = "BOTH"
)

// AttendanceStatus represents the status of an attendance session
type AttendanceStatus string

const (
	AttendanceStatusActive   AttendanceStatus = "ACTIVE"
	AttendanceStatusClosed   AttendanceStatus = "CLOSED"
	AttendanceStatusCanceled AttendanceStatus = "CANCELED"
)

// StudentAttendanceStatus represents the status of a student's attendance
type StudentAttendanceStatus string

const (
	StudentAttendanceStatusPresent StudentAttendanceStatus = "PRESENT"
	StudentAttendanceStatusLate    StudentAttendanceStatus = "LATE"
	StudentAttendanceStatusAbsent  StudentAttendanceStatus = "ABSENT"
	StudentAttendanceStatusExcused StudentAttendanceStatus = "EXCUSED"
)

// AttendanceSession represents an attendance session for a course schedule
type AttendanceSession struct {
	ID               uint             `json:"id" gorm:"primaryKey"`
	CourseScheduleID uint             `json:"course_schedule_id" gorm:"not null;index"`
	CourseSchedule   CourseSchedule   `json:"course_schedule,omitempty" gorm:"foreignKey:CourseScheduleID"`
	LecturerID       uint             `json:"lecturer_id" gorm:"not null;index"`
	Lecturer         Lecturer         `json:"lecturer,omitempty" gorm:"foreignKey:LecturerID"`
	CreatorRole      string           `json:"creator_role" gorm:"type:varchar(20);default:'LECTURER'"` // 'LECTURER' or 'ASSISTANT'
	Date             time.Time        `json:"date" gorm:"not null"`
	StartTime        time.Time        `json:"start_time" gorm:"not null"`
	EndTime          *time.Time       `json:"end_time"`
	Type             AttendanceType   `json:"type" gorm:"not null;type:varchar(20)"`
	Status           AttendanceStatus `json:"status" gorm:"not null;type:varchar(20)"`
	AutoClose        bool             `json:"auto_close" gorm:"default:true"`
	Duration         int              `json:"duration" gorm:"default:15"` // in minutes
	AllowLate        bool             `json:"allow_late" gorm:"default:true"`
	LateThreshold    int              `json:"late_threshold" gorm:"default:10"` // in minutes
	Notes            string           `json:"notes" gorm:"type:text"`
	QRCodeData       string           `json:"qr_code_data,omitempty" gorm:"type:text"`
	CreatedAt        time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt        time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt        gorm.DeletedAt   `json:"deleted_at,omitempty" gorm:"index"`
}

// StudentAttendance represents a student's attendance record for a session
type StudentAttendance struct {
	ID                  uint                    `json:"id" gorm:"primaryKey"`
	AttendanceSessionID uint                    `json:"attendance_session_id" gorm:"not null;index"`
	AttendanceSession   AttendanceSession       `json:"attendance_session,omitempty" gorm:"foreignKey:AttendanceSessionID"`
	StudentID           uint                    `json:"student_id" gorm:"not null;index"`
	Student             Student                 `json:"student,omitempty" gorm:"foreignKey:StudentID"`
	Status              StudentAttendanceStatus `json:"status" gorm:"not null;type:varchar(20)"`
	CheckInTime         *time.Time              `json:"check_in_time"`
	Notes               string                  `json:"notes" gorm:"type:text"`
	VerificationMethod  string                  `json:"verification_method" gorm:"type:varchar(50)"` // e.g., "QR_CODE", "FACE_RECOGNITION", "MANUAL"
	VerifiedByID        *uint                   `json:"verified_by_id"`                              // ID of the lecturer or assistant who verified manually
	CreatedAt           time.Time               `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time               `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt           gorm.DeletedAt          `json:"deleted_at,omitempty" gorm:"index"`
}

// TableName returns the table name for the AttendanceSession model
func (AttendanceSession) TableName() string {
	return "attendance_sessions"
}

// TableName returns the table name for the StudentAttendance model
func (StudentAttendance) TableName() string {
	return "student_attendances"
}

// AttendanceSessionResponse represents a response for an attendance session
type AttendanceSessionResponse struct {
	ID                uint      `json:"id"`
	CourseScheduleID  uint      `json:"course_schedule_id"`
	CourseCode        string    `json:"course_code"`
	CourseName        string    `json:"course_name"`
	Room              string    `json:"room"`
	Date              string    `json:"date"`
	StartTime         string    `json:"start_time"`
	EndTime           string    `json:"end_time,omitempty"`
	ScheduleStartTime string    `json:"schedule_start_time"`
	ScheduleEndTime   string    `json:"schedule_end_time"`
	Type              string    `json:"type"`
	Status            string    `json:"status"`
	CreatorRole       string    `json:"creator_role"`
	AutoClose         bool      `json:"auto_close"`
	Duration          int       `json:"duration"`
	AllowLate         bool      `json:"allow_late"`
	LateThreshold     int       `json:"late_threshold"`
	Notes             string    `json:"notes"`
	QRCodeURL         string    `json:"qr_code_url,omitempty"`
	TotalStudents     int       `json:"total_students"`
	AttendedCount     int       `json:"attended_count"`
	LateCount         int       `json:"late_count"`
	AbsentCount       int       `json:"absent_count"`
	ExcusedCount      int       `json:"excused_count"`
	CreatedAt         time.Time `json:"created_at"`
}

// StudentAttendanceResponse represents a response for a student's attendance
type StudentAttendanceResponse struct {
	ID                  uint   `json:"id"`
	AttendanceSessionID uint   `json:"attendance_session_id"`
	StudentID           uint   `json:"student_id"`
	StudentName         string `json:"student_name"`
	StudentNIM          string `json:"student_nim"`
	Status              string `json:"status"`
	CheckInTime         string `json:"check_in_time,omitempty"`
	Notes               string `json:"notes"`
	VerificationMethod  string `json:"verification_method"`
}

// StudentAttendanceHistoryResponse represents detailed attendance history for the mobile app
type StudentAttendanceHistoryResponse struct {
	ID                 uint   `json:"id"`
	Date               string `json:"date"`
	CourseCode         string `json:"course_code"`
	CourseName         string `json:"course_name"`
	RoomName           string `json:"room_name"`
	CheckInTime        string `json:"check_in_time,omitempty"`
	Status             string `json:"status"` // "PRESENT", "LATE", "ABSENT", "EXCUSED"
	VerificationMethod string `json:"verification_method"`
}

// AttendanceStatistics represents statistics for attendance sessions
type AttendanceStatistics struct {
	TotalSessions     int `json:"total_sessions"`
	TotalStudents     int `json:"total_students"`
	TotalAttendance   int `json:"total_attendance"`
	TotalLate         int `json:"total_late"`
	TotalAbsent       int `json:"total_absent"`
	TotalExcused      int `json:"total_excused"`
	AverageAttendance int `json:"average_attendance"` // Percentage
}
