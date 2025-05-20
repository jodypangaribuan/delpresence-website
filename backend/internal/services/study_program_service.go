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
	// Check if code already exists (including soft-deleted records)
	exists, err := s.repository.CheckCodeExists(program.Code, 0)
	if err != nil {
		return err
	}
	
	if exists {
		// Try to find and restore a soft-deleted record with the same code
		restoredProgram, err := s.repository.RestoreByCode(program.Code)
		if err != nil {
			return err
		}
		
		if restoredProgram != nil {
			// Update the restored program with new data
			restoredProgram.Name = program.Name
			restoredProgram.FacultyID = program.FacultyID
			restoredProgram.Degree = program.Degree
			restoredProgram.Accreditation = program.Accreditation
			restoredProgram.HeadOfDepartment = program.HeadOfDepartment
			restoredProgram.LecturerCount = program.LecturerCount
			restoredProgram.StudentCount = program.StudentCount
			
			// Update the restored program
			if err := s.repository.Update(restoredProgram); err != nil {
				return err
			}
			
			// Copy ID to the original program
			program.ID = restoredProgram.ID
			return nil
		}
		
		return errors.New("program studi dengan kode ini sudah ada")
	}

	// Check if faculty exists
	faculty, err := s.facultyRepository.FindByID(program.FacultyID)
	if err != nil {
		return err
	}
	if faculty == nil {
		return errors.New("fakultas tidak ditemukan")
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
		return errors.New("program studi tidak ditemukan")
	}

	// If code is changed, check if new code already exists (including soft-deleted records)
	if program.Code != existingProgram.Code {
		exists, err := s.repository.CheckCodeExists(program.Code, program.ID)
		if err != nil {
			return err
		}
		if exists {
			return errors.New("program studi dengan kode ini sudah ada (termasuk yang sudah dihapus)")
		}
	}

	// Check if faculty exists
	faculty, err := s.facultyRepository.FindByID(program.FacultyID)
	if err != nil {
		return err
	}
	if faculty == nil {
		return errors.New("fakultas tidak ditemukan")
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
		return nil, errors.New("fakultas tidak ditemukan")
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
		return errors.New("program studi tidak ditemukan")
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
		return nil, errors.New("program studi tidak ditemukan")
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