package services

import (
	"errors"
	"sort"
	
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

	// Validate lecturer - look up in Users table first (ideally)
	user, err := s.lecturerRepo.FindByID(schedule.UserID)
	// If the User couldn't be found or is not a lecturer, check if a lecturer has been assigned to this course
	if err != nil || user == nil || user.Role != "Dosen" {
		// Initialize repositories
		lecturerAssignmentRepo := repositories.NewLecturerAssignmentRepository()
		
		// Get academic years and use the provided one or any available one
		academicYearID := schedule.AcademicYearID
		if academicYearID == 0 {
			// Use any available academic year
			academicYears, err := s.academicYearRepo.FindAll()
			if err != nil || len(academicYears) == 0 {
				return models.CourseSchedule{}, errors.New("no academic years found")
			}
			
			// Sort by ID descending to get the most recent one
			sort.Slice(academicYears, func(i, j int) bool {
				return academicYears[i].ID > academicYears[j].ID
			})
			academicYearID = academicYears[0].ID
		}
		
		// Check if any lecturer is assigned to this course
		assignments, err := lecturerAssignmentRepo.GetByCourseID(schedule.CourseID, academicYearID)
		if err != nil || len(assignments) == 0 {
			return models.CourseSchedule{}, errors.New("invalid lecturer/user ID and no lecturer assigned to this course")
		}
		
		// Adapt the schedule's UserID to use the first lecturer assignment's ID
		lecturer := assignments[0].Lecturer
		if lecturer == nil {
			return models.CourseSchedule{}, errors.New("lecturer information not found for this course")
		}
		
		// Try to find user by external ID
		userRepo := repositories.NewUserRepository()
		user, _ := userRepo.FindByExternalUserID(lecturer.UserID)
		
		// If user is found, use that ID; otherwise use the provided ID
		if user != nil {
			schedule.UserID = user.ID
		}
		// No need to update schedule.UserID here - we'll continue with the originally provided ID
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
		schedule.UserID,
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
func (s *CourseScheduleService) UpdateSchedule(schedule models.CourseSchedule) (models.CourseSchedule, error) {
	// Check if schedule exists
	existingSchedule, err := s.repo.GetByID(schedule.ID)
	if err != nil {
		return models.CourseSchedule{}, errors.New("schedule not found")
	}

	// Check for room conflicts (excluding this schedule)
	hasConflict, err := s.repo.CheckScheduleConflict(
		schedule.RoomID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		&schedule.ID,
	)
	if err != nil {
		return models.CourseSchedule{}, err
	}
	if hasConflict {
		return models.CourseSchedule{}, errors.New("room is already scheduled for this time")
	}

	// Check for lecturer conflicts (excluding this schedule)
	hasConflict, err = s.repo.CheckLecturerScheduleConflict(
		schedule.UserID,
		schedule.Day,
		schedule.StartTime,
		schedule.EndTime,
		&schedule.ID,
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
		&schedule.ID,
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
func (s *CourseScheduleService) GetSchedulesByLecturer(userID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByLecturer(userID)
}

// GetSchedulesByLecturerAndAcademicYear retrieves all course schedules for a specific lecturer in a specific academic year
func (s *CourseScheduleService) GetSchedulesByLecturerAndAcademicYear(userID uint, academicYearID uint) ([]models.CourseSchedule, error) {
	return s.repo.GetByLecturerAndAcademicYear(userID, academicYearID)
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
		"lecturer_id":    schedule.UserID,
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

	// Handle lecturer information with better fallbacks
	if schedule.Lecturer.ID != 0 {
		// Get lecturer name from User object
		lecturerName := schedule.Lecturer.Username
		
		// Try to find full name from the Lecturer table if User is linked to a lecturer
		if schedule.Lecturer.ExternalUserID != nil {
			lecturerRepo := repositories.NewLecturerRepository()
			// Convert external user ID to int for GetByUserID
			externalUserID := int(*schedule.Lecturer.ExternalUserID)
			lecturer, err := lecturerRepo.GetByUserID(externalUserID)
			if err == nil && lecturer.FullName != "" {
				lecturerName = lecturer.FullName
			}
		} else {
			// If no ExternalUserID, try to find lecturer directly using the UserID as lecturer.UserID
			lecturerRepo := repositories.NewLecturerRepository()
			lecturer, err := lecturerRepo.GetByUserID(int(schedule.UserID))
			if err == nil && lecturer.FullName != "" {
				lecturerName = lecturer.FullName
			} else {
				// Try to find by ID as last resort
				lecturer, err = lecturerRepo.GetByID(schedule.UserID)
				if err == nil && lecturer.FullName != "" {
					lecturerName = lecturer.FullName
				} else {
					// If we can't find the lecturer, use a meaningful default
					lecturerName = "Dosen"
				}
			}
		}
		
		response["lecturer_name"] = lecturerName
	} else {
		// Try to get lecturer directly from lecturer repository
		lecturerRepo := repositories.NewLecturerRepository()
		
		// Try by UserID first, which is stored in lecturer_id column
		lecturer, err := lecturerRepo.GetByUserID(int(schedule.UserID))
		if err == nil && lecturer.FullName != "" {
			response["lecturer_name"] = lecturer.FullName
		} else {
			// Try by direct ID match
			lecturer, err = lecturerRepo.GetByID(schedule.UserID)
			if err == nil && lecturer.FullName != "" {
				response["lecturer_name"] = lecturer.FullName
			} else {
				// Set a default value if we couldn't find the lecturer name
				response["lecturer_name"] = "Dosen"
			}
		}
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

// CheckForScheduleConflicts checks for various scheduling conflicts
func (s *CourseScheduleService) CheckForScheduleConflicts(
	scheduleID *uint,
	roomID uint,
	userID uint,
	studentGroupID uint,
	day string,
	startTime string,
	endTime string,
) (map[string]bool, error) {
	// Result map to hold conflicts by type
	conflicts := map[string]bool{
		"room":          false,
		"lecturer":      false,
		"student_group": false,
	}

	// Check room conflicts
	roomConflict, err := s.repo.CheckScheduleConflict(roomID, day, startTime, endTime, scheduleID)
	if err != nil {
		return conflicts, err
	}
	conflicts["room"] = roomConflict

	// Check lecturer conflicts
	lecturerConflict, err := s.repo.CheckLecturerScheduleConflict(userID, day, startTime, endTime, scheduleID)
	if err != nil {
		return conflicts, err
	}
	conflicts["lecturer"] = lecturerConflict

	// Check student group conflicts
	studentGroupConflict, err := s.repo.CheckStudentGroupScheduleConflict(studentGroupID, day, startTime, endTime, scheduleID)
	if err != nil {
		return conflicts, err
	}
	conflicts["student_group"] = studentGroupConflict

	return conflicts, nil
}

// CheckRoomScheduleConflict checks if there's a room schedule conflict
func (s *CourseScheduleService) CheckRoomScheduleConflict(roomID uint, day string, startTime string, endTime string, scheduleID *uint) (bool, error) {
	return s.repo.CheckScheduleConflict(roomID, day, startTime, endTime, scheduleID)
}

// CheckLecturerScheduleConflict checks if there's a lecturer schedule conflict
func (s *CourseScheduleService) CheckLecturerScheduleConflict(userID uint, day string, startTime string, endTime string, scheduleID *uint) (bool, error) {
	return s.repo.CheckLecturerScheduleConflict(userID, day, startTime, endTime, scheduleID)
}

// CheckStudentGroupScheduleConflict checks if there's a student group schedule conflict
func (s *CourseScheduleService) CheckStudentGroupScheduleConflict(studentGroupID uint, day string, startTime string, endTime string, scheduleID *uint) (bool, error) {
	return s.repo.CheckStudentGroupScheduleConflict(studentGroupID, day, startTime, endTime, scheduleID)
} 