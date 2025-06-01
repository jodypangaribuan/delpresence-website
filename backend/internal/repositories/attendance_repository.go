package repositories

import (
	"fmt"
	"time"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// AttendanceRepository handles database operations for attendance
type AttendanceRepository struct {
	db *gorm.DB
}

// NewAttendanceRepository creates a new attendance repository
func NewAttendanceRepository() *AttendanceRepository {
	return &AttendanceRepository{
		db: database.GetDB(),
	}
}

// CreateAttendanceSession creates a new attendance session
func (r *AttendanceRepository) CreateAttendanceSession(session *models.AttendanceSession) error {
	return r.db.Create(session).Error
}

// UpdateAttendanceSession updates an attendance session
func (r *AttendanceRepository) UpdateAttendanceSession(session *models.AttendanceSession) error {
	return r.db.Save(session).Error
}

// GetAttendanceSessionByID retrieves an attendance session by ID
func (r *AttendanceRepository) GetAttendanceSessionByID(id uint) (*models.AttendanceSession, error) {
	var session models.AttendanceSession
	err := r.db.Preload("CourseSchedule").Preload("CourseSchedule.Course").Preload("CourseSchedule.Room").
		Where("id = ?", id).First(&session).Error
	return &session, err
}

// ListActiveSessions lists all active attendance sessions for a lecturer
func (r *AttendanceRepository) ListActiveSessions(lecturerID uint) ([]models.AttendanceSession, error) {
	var sessions []models.AttendanceSession
	err := r.db.Preload("CourseSchedule").Preload("CourseSchedule.Course").Preload("CourseSchedule.Room").
		Where("lecturer_id = ? AND status = ?", lecturerID, models.AttendanceStatusActive).
		Find(&sessions).Error
	return sessions, err
}

// ListSessionsByDateRange lists attendance sessions for a lecturer within a date range
func (r *AttendanceRepository) ListSessionsByDateRange(lecturerID uint, startDate, endDate time.Time) ([]models.AttendanceSession, error) {
	var sessions []models.AttendanceSession
	err := r.db.Preload("CourseSchedule").Preload("CourseSchedule.Course").Preload("CourseSchedule.Room").
		Where("lecturer_id = ? AND date BETWEEN ? AND ?", lecturerID, startDate, endDate).
		Order("date DESC, start_time DESC").
		Find(&sessions).Error
	return sessions, err
}

// ListSessionsByCourseSchedule lists attendance sessions for a specific course schedule
func (r *AttendanceRepository) ListSessionsByCourseSchedule(courseScheduleID uint) ([]models.AttendanceSession, error) {
	var sessions []models.AttendanceSession
	err := r.db.Preload("CourseSchedule").Preload("CourseSchedule.Course").Preload("CourseSchedule.Room").
		Where("course_schedule_id = ?", courseScheduleID).
		Order("date DESC, start_time DESC").
		Find(&sessions).Error
	return sessions, err
}

// GetActiveSessionForSchedule gets the active attendance session for a course schedule if it exists
func (r *AttendanceRepository) GetActiveSessionForSchedule(courseScheduleID uint, date time.Time) (*models.AttendanceSession, error) {
	var session models.AttendanceSession
	err := r.db.Preload("CourseSchedule").Preload("CourseSchedule.Course").Preload("CourseSchedule.Room").
		Where("course_schedule_id = ? AND date = ? AND status = ?", courseScheduleID, date, models.AttendanceStatusActive).
		First(&session).Error
	return &session, err
}

// GetActiveSessionsForSchedule gets all active attendance sessions for a schedule
func (r *AttendanceRepository) GetActiveSessionsForSchedule(courseScheduleID uint) ([]models.AttendanceSession, error) {
	var sessions []models.AttendanceSession
	err := r.db.Preload("CourseSchedule").Preload("CourseSchedule.Course").Preload("CourseSchedule.Room").
		Where("course_schedule_id = ? AND status = ?", courseScheduleID, models.AttendanceStatusActive).
		Find(&sessions).Error
	return sessions, err
}

// CreateStudentAttendance records a student's attendance
func (r *AttendanceRepository) CreateStudentAttendance(attendance *models.StudentAttendance) error {
	return r.db.Create(attendance).Error
}

// UpdateStudentAttendance updates a student's attendance record
func (r *AttendanceRepository) UpdateStudentAttendance(attendance *models.StudentAttendance) error {
	return r.db.Save(attendance).Error
}

// GetStudentAttendance gets a student's attendance record for a session
func (r *AttendanceRepository) GetStudentAttendance(sessionID, studentID uint) (*models.StudentAttendance, error) {
	var attendance models.StudentAttendance
	err := r.db.Where("attendance_session_id = ? AND student_id = ?", sessionID, studentID).
		First(&attendance).Error
	return &attendance, err
}

// ListStudentAttendances lists all student attendance records for a session
func (r *AttendanceRepository) ListStudentAttendances(sessionID uint) ([]models.StudentAttendance, error) {
	var attendances []models.StudentAttendance
	err := r.db.Preload("Student").
		Where("attendance_session_id = ?", sessionID).
		Find(&attendances).Error
	return attendances, err
}

// ListStudentAttendancesByStatus lists all student attendance records for a session filtered by status
func (r *AttendanceRepository) ListStudentAttendancesByStatus(sessionID uint, status models.StudentAttendanceStatus) ([]models.StudentAttendance, error) {
	var attendances []models.StudentAttendance
	err := r.db.Preload("Student").
		Where("attendance_session_id = ? AND status = ?", sessionID, status).
		Find(&attendances).Error
	return attendances, err
}

// GetAttendanceStats gets attendance statistics for a course schedule
func (r *AttendanceRepository) GetAttendanceStats(courseScheduleID uint) (*models.AttendanceStatistics, error) {
	var stats models.AttendanceStatistics

	// Get total sessions
	var totalSessions int64
	if err := r.db.Model(&models.AttendanceSession{}).
		Where("course_schedule_id = ?", courseScheduleID).
		Count(&totalSessions).Error; err != nil {
		return nil, err
	}
	stats.TotalSessions = int(totalSessions)

	// Get total students for this course schedule
	var courseSchedule models.CourseSchedule
	if err := r.db.Where("id = ?", courseScheduleID).First(&courseSchedule).Error; err != nil {
		return nil, err
	}
	stats.TotalStudents = courseSchedule.Enrolled

	// Count attendance by status
	sessions, err := r.ListSessionsByCourseSchedule(courseScheduleID)
	if err != nil {
		return nil, err
	}

	for _, session := range sessions {
		var presentCount int64
		err := r.db.Model(&models.StudentAttendance{}).
			Where("attendance_session_id = ? AND status = ?", session.ID, models.StudentAttendanceStatusPresent).
			Count(&presentCount).Error
		if err != nil {
			return nil, err
		}
		stats.TotalAttendance += int(presentCount)

		var lateCount int64
		err = r.db.Model(&models.StudentAttendance{}).
			Where("attendance_session_id = ? AND status = ?", session.ID, models.StudentAttendanceStatusLate).
			Count(&lateCount).Error
		if err != nil {
			return nil, err
		}
		stats.TotalLate += int(lateCount)

		var absentCount int64
		err = r.db.Model(&models.StudentAttendance{}).
			Where("attendance_session_id = ? AND status = ?", session.ID, models.StudentAttendanceStatusAbsent).
			Count(&absentCount).Error
		if err != nil {
			return nil, err
		}
		stats.TotalAbsent += int(absentCount)

		var excusedCount int64
		err = r.db.Model(&models.StudentAttendance{}).
			Where("attendance_session_id = ? AND status = ?", session.ID, models.StudentAttendanceStatusExcused).
			Count(&excusedCount).Error
		if err != nil {
			return nil, err
		}
		stats.TotalExcused += int(excusedCount)
	}

	// Calculate average attendance percentage
	if stats.TotalSessions > 0 && stats.TotalStudents > 0 {
		totalPossibleAttendances := stats.TotalSessions * stats.TotalStudents
		totalPresent := stats.TotalAttendance + stats.TotalLate
		stats.AverageAttendance = (totalPresent * 100) / totalPossibleAttendances
	}

	return &stats, nil
}

// ListActiveSessionsBySchedules gets all active attendance sessions for given course schedule IDs
func (r *AttendanceRepository) ListActiveSessionsBySchedules(scheduleIDs []uint) ([]models.AttendanceSession, error) {
	// Handle empty schedule IDs
	if len(scheduleIDs) == 0 {
		fmt.Printf("No schedule IDs provided for active sessions query\n")
		return []models.AttendanceSession{}, nil
	}

	fmt.Printf("Querying active sessions for schedule IDs: %v\n", scheduleIDs)

	var sessions []models.AttendanceSession
	query := r.db.Preload("CourseSchedule").
		Preload("CourseSchedule.Course").
		Preload("CourseSchedule.Room").
		Preload("CourseSchedule.Room.Building").
		Where("course_schedule_id IN (?) AND status = ?", scheduleIDs, models.AttendanceStatusActive)

	// Execute the query
	err := query.Find(&sessions).Error

	// Log the result
	if err != nil {
		fmt.Printf("Error querying active sessions: %v\n", err)
		return []models.AttendanceSession{}, err
	}

	fmt.Printf("Found %d active sessions for schedule IDs: %v\n", len(sessions), scheduleIDs)

	// Log details of found sessions for debugging
	for i, session := range sessions {
		fmt.Printf("Session %d: ID=%d, ScheduleID=%d, CourseID=%d, Type=%s, Status=%s\n",
			i+1, session.ID, session.CourseScheduleID,
			session.CourseSchedule.CourseID, session.Type, session.Status)
	}

	return sessions, nil
}

// UpdateAttendanceSessionCounts increments the relevant counters on an attendance session.
// It uses a transaction to ensure atomicity for count updates.
func (r *AttendanceRepository) UpdateAttendanceSessionCounts(sessionID uint, isLate bool, incrementValue int) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var session models.AttendanceSession
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&session, sessionID).Error; err != nil {
			return err // Session not found or other error
		}

		if isLate {
			session.LateCount += incrementValue
		} else {
			session.AttendedCount += incrementValue
		}

		// Optionally, you might want to re-calculate/update AbsentCount if TotalStudents is reliable here
		// For example: session.AbsentCount = session.TotalStudents - (session.AttendedCount + session.LateCount + session.ExcusedCount)
		// However, TotalStudents in AttendanceSession might not always be up-to-date or could be from the schedule.
		// It's generally safer to manage AbsentCount separately or calculate it on-the-fly for display.

		return tx.Save(&session).Error
	})
}

// GetStudentByID retrieves a student by their ID (needed for student details)
// This method should ideally be in a StudentRepository, but placing a simplified version here for now
// if one doesn't exist.
func (r *AttendanceRepository) GetStudentByID(studentID uint) (*models.Student, error) {
	var student models.Student
	// Ensure you preload necessary associations if Student model has them (e.g., User)
	if err := r.db.Preload("User").First(&student, studentID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // Or a specific error like ErrStudentNotFound
		}
		return nil, err
	}
	return &student, nil
}
