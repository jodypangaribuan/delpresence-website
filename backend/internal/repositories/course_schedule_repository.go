package repositories

import (
	"fmt"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// CourseScheduleRepository handles database operations for course schedules
type CourseScheduleRepository struct {
	db *gorm.DB
}

// NewCourseScheduleRepository creates a new instance of CourseScheduleRepository
func NewCourseScheduleRepository() *CourseScheduleRepository {
	return &CourseScheduleRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all course schedules
func (r *CourseScheduleRepository) GetAll() ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Find(&schedules).Error
	return schedules, err
}

// GetByID returns a course schedule by its ID
func (r *CourseScheduleRepository) GetByID(id uint) (models.CourseSchedule, error) {
	var schedule models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		First(&schedule, id).Error
	return schedule, err
}

// Create creates a new course schedule
func (r *CourseScheduleRepository) Create(schedule models.CourseSchedule) (models.CourseSchedule, error) {
	err := r.db.Create(&schedule).Error
	return schedule, err
}

// Update updates an existing course schedule
func (r *CourseScheduleRepository) Update(schedule models.CourseSchedule) (models.CourseSchedule, error) {
	// First, log the changes for debugging
	fmt.Printf("Updating schedule ID=%d: student_group_id=%d\n", schedule.ID, schedule.StudentGroupID)

	// Use a more explicit update method to ensure student_group_id gets updated
	tx := r.db.Begin()

	// Update the specific fields we want to ensure are updated
	updateErr := tx.Model(&models.CourseSchedule{}).Where("id = ?", schedule.ID).Updates(map[string]interface{}{
		"course_id":        schedule.CourseID,
		"room_id":          schedule.RoomID,
		"day":              schedule.Day,
		"start_time":       schedule.StartTime,
		"end_time":         schedule.EndTime,
		"lecturer_id":      schedule.UserID,
		"student_group_id": schedule.StudentGroupID,
		"academic_year_id": schedule.AcademicYearID,
		"capacity":         schedule.Capacity,
		"enrolled":         schedule.Enrolled,
		"updated_at":       schedule.UpdatedAt,
	}).Error

	if updateErr != nil {
		tx.Rollback()
		return schedule, updateErr
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		return schedule, err
	}

	// Reload the schedule to get the fresh data
	var updatedSchedule models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		First(&updatedSchedule, schedule.ID).Error

	// Log the updated schedule for debugging
	fmt.Printf("After update, schedule ID=%d: student_group_id=%d\n", updatedSchedule.ID, updatedSchedule.StudentGroupID)

	return updatedSchedule, err
}

// Delete deletes a course schedule
func (r *CourseScheduleRepository) Delete(id uint) error {
	return r.db.Delete(&models.CourseSchedule{}, id).Error
}

// GetByAcademicYear returns course schedules by academic year ID
func (r *CourseScheduleRepository) GetByAcademicYear(academicYearID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("academic_year_id = ?", academicYearID).
		Find(&schedules).Error
	return schedules, err
}

// GetByLecturer returns course schedules by lecturer ID
func (r *CourseScheduleRepository) GetByLecturer(userID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule

	// First try with lecturer_id directly
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("lecturer_id = ?", userID).
		Find(&schedules).Error

	if err != nil || len(schedules) == 0 {
		// Try another approach - find assignments for this lecturer and then find schedules
		fmt.Printf("No schedules found directly for lecturer_id=%d, trying assignments\n", userID)

		// Get lecturer record
		lecturerRepo := NewLecturerRepository()
		lecturer, err := lecturerRepo.GetByUserID(int(userID))

		if err == nil && lecturer.ID > 0 {
			// Find assignments for this lecturer
			assignmentRepo := NewLecturerAssignmentRepository()
			assignments, err := assignmentRepo.GetByLecturerID(lecturer.UserID, 0) // 0 means all academic years

			if err == nil && len(assignments) > 0 {
				// For each assignment, find schedules
				var allSchedules []models.CourseSchedule

				for _, assignment := range assignments {
					var courseSchedules []models.CourseSchedule
					r.db.
						Preload("Course").
						Preload("Room").
						Preload("Room.Building").
						Preload("Lecturer").
						Preload("StudentGroup").
						Preload("AcademicYear").
						Where("course_id = ?", assignment.CourseID).
						Find(&courseSchedules)

					allSchedules = append(allSchedules, courseSchedules...)
				}

				if len(allSchedules) > 0 {
					return allSchedules, nil
				}
			}
		}
	}

	return schedules, err
}

// GetByLecturerAndAcademicYear returns course schedules by lecturer ID and academic year ID
func (r *CourseScheduleRepository) GetByLecturerAndAcademicYear(userID uint, academicYearID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule

	// First try with lecturer_id directly
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("lecturer_id = ? AND academic_year_id = ?", userID, academicYearID).
		Find(&schedules).Error

	if err != nil || len(schedules) == 0 {
		// Try another approach - find assignments for this lecturer and then find schedules
		fmt.Printf("No schedules found directly for lecturer_id=%d and academic_year_id=%d, trying assignments\n", userID, academicYearID)

		// Get lecturer record
		lecturerRepo := NewLecturerRepository()
		lecturer, err := lecturerRepo.GetByUserID(int(userID))

		if err == nil && lecturer.ID > 0 {
			// Find assignments for this lecturer
			assignmentRepo := NewLecturerAssignmentRepository()
			assignments, err := assignmentRepo.GetByLecturerID(lecturer.UserID, academicYearID)

			if err == nil && len(assignments) > 0 {
				// For each assignment, find schedules
				var allSchedules []models.CourseSchedule

				for _, assignment := range assignments {
					var courseSchedules []models.CourseSchedule
					r.db.
						Preload("Course").
						Preload("Room").
						Preload("Room.Building").
						Preload("Lecturer").
						Preload("StudentGroup").
						Preload("AcademicYear").
						Where("course_id = ? AND academic_year_id = ?", assignment.CourseID, academicYearID).
						Find(&courseSchedules)

					allSchedules = append(allSchedules, courseSchedules...)
				}

				if len(allSchedules) > 0 {
					return allSchedules, nil
				}
			}
		}
	}

	return schedules, err
}

// GetByStudentGroup returns course schedules by student group ID
func (r *CourseScheduleRepository) GetByStudentGroup(studentGroupID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("student_group_id = ?", studentGroupID).
		Find(&schedules).Error
	return schedules, err
}

// GetByRoom returns course schedules by room ID
func (r *CourseScheduleRepository) GetByRoom(roomID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("room_id = ?", roomID).
		Find(&schedules).Error
	return schedules, err
}

// GetByBuilding returns course schedules by building ID (via rooms)
func (r *CourseScheduleRepository) GetByBuilding(buildingID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Joins("JOIN rooms ON course_schedules.room_id = rooms.id").
		Where("rooms.building_id = ?", buildingID).
		Find(&schedules).Error
	return schedules, err
}

// GetByCourse returns course schedules by course ID
func (r *CourseScheduleRepository) GetByCourse(courseID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("course_id = ?", courseID).
		Find(&schedules).Error
	return schedules, err
}

// GetByDay returns course schedules by day
func (r *CourseScheduleRepository) GetByDay(day string) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("day = ?", day).
		Find(&schedules).Error
	return schedules, err
}

// CheckScheduleConflict checks if there's a schedule conflict
func (r *CourseScheduleRepository) CheckScheduleConflict(roomID uint, day string, startTime, endTime string, scheduleID *uint) (bool, error) {
	query := r.db.Model(&models.CourseSchedule{}).
		Where("room_id = ? AND day = ?", roomID, day).
		Where("(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?)",
			endTime, startTime, endTime, startTime, startTime, endTime)

	// Exclude the current schedule if updating
	if scheduleID != nil {
		query = query.Where("id <> ?", *scheduleID)
	}

	var count int64
	err := query.Count(&count).Error

	return count > 0, err
}

// CheckLecturerScheduleConflict checks if there's a lecturer schedule conflict
func (r *CourseScheduleRepository) CheckLecturerScheduleConflict(userID uint, day string, startTime, endTime string, scheduleID *uint) (bool, error) {
	query := r.db.Model(&models.CourseSchedule{}).
		Where("lecturer_id = ? AND day = ?", userID, day).
		Where("(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?)",
			endTime, startTime, endTime, startTime, startTime, endTime)

	// Exclude the current schedule if updating
	if scheduleID != nil {
		query = query.Where("id <> ?", *scheduleID)
	}

	var count int64
	err := query.Count(&count).Error

	return count > 0, err
}

// CheckStudentGroupScheduleConflict checks if there's a student group schedule conflict
func (r *CourseScheduleRepository) CheckStudentGroupScheduleConflict(studentGroupID uint, day string, startTime, endTime string, scheduleID *uint) (bool, error) {
	query := r.db.Model(&models.CourseSchedule{}).
		Where("student_group_id = ? AND day = ?", studentGroupID, day).
		Where("(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?)",
			endTime, startTime, endTime, startTime, startTime, endTime)

	// Exclude the current schedule if updating
	if scheduleID != nil {
		query = query.Where("id <> ?", *scheduleID)
	}

	var count int64
	err := query.Count(&count).Error

	return count > 0, err
}

// UpdateSchedulesForCourseInAcademicYear updates all schedules for a specific course in an academic year
// to use the new lecturer ID. This is used when lecturer assignments change.
func (r *CourseScheduleRepository) UpdateSchedulesForCourseInAcademicYear(courseID, academicYearID, newUserID uint) error {
	// First, find all schedules that match the criteria
	var schedules []models.CourseSchedule
	err := r.db.Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID).Find(&schedules).Error
	if err != nil {
		return err
	}

	// If no schedules found, there's nothing to update
	if len(schedules) == 0 {
		return nil
	}

	// Update schedules one by one to ensure proper handling of associations
	for _, schedule := range schedules {
		// Update the lecturer_id field
		schedule.UserID = newUserID

		// Save the updated schedule - this will trigger any hooks and handle associations
		if err := r.db.Save(&schedule).Error; err != nil {
			return err
		}

		// Log successful update
		fmt.Printf("Updated schedule ID %d to use lecturer_id %d\n", schedule.ID, newUserID)
	}

	return nil
}

// UpdateSchedulesForCourse updates all schedules for a specific course to use a new lecturer
func (r *CourseScheduleRepository) UpdateSchedulesForCourse(courseID, lecturerID uint) error {
	return r.db.Model(&models.CourseSchedule{}).
		Where("course_id = ?", courseID).
		Update("lecturer_id", lecturerID).Error
}

// GetByCourseAndAcademicYear returns course schedules by course ID and academic year ID
func (r *CourseScheduleRepository) GetByCourseAndAcademicYear(courseID, academicYearID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID).
		Find(&schedules).Error
	return schedules, err
}

// UpdateSchedulesForRoom updates all schedules associated with a room
func (r *CourseScheduleRepository) UpdateSchedulesForRoom(roomID uint, capacity int) error {
	result := r.db.Model(&models.CourseSchedule{}).
		Where("room_id = ?", roomID).
		Update("capacity", capacity)

	if result.Error != nil {
		return result.Error
	}

	fmt.Printf("Updated %d course schedules for room_id=%d with capacity=%d\n",
		result.RowsAffected, roomID, capacity)

	return nil
}

// GetByStudentGroupAndAcademicYear returns course schedules by student group ID and academic year ID
func (r *CourseScheduleRepository) GetByStudentGroupAndAcademicYear(studentGroupID uint, academicYearID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("student_group_id = ? AND academic_year_id = ?", studentGroupID, academicYearID).
		Find(&schedules).Error
	return schedules, err
}

// DB returns the database instance
func (r *CourseScheduleRepository) DB() *gorm.DB {
	return r.db
}
