package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Lecturer represents a lecturer in the system
type Lecturer struct {
	ID                  uint           `json:"id" gorm:"primaryKey"`
	UUID                string         `json:"uuid" gorm:"type:varchar(36);uniqueIndex;not null"`
	EmployeeID          int            `json:"employee_id" gorm:"not null"`
	LecturerID          int            `json:"lecturer_id" gorm:"not null"`
	NIP                 string         `json:"nip" gorm:"type:varchar(20)"`
	FullName            string         `json:"full_name" gorm:"type:varchar(100);not null"`
	Email               string         `json:"email" gorm:"type:varchar(255)"`
	StudyProgramID      int            `json:"study_program_id" gorm:"column:prodi_id"`
	StudyProgram        string         `json:"study_program" gorm:"column:prodi;type:varchar(100)"`
	AcademicRank        string         `json:"academic_rank" gorm:"column:jabatan_akademik;type:varchar(10)"`
	AcademicRankDesc    string         `json:"academic_rank_desc" gorm:"column:jabatan_akademik_desc;type:varchar(50)"`
	EducationLevel      string         `json:"education_level" gorm:"column:jenjang_pendidikan;type:varchar(255)"`
	NIDN                string         `json:"nidn" gorm:"type:varchar(20)"`
	UserID              int            `json:"user_id"`
	LastSync            time.Time      `json:"last_sync" gorm:"autoCreateTime"`
	CreatedAt           time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the table name for the Lecturer model
func (Lecturer) TableName() string {
	return "lecturers"
}

// BeforeCreate is a GORM hook that generates a UUID before creating a new lecturer
func (l *Lecturer) BeforeCreate(tx *gorm.DB) error {
	if l.UUID == "" {
		l.UUID = uuid.New().String()
	}
	return nil
}

// CampusLecturerResponse represents the response from the campus API for lecturers
type CampusLecturerResponse struct {
	Result string `json:"result"`
	Data   struct {
		Lecturers []CampusLecturer `json:"dosen"`
	} `json:"data"`
}

// CampusLecturer represents a lecturer from the campus API
type CampusLecturer struct {
	PegawaiID           int    `json:"pegawai_id"`
	DosenID             int    `json:"dosen_id"`
	NIP                 string `json:"nip"`
	Nama                string `json:"nama"`
	Email               string `json:"email"`
	ProdiID             int    `json:"prodi_id"`
	Prodi               string `json:"prodi"`
	JabatanAkademik     string `json:"jabatan_akademik"`
	JabatanAkademikDesc string `json:"jabatan_akademik_desc"`
	JenjangPendidikan   string `json:"jenjang_pendidikan"`
	NIDN                string `json:"nidn"`
	UserID              int    `json:"user_id"`
} 