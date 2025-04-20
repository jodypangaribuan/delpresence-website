package services

import (
	"errors"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

// FacultyService is a service for faculty operations
type FacultyService struct {
	repository *repositories.FacultyRepository
}

// NewFacultyService creates a new faculty service
func NewFacultyService() *FacultyService {
	return &FacultyService{
		repository: repositories.NewFacultyRepository(),
	}
}

// CreateFaculty creates a new faculty
func (s *FacultyService) CreateFaculty(faculty *models.Faculty) error {
	// Check if code already exists
	existingFaculty, err := s.repository.FindByCode(faculty.Code)
	if err != nil {
		return err
	}
	if existingFaculty != nil {
		return errors.New("faculty with this code already exists")
	}

	// Create faculty
	return s.repository.Create(faculty)
}

// UpdateFaculty updates an existing faculty
func (s *FacultyService) UpdateFaculty(faculty *models.Faculty) error {
	// Check if faculty exists
	existingFaculty, err := s.repository.FindByID(faculty.ID)
	if err != nil {
		return err
	}
	if existingFaculty == nil {
		return errors.New("faculty not found")
	}

	// If code is changed, check if new code already exists
	if faculty.Code != existingFaculty.Code {
		existingWithCode, err := s.repository.FindByCode(faculty.Code)
		if err != nil {
			return err
		}
		if existingWithCode != nil && existingWithCode.ID != faculty.ID {
			return errors.New("faculty with this code already exists")
		}
	}

	// Update faculty
	return s.repository.Update(faculty)
}

// GetFacultyByID gets a faculty by ID
func (s *FacultyService) GetFacultyByID(id uint) (*models.Faculty, error) {
	return s.repository.FindByID(id)
}

// GetAllFaculties gets all faculties
func (s *FacultyService) GetAllFaculties() ([]models.Faculty, error) {
	return s.repository.FindAll()
}

// DeleteFaculty deletes a faculty
func (s *FacultyService) DeleteFaculty(id uint) error {
	// Check if faculty exists
	faculty, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if faculty == nil {
		return errors.New("faculty not found")
	}

	// Check if there are any associated study programs
	programCount, err := s.repository.CountStudyPrograms(id)
	if err != nil {
		return err
	}
	if programCount > 0 {
		return errors.New("cannot delete faculty with associated study programs")
	}

	// Delete faculty
	return s.repository.DeleteByID(id)
}

// FacultyWithStats represents a faculty with additional statistics
type FacultyWithStats struct {
	Faculty         models.Faculty `json:"faculty"`
	ProgramCount    int64          `json:"program_count"`
	LecturerCount   int64          `json:"lecturer_count"`
}

// GetFacultyWithStats gets a faculty with its statistics
func (s *FacultyService) GetFacultyWithStats(id uint) (*FacultyWithStats, error) {
	// Get faculty
	faculty, err := s.repository.FindByID(id)
	if err != nil {
		return nil, err
	}
	if faculty == nil {
		return nil, errors.New("faculty not found")
	}

	// Count programs
	programCount, err := s.repository.CountStudyPrograms(id)
	if err != nil {
		return nil, err
	}

	// Return faculty with stats
	return &FacultyWithStats{
		Faculty:       *faculty,
		ProgramCount:  programCount,
		LecturerCount: int64(faculty.LecturerCount),
	}, nil
}

// GetAllFacultiesWithStats gets all faculties with their statistics
func (s *FacultyService) GetAllFacultiesWithStats() ([]FacultyWithStats, error) {
	// Get all faculties
	faculties, err := s.repository.FindAll()
	if err != nil {
		return nil, err
	}

	// Build response with stats
	result := make([]FacultyWithStats, len(faculties))
	for i, faculty := range faculties {
		// Count programs for each faculty
		programCount, err := s.repository.CountStudyPrograms(faculty.ID)
		if err != nil {
			return nil, err
		}

		result[i] = FacultyWithStats{
			Faculty:       faculty,
			ProgramCount:  programCount,
			LecturerCount: int64(faculty.LecturerCount),
		}
	}

	return result, nil
} 