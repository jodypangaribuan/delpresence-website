package models

import (
	"time"

	"gorm.io/gorm"
)

// Lecturer represents a lecturer in the system
type Lecturer struct {
	ID                  uint           `json:"id" gorm:"primaryKey"`
	EmployeeID          int            `json:"employee_id" gorm:"not null"`
	LecturerID          int            `json:"lecturer_id" gorm:"not null"`
	UserID              int            `json:"user_id" gorm:"comment:External user ID from campus system"`
	User                *User          `json:"-" gorm:"foreignKey:ExternalUserID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	NIP                 string         `json:"nip" gorm:"column:n_ip;type:varchar(20)"`
	FullName            string         `json:"full_name" gorm:"type:varchar(100);not null"`
	Email               string         `json:"email" gorm:"type:varchar(255)"`
	StudyProgramID      uint           `json:"study_program_id" gorm:"type:uint"`
	StudyProgram        *StudyProgram  `json:"study_program" gorm:"foreignKey:StudyProgramID"`
	StudyProgramName    string         `json:"study_program_name" gorm:"type:varchar(100)"`
	AcademicRank        string         `json:"academic_rank" gorm:"type:varchar(10)"`
	AcademicRankDesc    string         `json:"academic_rank_desc" gorm:"type:varchar(50)"`
	EducationLevel      string         `json:"education_level" gorm:"type:varchar(255)"`
	NIDN                string         `json:"nidn" gorm:"column:n_id_n;type:varchar(20)"`
	LastSync            time.Time      `json:"last_sync" gorm:"autoCreateTime"`
	CreatedAt           time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt           time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
}

// TableName returns the table name for the Lecturer model
func (Lecturer) TableName() string {
	return "lecturers"
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
	PegawaiID           interface{} `json:"pegawai_id"`
	DosenID             interface{} `json:"dosen_id"`   
	NIP                 string      `json:"nip"`
	Nama                string      `json:"nama"`
	Email               string      `json:"email"`
	ProdiID             interface{} `json:"prodi_id"`   
	Prodi               string      `json:"prodi"`
	JabatanAkademik     string      `json:"jabatan_akademik"`
	JabatanAkademikDesc string      `json:"jabatan_akademik_desc"`
	JenjangPendidikan   string      `json:"jenjang_pendidikan"`
	NIDN                string      `json:"nidn"`
	UserID              interface{} `json:"user_id"`
} 