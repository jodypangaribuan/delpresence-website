package repositories

import (
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
	err := r.db.Save(&schedule).Error
	return schedule, err
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
func (r *CourseScheduleRepository) GetByLecturer(lecturerID uint) ([]models.CourseSchedule, error) {
	var schedules []models.CourseSchedule
	err := r.db.
		Preload("Course").
		Preload("Room").
		Preload("Room.Building").
		Preload("Lecturer").
		Preload("StudentGroup").
		Preload("AcademicYear").
		Where("lecturer_id = ?", lecturerID).
		Find(&schedules).Error
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
func (r *CourseScheduleRepository) CheckLecturerScheduleConflict(lecturerID uint, day string, startTime, endTime string, scheduleID *uint) (bool, error) {
	query := r.db.Model(&models.CourseSchedule{}).
		Where("lecturer_id = ? AND day = ?", lecturerID, day).
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