package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
)

// StudentFace represents a student's face embedding stored in the database
type StudentFace struct {
	ID          uint           `json:"id" gorm:"primarykey"`
	StudentID   int            `json:"student_id" gorm:"index"`
	EmbeddingID string         `json:"embedding_id" gorm:"uniqueIndex"`
	Embedding   EmbeddingArray `json:"embedding" gorm:"type:jsonb"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// EmbeddingArray represents a numeric array stored as JSON in the database
type EmbeddingArray []float64

// Value makes EmbeddingArray implement driver.Valuer for database storage
func (e EmbeddingArray) Value() (driver.Value, error) {
	if len(e) == 0 {
		return nil, nil
	}
	return json.Marshal(e)
}

// Scan makes EmbeddingArray implement sql.Scanner for database retrieval
func (e *EmbeddingArray) Scan(value interface{}) error {
	if value == nil {
		*e = EmbeddingArray{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, e)
}

// TableName specifies the table name for StudentFace
func (StudentFace) TableName() string {
	return "student_faces"
}
