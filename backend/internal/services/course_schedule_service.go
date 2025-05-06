package services

import (
	"errors"
	"fmt"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

// CourseScheduleService provides business logic for course schedules
type CourseScheduleService struct {
	repo              *repositories.CourseScheduleRepository
	courseRepo        *repositories.CourseRepository
	roomRepo          *repositories.RoomRepository
	studentGroupRepo  *repositories.StudentGroupRepository
	lecturerRepo      *repositories.UserRepository
	academicYearRepo  *repositories.AcademicYearRepository
}

// NewCourseScheduleService creates a new instance of CourseScheduleService
func NewCourseScheduleService() *CourseScheduleService {
	return &CourseScheduleService{
		repo:              repositories.NewCourseScheduleRepository(),
		courseRepo:        repositories.NewCourseRepository(),
		roomRepo:          repositories.NewRoomRepository(),
		studentGroupRepo:  repositories.NewStudentGroupRepository(),
		lecturerRepo:      repositories.NewUserRepository(),
		academicYearRepo:  repositories.NewAcademicYearRepository(),
	}
}

// GetAllSchedules retrieves all course schedules
func (s *CourseScheduleService) GetAllSchedules() ([]models.CourseSchedule, error) {
	return s.repo.GetAll()
}

// GetScheduleByID retrieves a course schedule by ID
func (s *CourseScheduleService) GetScheduleByID(id uint) (models.CourseSchedule, error) {
	return s.repo.GetByID(id)
}

// CreateSchedule creates a new course schedule
func (s *CourseScheduleService) CreateSchedule(schedule models.CourseSchedule) (models.CourseSchedule, error) {
	// Validate course
	_, err := s.courseRepo.GetByID(schedule.CourseID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("invalid course ID")
	}

	// Validate room
	_, err = s.roomRepo.FindByID(schedule.RoomID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("invalid room ID")
	}

	// Validate lecturer (must be a lecturer)
	lecturer, err := s.lecturerRepo.FindByID(schedule.LecturerID)
	if err != nil || lecturer == nil || lecturer.Role != "Dosen" {
		return models.CourseSchedule{}, errors.New("invalid lecturer ID")
	}

	// Validate student group
	_, err = s.studentGroupRepo.GetByID(schedule.StudentGroupID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("invalid student group ID")
	}

	// Validate academic year
	academicYear, err := s.academicYearRepo.FindByID(schedule.AcademicYearID)
	if err != nil || academicYear == nil {
		return models.CourseSchedule{}, errors.New("invalid academic year ID")
	}

	// Check for room conflicts
	hasConflict, err := s.repo.CheckScheduleConflict(
		schedule.RoomID, 
		schedule.Day, 
		schedule.StartTime, 
		schedule.EndTime, 
		nil,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("room is already scheduled for this time")
	}

	// Check for lecturer conflicts
	hasConflict, err = s.repo.CheckLecturerScheduleConflict(
		schedule.LecturerID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		nil,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("lecturer is already scheduled for this time")
	}

	// Check for student group conflicts
	hasConflict, err = s.repo.CheckStudentGroupScheduleConflict(
		schedule.StudentGroupID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		nil,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("student group is already scheduled for this time")
	}

	return s.repo.Create(schedule)
}

// UpdateSchedule updates an existing course schedule
func (s *CourseScheduleService) UpdateSchedule(id uint, schedule models.CourseSchedule) (models.CourseSchedule, error) {
	// Check if schedule exists
	existingSchedule, err := s.repo.GetByID(id)
	if err != nil {
		return models.CourseSchedule{}, errors.New("schedule not found")
	}

	// Update schedule fields
	schedule.ID = id

	// Validate course
	_, err = s.courseRepo.GetByID(schedule.CourseID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("invalid course ID")
	}

	// Validate room
	_, err = s.roomRepo.FindByID(schedule.RoomID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("invalid room ID")
	}

	// Validate lecturer (must be a lecturer)
	lecturer, err := s.lecturerRepo.FindByID(schedule.LecturerID)
	if err != nil || lecturer == nil || lecturer.Role != "Dosen" {
		return models.CourseSchedule{}, errors.New("invalid lecturer ID")
	}

	// Validate student group
	_, err = s.studentGroupRepo.GetByID(schedule.StudentGroupID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("invalid student group ID")
	}

	// Validate academic year
	academicYear, err := s.academicYearRepo.FindByID(schedule.AcademicYearID)
	if err != nil || academicYear == nil {
		return models.CourseSchedule{}, errors.New("invalid academic year ID")
	}

	// Check for room conflicts (excluding this schedule)
	hasConflict, err := s.repo.CheckScheduleConflict(
		schedule.RoomID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		&id,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("room is already scheduled for this time")
	}

	// Check for lecturer conflicts (excluding this schedule)
	hasConflict, err = s.repo.CheckLecturerScheduleConflict(
		schedule.LecturerID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		&id,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("lecturer is already scheduled for this time")
	}

	// Check for student group conflicts (excluding this schedule)
	hasConflict, err = s.repo.CheckStudentGroupScheduleConflict(
		schedule.StudentGroupID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		&id,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("student group is already scheduled for this time")
	}

	// Keep some fields from existing
	schedule.CreatedAt = existingSchedule.CreatedAt

	return s.repo.Update(schedule)
}

// DeleteSchedule deletes a course schedule
func (s *CourseScheduleService) DeleteSchedule(id uint) error {
	// Check if schedule exists
	_, err := s.repo.GetByID(id)
	if err != nil {
		return errors.New("schedule not found")
	}

	return s.repo.Delete(id)
}

// GetSchedulesByAcademicYear retrieves schedules by academic year
func (s *CourseScheduleService) GetSchedulesByAcademicYear(academicYearID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByAcademicYear(academicYearID)
}

// GetSchedulesByLecturer retrieves schedules by lecturer
func (s *CourseScheduleService) GetSchedulesByLecturer(lecturerID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByLecturer(lecturerID)
}

// GetSchedulesByStudentGroup retrieves schedules by student group
func (s *CourseScheduleService) GetSchedulesByStudentGroup(studentGroupID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByStudentGroup(studentGroupID)
}

// GetSchedulesByDay retrieves schedules by day
func (s *CourseScheduleService) GetSchedulesByDay(day string) ([]models.CourseSchedule, error) {
	return s.repo.GetByDay(day)
}

// GetSchedulesByRoom retrieves schedules by room
func (s *CourseScheduleService) GetSchedulesByRoom(roomID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByRoom(roomID)
}

// GetSchedulesByBuilding retrieves schedules by building
func (s *CourseScheduleService) GetSchedulesByBuilding(buildingID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByBuilding(buildingID)
}

// GetSchedulesByCourse retrieves schedules by course
func (s *CourseScheduleService) GetSchedulesByCourse(courseID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByCourse(courseID)
}

// FormatScheduleForResponse formats a schedule for response to clients
func (s *CourseScheduleService) FormatScheduleForResponse(schedule models.CourseSchedule) map[string]interface{} {
	// Build a response that matches the expected frontend format
	response := map[string]interface{}{
		"id":             schedule.ID,
		"course_id":      schedule.CourseID,
		"room_id":        schedule.RoomID,
		"day":            schedule.Day,
		"start_time":     schedule.StartTime,
		"end_time":       schedule.EndTime,
		"lecturer_id":    schedule.LecturerID,
		"student_group_id": schedule.StudentGroupID,
		"academic_year_id": schedule.AcademicYearID,
		"capacity":       schedule.Capacity,
		"enrolled":       schedule.Enrolled,
	}

	// Add related data if loaded
	if schedule.Course.ID != 0 {
		response["course_name"] = schedule.Course.Name
		response["course_code"] = schedule.Course.Code
		response["semester"] = schedule.Course.Semester
	}

	if schedule.Room.ID != 0 {
		response["room_name"] = schedule.Room.Name
		
		if schedule.Room.Building.ID != 0 {
			response["building_name"] = schedule.Room.Building.Name
		}
	}

	if schedule.Lecturer.ID != 0 {
		response["lecturer_name"] = schedule.Lecturer.Username
	}

	if schedule.StudentGroup.ID != 0 {
		response["student_group_name"] = schedule.StudentGroup.Name
	}

	if schedule.AcademicYear.ID != 0 {
		response["academic_year_name"] = schedule.AcademicYear.Name
	}

	return response
}

// FormatSchedulesForResponse formats multiple schedules for response
func (s *CourseScheduleService) FormatSchedulesForResponse(schedules []models.CourseSchedule) []map[string]interface{} {
	result := make([]map[string]interface{}, len(schedules))
	for i, schedule := range schedules {
		result[i] = s.FormatScheduleForResponse(schedule)
	}
	return result
}

// CheckForScheduleConflicts checks for any schedule conflicts
func (s *CourseScheduleService) CheckForScheduleConflicts(scheduleID *uint, roomID uint, lecturerID uint, studentGroupID uint, day string, startTime string, endTime string) (map[string]bool, error) {
	conflicts := map[string]bool{
		"room": false,
		"lecturer": false,
		"student_group": false,
	}
	
	// Check for room conflicts
	roomConflict, err := s.repo.CheckScheduleConflict(roomID, day, startTime, endTime, scheduleID)
	if err != nil {
		return nil, fmt.Errorf("failed to check room conflicts: %w", err)
	}
	conflicts["room"] = roomConflict
	
	// Check for lecturer conflicts
	lecturerConflict, err := s.repo.CheckLecturerScheduleConflict(lecturerID, day, startTime, endTime, scheduleID)
	if err != nil {
		return nil, fmt.Errorf("failed to check lecturer conflicts: %w", err)
	}
	conflicts["lecturer"] = lecturerConflict
	
	// Check for student group conflicts
	studentGroupConflict, err := s.repo.CheckStudentGroupScheduleConflict(studentGroupID, day, startTime, endTime, scheduleID)
	if err != nil {
		return nil, fmt.Errorf("failed to check student group conflicts: %w", err)
	}
	conflicts["student_group"] = studentGroupConflict
	
	return conflicts, nil
} 