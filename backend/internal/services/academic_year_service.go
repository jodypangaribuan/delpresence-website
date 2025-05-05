package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

// AcademicYearService is a service for academic year operations
type AcademicYearService struct {
	repository *repositories.AcademicYearRepository
}

// NewAcademicYearService creates a new academic year service
func NewAcademicYearService() *AcademicYearService {
	return &AcademicYearService{
		repository: repositories.NewAcademicYearRepository(),
	}
}

// CreateAcademicYear creates a new academic year
func (s *AcademicYearService) CreateAcademicYear(academicYear *models.AcademicYear) error {
	// Check if name already exists in active records
	existingAcademicYear, err := s.repository.FindByName(academicYear.Name)
	if err != nil {
		return err
	}
	if existingAcademicYear != nil {
		return errors.New("academic year with this name already exists")
	}

	// Try to restore a soft-deleted academic year with this name
	restoredAcademicYear, err := s.repository.RestoreSoftDeletedByName(academicYear.Name, academicYear)
	if err != nil {
		return err
	}
	
	// If a soft-deleted record was found and restored
	if restoredAcademicYear != nil {
		return nil
	}

	// Validate dates
	if academicYear.StartDate.After(academicYear.EndDate) {
		return errors.New("start date must be before end date")
	}

	// Validate semester
	if academicYear.Semester != "Ganjil" && academicYear.Semester != "Genap" {
		return errors.New("semester must be 'Ganjil' or 'Genap'")
	}

	// Create academic year
	return s.repository.Create(academicYear)
}

// UpdateAcademicYear updates an existing academic year
func (s *AcademicYearService) UpdateAcademicYear(academicYear *models.AcademicYear) error {
	// Check if academic year exists
	existingAcademicYear, err := s.repository.FindByID(academicYear.ID)
	if err != nil {
		return err
	}
	if existingAcademicYear == nil {
		return errors.New("academic year not found")
	}

	// If name is changed, check if new name already exists
	if academicYear.Name != existingAcademicYear.Name {
		existingWithName, err := s.repository.FindByName(academicYear.Name)
		if err != nil {
			return err
		}
		if existingWithName != nil && existingWithName.ID != academicYear.ID {
			return errors.New("academic year with this name already exists")
		}
	}

	// Validate dates
	if academicYear.StartDate.After(academicYear.EndDate) {
		return errors.New("start date must be before end date")
	}

	// Validate semester
	if academicYear.Semester != "Ganjil" && academicYear.Semester != "Genap" {
		return errors.New("semester must be 'Ganjil' or 'Genap'")
	}

	// Update academic year
	return s.repository.Update(academicYear)
}

// GetAcademicYearByID gets an academic year by ID
func (s *AcademicYearService) GetAcademicYearByID(id uint) (*models.AcademicYear, error) {
	return s.repository.FindByID(id)
}

// GetAllAcademicYears gets all academic years
func (s *AcademicYearService) GetAllAcademicYears() ([]models.AcademicYear, error) {
	return s.repository.FindAll()
}

// DeleteAcademicYear deletes an academic year
func (s *AcademicYearService) DeleteAcademicYear(id uint) error {
	// Check if academic year exists
	academicYear, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if academicYear == nil {
		return errors.New("academic year not found")
	}

	// Get DB connection
	db := database.GetDB()

	// Begin transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Hard delete related lecturer assignments
	if err := tx.Unscoped().Where("academic_year_id = ?", id).Delete(&models.LecturerAssignment{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete related lecturer assignments: %w", err)
	}

	// Hard delete related course schedules
	if err := tx.Unscoped().Where("academic_year_id = ?", id).Delete(&models.CourseSchedule{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete related course schedules: %w", err)
	}

	// Get student group IDs to delete associated student-to-group relationships
	var studentGroupIDs []uint
	if err := tx.Model(&models.StudentGroup{}).Where("academic_year_id = ?", id).Pluck("id", &studentGroupIDs).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to get student group IDs: %w", err)
	}

	// If there are student groups, delete their student-to-group relationships
	if len(studentGroupIDs) > 0 {
		if err := tx.Unscoped().Where("student_group_id IN ?", studentGroupIDs).Delete(&models.StudentToGroup{}).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to delete related student-to-group relationships: %w", err)
		}
	}

	// Hard delete related student groups
	if err := tx.Unscoped().Where("academic_year_id = ?", id).Delete(&models.StudentGroup{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete related student groups: %w", err)
	}

	// Hard delete related courses
	if err := tx.Unscoped().Where("academic_year_id = ?", id).Delete(&models.Course{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete related courses: %w", err)
	}

	// Delete the academic year
	if err := tx.Delete(&models.AcademicYear{}, id).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete academic year: %w", err)
	}

	// Commit transaction
	return tx.Commit().Error
}

// AcademicYearWithStats represents an academic year with additional statistics
type AcademicYearWithStats struct {
	AcademicYear  models.AcademicYear `json:"academic_year"`
	IsCurrent     bool                 `json:"is_current"`    // Is the current date within the academic year period
	DaysRemaining int                  `json:"days_remaining"` // Number of days remaining until end date
	Stats         struct {
		TotalCourses   int `json:"total_courses"`
		TotalSchedules int `json:"total_schedules"`
	} `json:"stats"`
}

// GetAllAcademicYearsWithStats gets all academic years with their statistics
func (s *AcademicYearService) GetAllAcademicYearsWithStats() ([]AcademicYearWithStats, error) {
	// Get all academic years
	academicYears, err := s.repository.FindAll()
	if err != nil {
		return nil, err
	}

	// Current date for calculations
	currentDate := time.Now()

	// Create repository for course count
	courseRepo := repositories.NewCourseRepository()

	// Build response with stats
	result := make([]AcademicYearWithStats, len(academicYears))
	for i, academicYear := range academicYears {
		// Calculate if current
		isCurrent := currentDate.After(academicYear.StartDate) && currentDate.Before(academicYear.EndDate)

		// Calculate days remaining
		var daysRemaining int
		if currentDate.Before(academicYear.EndDate) {
			daysRemaining = int(academicYear.EndDate.Sub(currentDate).Hours() / 24)
		}

		// Get courses for this academic year
		courses, err := courseRepo.GetByAcademicYear(academicYear.ID)
		courseCount := 0
		if err == nil {
			courseCount = len(courses)
		} else {
			log.Printf("Error getting courses for academic year %d: %v", academicYear.ID, err)
		}

		// Create stats struct
		stats := struct {
			TotalCourses   int `json:"total_courses"`
			TotalSchedules int `json:"total_schedules"`
		}{
			TotalCourses:   courseCount,
			TotalSchedules: 0, // We'll keep this at 0 for now
		}

		result[i] = AcademicYearWithStats{
			AcademicYear:  academicYear,
			IsCurrent:     isCurrent,
			DaysRemaining: daysRemaining,
			Stats:         stats,
		}
	}

	return result, nil
} 