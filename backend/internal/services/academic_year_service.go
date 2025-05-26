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
	// Check if name and semester combination already exists in active records
	existingAcademicYear, err := s.repository.FindByNameAndSemester(academicYear.Name, academicYear.Semester)
	if err != nil {
		return err
	}
	if existingAcademicYear != nil {
		return errors.New("academic year with this name and semester already exists")
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

	// If name or semester is changed, check if the combination already exists
	if academicYear.Name != existingAcademicYear.Name || academicYear.Semester != existingAcademicYear.Semester {
		existingWithNameAndSemester, err := s.repository.FindByNameAndSemester(academicYear.Name, academicYear.Semester)
		if err != nil {
			return err
		}
		if existingWithNameAndSemester != nil && existingWithNameAndSemester.ID != academicYear.ID {
			return errors.New("academic year with this name and semester already exists")
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

	// Check if this academic year is being used by courses
	var courseCount int64
	if err := db.Model(&models.Course{}).Where("academic_year_id = ?", id).Count(&courseCount).Error; err != nil {
		return fmt.Errorf("failed to check related courses: %w", err)
	}

	if courseCount > 0 {
		return errors.New("cannot delete academic year: it is being used by one or more courses")
	}

	// Check if this academic year is being used by lecturer assignments
	var assignmentCount int64
	if err := db.Model(&models.LecturerAssignment{}).Where("academic_year_id = ?", id).Count(&assignmentCount).Error; err != nil {
		return fmt.Errorf("failed to check related lecturer assignments: %w", err)
	}

	if assignmentCount > 0 {
		return errors.New("cannot delete academic year: it is being used by one or more lecturer assignments")
	}

	// Check if this academic year is being used by course schedules
	var scheduleCount int64
	if err := db.Model(&models.CourseSchedule{}).Where("academic_year_id = ?", id).Count(&scheduleCount).Error; err != nil {
		return fmt.Errorf("failed to check related course schedules: %w", err)
	}

	if scheduleCount > 0 {
		return errors.New("cannot delete academic year: it is being used by one or more course schedules")
	}

	// If not used by any related entities, proceed with deletion (soft delete)
	return s.repository.DeleteByID(id)
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