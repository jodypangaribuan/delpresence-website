package services

import (
	"errors"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

// StudyProgramService is a service for study program operations
type StudyProgramService struct {
	repository      *repositories.StudyProgramRepository
	facultyRepository *repositories.FacultyRepository
}

// NewStudyProgramService creates a new study program service
func NewStudyProgramService() *StudyProgramService {
	return &StudyProgramService{
		repository:      repositories.NewStudyProgramRepository(),
		facultyRepository: repositories.NewFacultyRepository(),
	}
}

// CreateStudyProgram creates a new study program
func (s *StudyProgramService) CreateStudyProgram(program *models.StudyProgram) error {
	// Check if code already exists
	existingProgram, err := s.repository.FindByCode(program.Code)
	if err != nil {
		return err
	}
	if existingProgram != nil {
		return errors.New("study program with this code already exists")
	}

	// Check if faculty exists
	faculty, err := s.facultyRepository.FindByID(program.FacultyID)
	if err != nil {
		return err
	}
	if faculty == nil {
		return errors.New("faculty not found")
	}

	// Create study program
	return s.repository.Create(program)
}

// UpdateStudyProgram updates an existing study program
func (s *StudyProgramService) UpdateStudyProgram(program *models.StudyProgram) error {
	// Check if study program exists
	existingProgram, err := s.repository.FindByID(program.ID)
	if err != nil {
		return err
	}
	if existingProgram == nil {
		return errors.New("study program not found")
	}

	// If code is changed, check if new code already exists
	if program.Code != existingProgram.Code {
		existingWithCode, err := s.repository.FindByCode(program.Code)
		if err != nil {
			return err
		}
		if existingWithCode != nil && existingWithCode.ID != program.ID {
			return errors.New("study program with this code already exists")
		}
	}

	// Check if faculty exists
	faculty, err := s.facultyRepository.FindByID(program.FacultyID)
	if err != nil {
		return err
	}
	if faculty == nil {
		return errors.New("faculty not found")
	}

	// Update study program
	return s.repository.Update(program)
}

// GetStudyProgramByID gets a study program by ID
func (s *StudyProgramService) GetStudyProgramByID(id uint) (*models.StudyProgram, error) {
	return s.repository.FindByID(id)
}

// GetAllStudyPrograms gets all study programs
func (s *StudyProgramService) GetAllStudyPrograms() ([]models.StudyProgram, error) {
	return s.repository.FindAll()
}

// GetStudyProgramsByFacultyID gets all study programs by faculty ID
func (s *StudyProgramService) GetStudyProgramsByFacultyID(facultyID uint) ([]models.StudyProgram, error) {
	// Check if faculty exists
	faculty, err := s.facultyRepository.FindByID(facultyID)
	if err != nil {
		return nil, err
	}
	if faculty == nil {
		return nil, errors.New("faculty not found")
	}

	return s.repository.FindByFacultyID(facultyID)
}

// DeleteStudyProgram deletes a study program
func (s *StudyProgramService) DeleteStudyProgram(id uint) error {
	// Check if study program exists
	program, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if program == nil {
		return errors.New("study program not found")
	}

	// Delete study program
	return s.repository.DeleteByID(id)
}

// GetStudyProgramStats gets statistics for a study program
type StudyProgramWithStats struct {
	StudyProgram   models.StudyProgram `json:"study_program"`
	LecturerCount  int64               `json:"lecturer_count"`
	StudentCount   int64               `json:"student_count"`
}

// GetStudyProgramWithStats gets a study program with statistics
func (s *StudyProgramService) GetStudyProgramWithStats(id uint) (*StudyProgramWithStats, error) {
	// Get study program
	program, err := s.repository.FindByID(id)
	if err != nil {
		return nil, err
	}
	if program == nil {
		return nil, errors.New("study program not found")
	}

	// Build response
	return &StudyProgramWithStats{
		StudyProgram:  *program,
		LecturerCount: int64(program.LecturerCount),
		StudentCount:  int64(program.StudentCount),
	}, nil
}

// GetAllStudyProgramsWithStats gets all study programs with statistics
func (s *StudyProgramService) GetAllStudyProgramsWithStats() ([]StudyProgramWithStats, error) {
	// Get all study programs
	programs, err := s.repository.FindAll()
	if err != nil {
		return nil, err
	}

	// Build response with stats
	result := make([]StudyProgramWithStats, len(programs))
	for i, program := range programs {
		result[i] = StudyProgramWithStats{
			StudyProgram:  program,
			LecturerCount: int64(program.LecturerCount),
			StudentCount:  int64(program.StudentCount),
		}
	}

	return result, nil
} 