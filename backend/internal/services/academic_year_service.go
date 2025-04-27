package services

import (
	"errors"
	"log"
	"time"

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
	// Check if name already exists
	existingAcademicYear, err := s.repository.FindByName(academicYear.Name)
	if err != nil {
		return err
	}
	if existingAcademicYear != nil {
		return errors.New("academic year with this name already exists")
	}

	// Validate dates
	if academicYear.StartDate.After(academicYear.EndDate) {
		return errors.New("start date must be before end date")
	}

	// Validate semester
	if academicYear.Semester != "Ganjil" && academicYear.Semester != "Genap" {
		return errors.New("semester must be 'Ganjil' or 'Genap'")
	}

	// If this academic year is set to be active, deactivate all others
	if academicYear.IsActive {
		activateCount, err := s.repository.CountActive()
		if err != nil {
			return err
		}
		if activateCount > 0 {
			if err := s.repository.DeactivateAll(); err != nil {
				return err
			}
		}
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

	// If this academic year is set to be active and wasn't active before, deactivate all others
	if academicYear.IsActive && !existingAcademicYear.IsActive {
		if err := s.repository.DeactivateAll(); err != nil {
			return err
		}
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

	// Can't delete active academic year
	if academicYear.IsActive {
		return errors.New("cannot delete an active academic year")
	}

	// Delete academic year
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

// ActivateAcademicYear activates an academic year and deactivates all others
func (s *AcademicYearService) ActivateAcademicYear(id uint) error {
	// Check if academic year exists
	academicYear, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if academicYear == nil {
		return errors.New("academic year not found")
	}

	// Log for debugging
	log.Printf("Activating academic year ID: %d, Name: %s", id, academicYear.Name)

	return s.repository.ActivateByID(id)
}

// DeactivateAcademicYear deactivates an academic year
func (s *AcademicYearService) DeactivateAcademicYear(id uint) error {
	// Check if academic year exists
	academicYear, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if academicYear == nil {
		return errors.New("academic year not found")
	}

	if !academicYear.IsActive {
		return errors.New("academic year is already inactive")
	}

	academicYear.IsActive = false
	return s.repository.Update(academicYear)
}

// GetActiveAcademicYear gets the active academic year
func (s *AcademicYearService) GetActiveAcademicYear() (*models.AcademicYear, error) {
	return s.repository.FindActive()
} 