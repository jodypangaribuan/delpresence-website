package repositories

import (
	"log"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// StudentRepository handles database operations for students
type StudentRepository struct {
	db *gorm.DB
}

// NewStudentRepository creates a new student repository
func NewStudentRepository() *StudentRepository {
	return &StudentRepository{
		db: database.GetDB(),
	}
}

// FindAll returns all students from the database
func (r *StudentRepository) FindAll() ([]models.Student, error) {
	var students []models.Student
	result := r.db.Find(&students)
	return students, result.Error
}

// FindByID returns a student by ID
func (r *StudentRepository) FindByID(id uint) (*models.Student, error) {
	var student models.Student
	result := r.db.First(&student, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &student, nil
}

// FindByNIM returns a student by NIM
func (r *StudentRepository) FindByNIM(nim string) (*models.Student, error) {
	var student models.Student
	result := r.db.Where("nim = ?", nim).First(&student)
	if result.Error != nil {
		return nil, result.Error
	}
	return &student, nil
}

// FindByUserID returns a student by external UserID from campus
func (r *StudentRepository) FindByUserID(userID int) (*models.Student, error) {
	var student models.Student
	result := r.db.Where("user_id = ?", userID).First(&student)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, result.Error
	}
	return &student, nil
}

// UpsertMany creates or updates multiple students
func (r *StudentRepository) UpsertMany(students []models.Student) error {
	if len(students) == 0 {
		return nil
	}

	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, student := range students {
		// Try to find existing student by DimID (from external system)
		var existingStudent models.Student
		result := tx.Where("dim_id = ?", student.DimID).First(&existingStudent)
		
		if result.Error == nil {
			// Check if the student ID is going to change
			oldID := existingStudent.ID

			// Update existing student
			student.ID = existingStudent.ID
			student.CreatedAt = existingStudent.CreatedAt
			
			if err := tx.Save(&student).Error; err != nil {
				tx.Rollback()
				return err
			}

			// Update student_to_groups rows if the student ID changed but UserID remains the same
			// This maintains group membership connections when student IDs change
			if oldID != student.ID && existingStudent.UserID == student.UserID {
				if err := tx.Exec(
					"UPDATE student_to_groups SET student_id = ? WHERE student_id = ? AND user_id = ?",
					student.ID, oldID, student.UserID,
				).Error; err != nil {
					tx.Rollback()
					return err
				}
			}
		} else {
			// Create new student
			if err := tx.Create(&student).Error; err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	log.Printf("Upserted %d students", len(students))
	return tx.Commit().Error
} 