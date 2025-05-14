package services

import (
	"fmt"
	"github.com/delpresence/backend/internal/repositories"
)

// ScheduleSyncService provides methods to synchronize related data in schedules
type ScheduleSyncService struct {
	scheduleRepo  *repositories.CourseScheduleRepository
	lecturerRepo  *repositories.LecturerRepository
}

// NewScheduleSyncService creates a new instance of ScheduleSyncService
func NewScheduleSyncService() *ScheduleSyncService {
	return &ScheduleSyncService{
		scheduleRepo:  repositories.NewCourseScheduleRepository(),
		lecturerRepo:  repositories.NewLecturerRepository(),
	}
}

// SyncLecturerAssignmentWithSchedules updates all schedules for a specific course and academic year
// to use the lecturer ID (directly references the user_id in the lecturers table)
func (s *ScheduleSyncService) SyncLecturerAssignmentWithSchedules(
	courseID, academicYearID uint,
	lecturerUserID int,
) error {
	// Find the lecturer record directly based on user_id
	lecturer, err := s.lecturerRepo.GetByUserID(lecturerUserID)
	if err != nil {
		fmt.Printf("Error finding lecturer by user_id %d: %v\n", lecturerUserID, err)
		return fmt.Errorf("failed to find lecturer by user_id: %w", err)
	}
	
	if lecturer.ID == 0 {
		fmt.Printf("Lecturer not found for user_id %d\n", lecturerUserID)
		return fmt.Errorf("lecturer not found for user_id %d", lecturerUserID)
	}

	fmt.Printf("Syncing course schedules: courseID=%d, academicYearID=%d, updating lecturer user_id=%d\n", 
		courseID, academicYearID, lecturerUserID)

	// Update all schedules for this course in this academic year with the lecturer user_id
	// This assumes the lecturer_id column in course_schedules maps to the user_id field in lecturers
	if err := s.scheduleRepo.UpdateSchedulesForCourseInAcademicYear(
		courseID,
		academicYearID,
		uint(lecturerUserID), // Convert to uint for the schedule repository method
	); err != nil {
		fmt.Printf("Error updating course schedules: %v\n", err)
		return fmt.Errorf("failed to update schedules: %w", err)
	}

	return nil
} 