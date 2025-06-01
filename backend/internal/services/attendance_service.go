package services

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"gorm.io/gorm"
)

// AttendanceService handles attendance-related business logic
type AttendanceService struct {
	attendanceRepo *repositories.AttendanceRepository
	scheduleRepo   *repositories.CourseScheduleRepository
	studentRepo    *repositories.StudentRepository
	db             *gorm.DB
}

// NewAttendanceService creates a new attendance service
func NewAttendanceService() *AttendanceService {
	return &AttendanceService{
		attendanceRepo: repositories.NewAttendanceRepository(),
		scheduleRepo:   repositories.NewCourseScheduleRepository(),
		studentRepo:    repositories.NewStudentRepository(),
		db:             database.GetDB(),
	}
}

// CreateAttendanceSession creates a new attendance session for a course schedule
func (s *AttendanceService) CreateAttendanceSession(userID uint, courseScheduleID uint, date time.Time, attendanceType models.AttendanceType, settings map[string]interface{}) (*models.AttendanceSession, error) {
	// Check if there's already an active session for this schedule and date
	existingSession, err := s.attendanceRepo.GetActiveSessionForSchedule(courseScheduleID, date)
	if err == nil && existingSession.ID != 0 {
		// Check if the existing session is created by the same user
		if existingSession.LecturerID == userID {
			return nil, errors.New("you already have an active attendance session for this schedule")
		}

		// Check if current user is a lecturer and existing session is by a teaching assistant or vice versa
		var isCurrentUserLecturer, isExistingSessionLecturer bool

		// Get the course schedule to determine lecturer ownership
		schedule, err := s.scheduleRepo.GetByID(courseScheduleID)
		if err != nil {
			return nil, err
		}

		// Current user is the assigned lecturer for this schedule
		isCurrentUserLecturer = (schedule.UserID == userID)

		// Check if the creator of the existing session is the assigned lecturer
		isExistingSessionLecturer = (schedule.UserID == existingSession.LecturerID)

		// Allow only if current user is lecturer and existing session is by TA
		if isCurrentUserLecturer && !isExistingSessionLecturer {
			// Lecturer can override TA's session - proceed with creation
		} else if !isCurrentUserLecturer && isExistingSessionLecturer {
			// TA cannot create session when lecturer already has one
			return nil, errors.New("there is already an active attendance session created by the lecturer")
		} else {
			// Both are lecturers or both are TAs - don't allow conflict
			return nil, errors.New("there is already an active attendance session for this schedule")
		}
	}

	// Get the course schedule to validate
	schedule, err := s.scheduleRepo.GetByID(courseScheduleID)
	if err != nil {
		return nil, err
	}

	// Verify that the user is either the assigned lecturer or a teaching assistant
	if schedule.UserID != uint(userID) {
		// Check if user is a teaching assistant for this course
		var isAssistant bool
		err = s.db.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM teaching_assistant_assignments 
				WHERE user_id = ? AND course_id = ?
			) as is_assistant`,
			userID, schedule.CourseID).Scan(&isAssistant).Error

		if err != nil || !isAssistant {
			return nil, errors.New("user is neither the assigned lecturer nor a teaching assistant for this course")
		}
	}

	// Create a new attendance session
	session := &models.AttendanceSession{
		CourseScheduleID: courseScheduleID,
		LecturerID:       userID,
		Date:             date,
		StartTime:        GetIndonesiaTime(),
		Type:             attendanceType,
		Status:           models.AttendanceStatusActive,
		AutoClose:        true,
		Duration:         15, // Default 15 minutes
		AllowLate:        true,
		LateThreshold:    10, // Default 10 minutes
	}

	// Set creator role based on whether user is lecturer or teaching assistant
	if schedule.UserID == userID {
		session.CreatorRole = "LECTURER"
	} else {
		session.CreatorRole = "ASSISTANT"
	}

	// Apply custom settings if provided
	if settings != nil {
		fmt.Printf("Received attendance settings: %+v\n", settings)

		if val, ok := settings["autoClose"].(bool); ok {
			session.AutoClose = val
		}

		// Handle duration - try different type assertions
		if val, ok := settings["duration"].(int); ok && val > 0 {
			session.Duration = val
			fmt.Printf("Set duration to %d (from int)\n", val)
		} else if val, ok := settings["duration"].(float64); ok && val > 0 {
			session.Duration = int(val)
			fmt.Printf("Set duration to %d (from float64 %.2f)\n", int(val), val)
		} else if val, ok := settings["duration"].(string); ok {
			if intVal, err := strconv.Atoi(val); err == nil && intVal > 0 {
				session.Duration = intVal
				fmt.Printf("Set duration to %d (from string %s)\n", intVal, val)
			}
		} else {
			fmt.Printf("Unable to parse duration from settings: %v, type: %T\n", settings["duration"], settings["duration"])
		}

		if val, ok := settings["allowLate"].(bool); ok {
			session.AllowLate = val
		}

		// Handle lateThreshold - try different type assertions
		if val, ok := settings["lateThreshold"].(int); ok && val > 0 {
			session.LateThreshold = val
			fmt.Printf("Set lateThreshold to %d (from int)\n", val)
		} else if val, ok := settings["lateThreshold"].(float64); ok && val > 0 {
			session.LateThreshold = int(val)
			fmt.Printf("Set lateThreshold to %d (from float64 %.2f)\n", int(val), val)
		} else if val, ok := settings["lateThreshold"].(string); ok {
			if intVal, err := strconv.Atoi(val); err == nil && intVal > 0 {
				session.LateThreshold = intVal
				fmt.Printf("Set lateThreshold to %d (from string %s)\n", intVal, val)
			}
		} else {
			fmt.Printf("Unable to parse lateThreshold from settings: %v, type: %T\n", settings["lateThreshold"], settings["lateThreshold"])
		}

		if val, ok := settings["notes"].(string); ok {
			session.Notes = val
		}
	}

	// For QR code type, generate a unique code
	if attendanceType == models.AttendanceTypeQRCode || attendanceType == models.AttendanceTypeBoth {
		qrData, err := generateQRCodeData()
		if err != nil {
			return nil, err
		}
		session.QRCodeData = qrData
	}

	// Save the session
	if err := s.attendanceRepo.CreateAttendanceSession(session); err != nil {
		return nil, err
	}

	// Initialize absent records for all students in the course
	if err := s.initializeStudentAttendances(session.ID, courseScheduleID); err != nil {
		// Log the error but continue
		fmt.Printf("Error initializing student attendances: %v\n", err)
	}

	return session, nil
}

// CloseAttendanceSession closes an active attendance session
func (s *AttendanceService) CloseAttendanceSession(sessionID uint, userID uint) error {
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return err
	}

	// First check if the user is the creator of this session
	if session.LecturerID != userID {
		// If not, check if they are a teaching assistant for this course
		var isAssistant bool

		// Get the course ID from the session's schedule
		var courseID uint
		if err := s.db.Model(&models.CourseSchedule{}).
			Where("id = ?", session.CourseScheduleID).
			Select("course_id").
			First(&courseID).Error; err != nil {
			return errors.New("failed to verify course assignment")
		}

		// Check if the user is a teaching assistant for this course
		err = s.db.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM teaching_assistant_assignments 
				WHERE user_id = ? AND course_id = ?
			) as is_assistant`,
			userID, courseID).Scan(&isAssistant).Error

		if err != nil || !isAssistant {
			return errors.New("user does not have permission to close this attendance session")
		}
	}

	// Verify that the session is active
	if session.Status != models.AttendanceStatusActive {
		return errors.New("attendance session is not active")
	}

	// Update session status and end time
	now := GetIndonesiaTime()
	session.Status = models.AttendanceStatusClosed
	session.EndTime = &now

	return s.attendanceRepo.UpdateAttendanceSession(session)
}

// CancelAttendanceSession cancels an active attendance session
func (s *AttendanceService) CancelAttendanceSession(sessionID uint, lecturerID uint) error {
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return err
	}

	// Verify that the lecturer owns this session
	if session.LecturerID != lecturerID {
		return errors.New("lecturer does not own this attendance session")
	}

	// Verify that the session is active
	if session.Status != models.AttendanceStatusActive {
		return errors.New("attendance session is not active")
	}

	// Update session status
	session.Status = models.AttendanceStatusCanceled

	return s.attendanceRepo.UpdateAttendanceSession(session)
}

// MarkStudentAttendance marks a student's attendance for a session
func (s *AttendanceService) MarkStudentAttendance(sessionID uint, studentID uint, status models.StudentAttendanceStatus, verificationMethod string, notes string, verifiedByID *uint) error {
	// Check if the session exists and is active
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return err
	}

	if session.Status != models.AttendanceStatusActive {
		return errors.New("attendance session is not active")
	}

	// Check if the student already has an attendance record
	attendance, err := s.attendanceRepo.GetStudentAttendance(sessionID, studentID)
	isNewRecord := err != nil

	// Determine if the student is late based on session settings
	if status == models.StudentAttendanceStatusPresent && session.AllowLate {
		elapsed := time.Since(session.StartTime)
		if int(elapsed.Minutes()) > session.LateThreshold {
			// Student is late, change status to late
			status = models.StudentAttendanceStatusLate
		}
	}

	now := GetIndonesiaTime()

	if isNewRecord {
		// Create a new attendance record
		attendance = &models.StudentAttendance{
			AttendanceSessionID: sessionID,
			StudentID:           studentID,
			Status:              status,
			CheckInTime:         &now,
			Notes:               notes,
			VerificationMethod:  verificationMethod,
			VerifiedByID:        verifiedByID,
		}
		return s.attendanceRepo.CreateStudentAttendance(attendance)
	} else {
		// Update existing record
		attendance.Status = status
		attendance.CheckInTime = &now
		attendance.Notes = notes
		attendance.VerificationMethod = verificationMethod
		attendance.VerifiedByID = verifiedByID
		return s.attendanceRepo.UpdateStudentAttendance(attendance)
	}
}

// GetActiveSessionsForUser gets all active attendance sessions for a user (lecturer or teaching assistant)
func (s *AttendanceService) GetActiveSessionsForUser(userID uint) ([]models.AttendanceSessionResponse, error) {
	// First, get sessions where the user is directly the lecturer
	sessions, err := s.attendanceRepo.ListActiveSessions(userID)
	if err != nil {
		return nil, err
	}

	// For teaching assistants, also get sessions from courses where they are assigned as TAs
	// First, get all course IDs where the user is a teaching assistant
	var courseIDs []uint
	if err := s.db.Raw(`
		SELECT course_id FROM teaching_assistant_assignments 
		WHERE user_id = ?`,
		userID).Scan(&courseIDs).Error; err != nil {
		// Just log the error but continue with direct sessions
		fmt.Printf("Error fetching TA assignments for user %d: %v\n", userID, err)
	} else if len(courseIDs) > 0 {
		// Get schedules for these courses
		var scheduleIDs []uint
		if err := s.db.Model(&models.CourseSchedule{}).
			Where("course_id IN (?)", courseIDs).
			Pluck("id", &scheduleIDs).Error; err != nil {
			fmt.Printf("Error fetching course schedules for TA %d: %v\n", userID, err)
		} else if len(scheduleIDs) > 0 {
			// Get active sessions for these schedules
			taSessions, err := s.attendanceRepo.ListActiveSessionsBySchedules(scheduleIDs)
			if err == nil {
				// Add these sessions to the list, avoiding duplicates
				sessionMap := make(map[uint]models.AttendanceSession)
				for _, s := range sessions {
					sessionMap[s.ID] = s
				}

				for _, s := range taSessions {
					if _, exists := sessionMap[s.ID]; !exists {
						sessionMap[s.ID] = s
						sessions = append(sessions, s)
					}
				}
			}
		}
	}

	// Transform to response objects
	var responses []models.AttendanceSessionResponse
	for _, session := range sessions {
		response, err := s.mapSessionToResponse(&session)
		if err != nil {
			continue
		}
		responses = append(responses, *response)
	}

	return responses, nil
}

// GetActiveSessionsByCourse gets all active attendance sessions for a specific course
func (s *AttendanceService) GetActiveSessionsByCourse(courseID uint) ([]models.AttendanceSessionResponse, error) {
	// Get all course schedules for this course
	schedules, err := s.scheduleRepo.GetByCourse(courseID)
	if err != nil {
		return nil, err
	}

	var allResponses []models.AttendanceSessionResponse

	// For each schedule, get active attendance sessions
	for _, schedule := range schedules {
		sessions, err := s.attendanceRepo.GetActiveSessionsForSchedule(schedule.ID)
		if err != nil {
			fmt.Printf("Error getting active sessions for schedule %d: %v\n", schedule.ID, err)
			continue
		}

		// Transform to response objects
		for _, session := range sessions {
			response, err := s.mapSessionToResponse(&session)
			if err != nil {
				continue
			}
			allResponses = append(allResponses, *response)
		}
	}

	return allResponses, nil
}

// GetSessionsByDateRange gets attendance sessions for a user within a date range
func (s *AttendanceService) GetSessionsByDateRange(userID uint, startDate, endDate time.Time) ([]models.AttendanceSessionResponse, error) {
	// First, get sessions where the user is directly the lecturer
	sessions, err := s.attendanceRepo.ListSessionsByDateRange(userID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	// For teaching assistants, also get sessions from courses where they are assigned as TAs
	// First, get all course IDs where the user is a teaching assistant
	var courseIDs []uint
	if err := s.db.Raw(`
		SELECT course_id FROM teaching_assistant_assignments 
		WHERE user_id = ?`,
		userID).Scan(&courseIDs).Error; err != nil {
		// Just log the error but continue with direct sessions
		fmt.Printf("Error fetching TA assignments for user %d: %v\n", userID, err)
	} else if len(courseIDs) > 0 {
		// Get schedules for these courses
		var scheduleIDs []uint
		if err := s.db.Model(&models.CourseSchedule{}).
			Where("course_id IN (?)", courseIDs).
			Pluck("id", &scheduleIDs).Error; err != nil {
			fmt.Printf("Error fetching course schedules for TA %d: %v\n", userID, err)
		} else if len(scheduleIDs) > 0 {
			// Get sessions for these schedules in the given date range
			var taSessions []models.AttendanceSession
			err := s.db.Preload("CourseSchedule").
				Preload("CourseSchedule.Course").
				Preload("CourseSchedule.Room").
				Where("course_schedule_id IN (?) AND date BETWEEN ? AND ?",
					scheduleIDs, startDate.Format("2006-01-02"), endDate.Format("2006-01-02")).
				Find(&taSessions).Error

			if err == nil {
				// Add these sessions to the list, avoiding duplicates
				sessionMap := make(map[uint]models.AttendanceSession)
				for _, s := range sessions {
					sessionMap[s.ID] = s
				}

				for _, s := range taSessions {
					if _, exists := sessionMap[s.ID]; !exists {
						sessionMap[s.ID] = s
						sessions = append(sessions, s)
					}
				}
			}
		}
	}

	// Transform to response objects
	var responses []models.AttendanceSessionResponse
	for _, session := range sessions {
		response, err := s.mapSessionToResponse(&session)
		if err != nil {
			continue
		}
		responses = append(responses, *response)
	}

	return responses, nil
}

// GetSessionDetails gets detailed information for an attendance session
func (s *AttendanceService) GetSessionDetails(sessionID uint, userID uint) (*models.AttendanceSessionResponse, error) {
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return nil, err
	}

	// Check if user is the assigned lecturer for this session
	if session.LecturerID != userID {
		// If not, check if they are a teaching assistant for this course
		var isAssistant bool

		// Get the course ID from the session's schedule
		var courseID uint
		if err := s.db.Model(&models.CourseSchedule{}).
			Where("id = ?", session.CourseScheduleID).
			Select("course_id").
			First(&courseID).Error; err != nil {
			return nil, errors.New("failed to verify course assignment")
		}

		// Check if the user is a teaching assistant for this course
		err = s.db.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM teaching_assistant_assignments 
				WHERE user_id = ? AND course_id = ?
			) as is_assistant`,
			userID, courseID).Scan(&isAssistant).Error

		if err != nil || !isAssistant {
			return nil, errors.New("user does not have access to this session")
		}
	}

	return s.mapSessionToResponse(session)
}

// GetStudentAttendances gets student attendance records for a session
func (s *AttendanceService) GetStudentAttendances(sessionID uint, userID uint) ([]models.StudentAttendanceResponse, error) {
	// Verify the session exists
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return nil, err
	}

	// Check if user is the assigned lecturer for this session
	if session.LecturerID != userID {
		// If not, check if they are a teaching assistant for this course
		var isAssistant bool

		// Get the course ID from the session's schedule
		var courseID uint
		if err := s.db.Model(&models.CourseSchedule{}).
			Where("id = ?", session.CourseScheduleID).
			Select("course_id").
			First(&courseID).Error; err != nil {
			return nil, errors.New("failed to verify course assignment")
		}

		// Check if the user is a teaching assistant for this course
		err = s.db.Raw(`
			SELECT EXISTS (
				SELECT 1 FROM teaching_assistant_assignments 
				WHERE user_id = ? AND course_id = ?
			) as is_assistant`,
			userID, courseID).Scan(&isAssistant).Error

		if err != nil || !isAssistant {
			return nil, errors.New("user does not have access to this session")
		}
	}

	// Get all student attendances for this session
	attendances, err := s.attendanceRepo.ListStudentAttendances(sessionID)
	if err != nil {
		return nil, err
	}

	// Transform to response objects
	var responses []models.StudentAttendanceResponse
	for _, attendance := range attendances {
		checkInTime := ""
		if attendance.CheckInTime != nil {
			// Convert to Indonesia time first
			indonesiaTime := attendance.CheckInTime.In(getIndonesiaLocation())
			checkInTime = indonesiaTime.Format("15:04:05")
		}

		// Get external user ID either from notes or from student record
		externalUserID := uint(0)
		if strings.Contains(attendance.Notes, "EXTID:") {
			externalUserID = parseExternalUserIDFromNotes(attendance.Notes)
		} else if attendance.Student.UserID > 0 {
			externalUserID = uint(attendance.Student.UserID)
		}

		// Add external ID to student name if available
		studentName := attendance.Student.FullName

		responses = append(responses, models.StudentAttendanceResponse{
			ID:                  attendance.ID,
			AttendanceSessionID: attendance.AttendanceSessionID,
			StudentID:           externalUserID, // Use external user ID if available
			StudentName:         studentName,
			StudentNIM:          attendance.Student.NIM,
			Status:              string(attendance.Status),
			CheckInTime:         checkInTime,
			Notes:               attendance.Notes,
			VerificationMethod:  attendance.VerificationMethod,
		})
	}

	return responses, nil
}

// GetAttendanceStatistics gets attendance statistics for a course
func (s *AttendanceService) GetAttendanceStatistics(courseScheduleID uint, lecturerID uint) (*models.AttendanceStatistics, error) {
	// Verify the course schedule exists and lecturer has access
	schedule, err := s.scheduleRepo.GetByID(courseScheduleID)
	if err != nil {
		return nil, err
	}

	if schedule.UserID != uint(lecturerID) {
		return nil, errors.New("lecturer does not have access to this course schedule")
	}

	return s.attendanceRepo.GetAttendanceStats(courseScheduleID)
}

// GetActiveSessionsBySchedules gets all active attendance sessions for specific schedules
func (s *AttendanceService) GetActiveSessionsBySchedules(scheduleIDs []uint) ([]models.AttendanceSession, error) {
	if len(scheduleIDs) == 0 {
		return []models.AttendanceSession{}, nil
	}

	// Use the repository to get active sessions for the provided schedules
	sessions, err := s.attendanceRepo.ListActiveSessionsBySchedules(scheduleIDs)
	if err != nil {
		return nil, err
	}

	return sessions, nil
}

// MarkStudentAttendanceViaQR marks a student's attendance for a session using QR code
func (s *AttendanceService) MarkStudentAttendanceViaQR(sessionID uint, userID uint, status models.StudentAttendanceStatus, qrData string) error {
	// Get the session by ID
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return errors.New("attendance session not found")
	}

	// Check if the session is active
	if session.Status != models.AttendanceStatusActive {
		return errors.New("attendance session is not active")
	}

	// Check that this is a QR code attendance or combined method
	if session.Type != models.AttendanceTypeQRCode && session.Type != models.AttendanceTypeBoth {
		return errors.New("this attendance session does not support QR code verification")
	}

	// Check if the student is enrolled in this course
	var student *models.Student
	result := s.db.Where("user_id = ?", userID).First(&student)
	if result.Error != nil {
		return errors.New("student record not found")
	}

	// Get the course schedule to find the student group
	var schedule models.CourseSchedule
	if err := s.db.First(&schedule, session.CourseScheduleID).Error; err != nil {
		return errors.New("course schedule not found")
	}

	// Check if the student is in the course's student group
	var isEnrolled bool
	err = s.db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM student_to_groups
			WHERE student_group_id = ? AND student_id = ?
		) as is_enrolled`,
		schedule.StudentGroupID, student.ID).Scan(&isEnrolled).Error

	if err != nil {
		return errors.New("error checking enrollment: " + err.Error())
	}

	if !isEnrolled {
		return errors.New("student is not enrolled in this course")
	}

	// If QR data was provided, verify it
	if qrData != "" && qrData != fmt.Sprintf("delpresence:attendance:%d", sessionID) && qrData != session.QRCodeData {
		fmt.Printf("QR Code verification failed. Provided: %s, Expected: %s or %s\n",
			qrData, fmt.Sprintf("delpresence:attendance:%d", sessionID), session.QRCodeData)
		return errors.New("invalid QR code data")
	}

	// Calculate if the student is late based on session settings
	now := GetIndonesiaTime()
	checkInTime := now

	// Check if the student is late based on session settings
	if session.AllowLate && time.Since(session.StartTime).Minutes() > float64(session.LateThreshold) {
		status = models.StudentAttendanceStatusLate
	}

	// Create notes that include external user ID information
	notes := fmt.Sprintf("External UserID: %d | NIM: %s", student.UserID, student.NIM)

	// Find existing attendance record
	var attendanceExists bool
	err = s.db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM student_attendances
			WHERE attendance_session_id = ? AND student_id = ?
		) as attendance_exists
	`, sessionID, student.ID).Scan(&attendanceExists).Error

	if err != nil {
		return errors.New("error checking existing attendance: " + err.Error())
	}

	if attendanceExists {
		// Update existing record
		result = s.db.Exec(`
			UPDATE student_attendances 
			SET status = ?, verification_method = ?, check_in_time = ?, notes = ?
			WHERE attendance_session_id = ? AND student_id = ?`,
			status, "QR_CODE", checkInTime, notes, sessionID, student.ID)

		if result.Error != nil {
			return errors.New("failed to update attendance: " + result.Error.Error())
		}
	} else {
		// Insert new record
		attendance := models.StudentAttendance{
			AttendanceSessionID: sessionID,
			StudentID:           student.ID,
			Status:              status,
			CheckInTime:         &checkInTime,
			VerificationMethod:  "QR_CODE",
			Notes:               notes,
		}

		if err := s.db.Create(&attendance).Error; err != nil {
			return errors.New("failed to record attendance: " + err.Error())
		}
	}

	return nil
}

// GetIndonesiaTime returns current time in Indonesia Western Time (WIB/UTC+7)
func GetIndonesiaTime() time.Time {
	return time.Now().In(getIndonesiaLocation())
}

// MarkStudentAttendanceByExternalID marks a student's attendance using their external user ID
func (s *AttendanceService) MarkStudentAttendanceByExternalID(sessionID uint, externalUserID uint, status models.StudentAttendanceStatus, qrData string) error {
	// Get the session by ID
	session, err := s.attendanceRepo.GetAttendanceSessionByID(sessionID)
	if err != nil {
		return errors.New("attendance session not found")
	}

	// Check if the session is active
	if session.Status != models.AttendanceStatusActive {
		return errors.New("attendance session is not active")
	}

	// Check that this is a QR code attendance or combined method
	if session.Type != models.AttendanceTypeQRCode && session.Type != models.AttendanceTypeBoth {
		return errors.New("this attendance session does not support QR code verification")
	}

	// Check if the student exists with this external user ID
	var student *models.Student
	result := s.db.Where("user_id = ?", externalUserID).First(&student)
	if result.Error != nil {
		return errors.New("student record not found")
	}

	// Get the course schedule to find the student group
	var schedule models.CourseSchedule
	if err := s.db.First(&schedule, session.CourseScheduleID).Error; err != nil {
		return errors.New("course schedule not found")
	}

	// Check if the student is in the course's student group
	var isEnrolled bool
	err = s.db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM student_to_groups
			WHERE student_group_id = ? AND student_id = ?
		) as is_enrolled`,
		schedule.StudentGroupID, student.ID).Scan(&isEnrolled).Error

	if err != nil {
		return errors.New("error checking enrollment: " + err.Error())
	}

	if !isEnrolled {
		return errors.New("student is not enrolled in this course")
	}

	// If QR data was provided, verify it
	if qrData != "" && qrData != fmt.Sprintf("delpresence:attendance:%d", sessionID) && qrData != session.QRCodeData {
		fmt.Printf("QR Code verification failed. Provided: %s, Expected: %s or %s\n",
			qrData, fmt.Sprintf("delpresence:attendance:%d", sessionID), session.QRCodeData)
		return errors.New("invalid QR code data")
	}

	// Calculate if the student is late based on session settings
	now := GetIndonesiaTime()
	checkInTime := now

	// Check if the student is late based on session settings
	if session.AllowLate && time.Since(session.StartTime).Minutes() > float64(session.LateThreshold) {
		status = models.StudentAttendanceStatusLate
	}

	// Keep notes empty - as requested
	notes := ""

	// Find existing attendance record by external user ID
	var attendanceExists bool
	err = s.db.Raw(`
		SELECT EXISTS (
			SELECT 1 FROM student_attendances sa
			JOIN students s ON sa.student_id = s.id
			WHERE sa.attendance_session_id = ? AND s.user_id = ?
		) as attendance_exists
	`, sessionID, externalUserID).Scan(&attendanceExists).Error

	if err != nil {
		return errors.New("error checking existing attendance: " + err.Error())
	}

	if attendanceExists {
		// Update existing record using SQL that links by external user ID
		result = s.db.Exec(`
			UPDATE student_attendances 
			SET status = ?, verification_method = ?, check_in_time = ?, notes = ?
			WHERE attendance_session_id = ? 
			AND student_id IN (
				SELECT id FROM students WHERE user_id = ?
			)`,
			status, "QR_CODE", checkInTime, notes, sessionID, externalUserID)

		if result.Error != nil {
			return errors.New("failed to update attendance: " + result.Error.Error())
		}
	} else {
		// For new records, log only the essential information
		fmt.Printf("Recording attendance for session %d, student ID %d\n", sessionID, student.ID)

		// Insert new record
		attendance := models.StudentAttendance{
			AttendanceSessionID: sessionID,
			StudentID:           student.ID,
			Status:              status,
			CheckInTime:         &checkInTime,
			VerificationMethod:  "QR_CODE",
			Notes:               notes,
		}

		if err := s.db.Create(&attendance).Error; err != nil {
			return errors.New("failed to record attendance: " + err.Error())
		}
	}

	return nil
}

// GetStudentAttendancesByExternalID gets attendance records for a student by external user ID
func (s *AttendanceService) GetStudentAttendancesByExternalID(externalUserID uint) ([]models.StudentAttendanceResponse, error) {
	// Find the student ID associated with the user ID
	var studentID uint
	err := s.db.Raw(`
		SELECT id FROM students WHERE user_id = ?
	`, externalUserID).Scan(&studentID).Error

	if err != nil {
		return nil, fmt.Errorf("failed to find student with user ID %d: %v", externalUserID, err)
	}

	if studentID == 0 {
		return nil, fmt.Errorf("no student found with user ID %d", externalUserID)
	}

	// Get all student attendances
	var attendances []models.StudentAttendance
	err = s.db.Preload("AttendanceSession").
		Preload("AttendanceSession.CourseSchedule").
		Preload("AttendanceSession.CourseSchedule.Course").
		Preload("AttendanceSession.CourseSchedule.Room").
		Preload("Student").
		Where("student_id = ?", studentID).
		Find(&attendances).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch attendances: %v", err)
	}

	var responses []models.StudentAttendanceResponse
	for _, attendance := range attendances {
		checkInTime := ""
		if attendance.CheckInTime != nil {
			// Convert to Indonesia time if needed
			indonesiaTime := attendance.CheckInTime.In(getIndonesiaLocation())
			checkInTime = indonesiaTime.Format("15:04")
		}

		responses = append(responses, models.StudentAttendanceResponse{
			ID:                  attendance.ID,
			AttendanceSessionID: attendance.AttendanceSessionID,
			StudentID:           attendance.StudentID,
			StudentName:         attendance.Student.FullName,
			StudentNIM:          attendance.Student.NIM,
			Status:              string(attendance.Status),
			CheckInTime:         checkInTime,
			Notes:               attendance.Notes,
			VerificationMethod:  attendance.VerificationMethod,
		})
	}

	return responses, nil
}

// GetStudentAttendanceHistory gets detailed attendance history for a student with course info
func (s *AttendanceService) GetStudentAttendanceHistory(externalUserID uint) ([]models.StudentAttendanceHistoryResponse, error) {
	// Find the student ID associated with the user ID
	var studentID uint
	err := s.db.Raw(`
		SELECT id FROM students WHERE user_id = ?
	`, externalUserID).Scan(&studentID).Error

	if err != nil {
		return nil, fmt.Errorf("failed to find student with user ID %d: %v", externalUserID, err)
	}

	if studentID == 0 {
		return nil, fmt.Errorf("no student found with user ID %d", externalUserID)
	}

	// Get all student attendances with necessary relations
	var attendances []models.StudentAttendance
	err = s.db.Preload("AttendanceSession").
		Preload("AttendanceSession.CourseSchedule").
		Preload("AttendanceSession.CourseSchedule.Course").
		Preload("AttendanceSession.CourseSchedule.Room").
		Preload("AttendanceSession.CourseSchedule.Room.Building").
		Preload("Student").
		Where("student_id = ?", studentID).
		Order("attendance_session_id DESC"). // Latest sessions first
		Find(&attendances).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch attendance history: %v", err)
	}

	var responses []models.StudentAttendanceHistoryResponse
	for _, attendance := range attendances {
		if attendance.AttendanceSession.ID == 0 ||
			attendance.AttendanceSession.CourseSchedule.ID == 0 ||
			attendance.AttendanceSession.CourseSchedule.Course.ID == 0 {
			// Skip records with incomplete relations
			continue
		}

		checkInTime := ""
		if attendance.CheckInTime != nil {
			// Convert to Indonesia time if needed
			indonesiaTime := attendance.CheckInTime.In(getIndonesiaLocation())
			checkInTime = indonesiaTime.Format("15:04")
		}

		roomName := attendance.AttendanceSession.CourseSchedule.Room.Name
		buildingName := ""
		if attendance.AttendanceSession.CourseSchedule.Room.Building.ID != 0 {
			buildingName = attendance.AttendanceSession.CourseSchedule.Room.Building.Name
		}

		fullRoomName := roomName
		if buildingName != "" {
			fullRoomName = fmt.Sprintf("%s - %s", buildingName, roomName)
		}

		responses = append(responses, models.StudentAttendanceHistoryResponse{
			ID:                 attendance.ID,
			Date:               attendance.AttendanceSession.Date.Format("2006-01-02"),
			CourseCode:         attendance.AttendanceSession.CourseSchedule.Course.Code,
			CourseName:         attendance.AttendanceSession.CourseSchedule.Course.Name,
			RoomName:           fullRoomName,
			CheckInTime:        checkInTime,
			Status:             string(attendance.Status),
			VerificationMethod: attendance.VerificationMethod,
		})
	}

	return responses, nil
}

// Helper functions

// initializeStudentAttendances creates initial "absent" records for all students
func (s *AttendanceService) initializeStudentAttendances(sessionID uint, courseScheduleID uint) error {
	// For simplicity, we'll use a placeholder implementation
	// In a real system, you'd query students enrolled in the course schedule

	// Get the course schedule to find the student group ID
	schedule, err := s.scheduleRepo.GetByID(courseScheduleID)
	if err != nil {
		return err
	}

	// If there's no student group, return early
	if schedule.StudentGroupID == 0 {
		return nil
	}

	// Find all students in this group using the student_to_groups table
	var students []models.Student
	err = s.db.Table("students").
		Joins("JOIN student_to_groups ON students.id = student_to_groups.student_id").
		Where("student_to_groups.student_group_id = ?", schedule.StudentGroupID).
		Find(&students).Error

	if err != nil {
		return err
	}

	for _, student := range students {
		attendance := &models.StudentAttendance{
			AttendanceSessionID: sessionID,
			StudentID:           student.ID,
			Status:              models.StudentAttendanceStatusAbsent,
		}
		if err := s.attendanceRepo.CreateStudentAttendance(attendance); err != nil {
			// Log the error but continue with other students
			fmt.Printf("Error initializing attendance for student %d: %v\n", student.ID, err)
		}
	}

	return nil
}

// mapSessionToResponse maps an AttendanceSession to its response format
func (s *AttendanceService) mapSessionToResponse(session *models.AttendanceSession) (*models.AttendanceSessionResponse, error) {
	if session == nil || session.CourseSchedule.Course.ID == 0 || session.CourseSchedule.Room.ID == 0 {
		return nil, errors.New("invalid session data")
	}

	// Get attendance counts
	attendances, err := s.attendanceRepo.ListStudentAttendances(session.ID)
	if err != nil {
		return nil, err
	}

	var attendedCount, lateCount, absentCount, excusedCount int
	for _, a := range attendances {
		switch a.Status {
		case models.StudentAttendanceStatusPresent:
			attendedCount++
		case models.StudentAttendanceStatusLate:
			lateCount++
		case models.StudentAttendanceStatusAbsent:
			absentCount++
		case models.StudentAttendanceStatusExcused:
			excusedCount++
		}
	}

	endTime := ""
	if session.EndTime != nil {
		endTime = session.EndTime.Format("15:04")
	}

	// Create QR code URL if applicable
	qrCodeURL := ""
	if (session.Type == models.AttendanceTypeQRCode || session.Type == models.AttendanceTypeBoth) && session.QRCodeData != "" {
		qrCodeURL = fmt.Sprintf("/api/attendance/qrcode/%d", session.ID)
	}

	// Calculate total students directly from database if CourseSchedule.Enrolled is 0
	totalStudents := session.CourseSchedule.Enrolled
	if totalStudents == 0 && session.CourseSchedule.StudentGroupID > 0 {
		var count int64
		s.db.Model(&models.StudentToGroup{}).
			Where("student_group_id = ?", session.CourseSchedule.StudentGroupID).
			Count(&count)
		totalStudents = int(count)
	}

	return &models.AttendanceSessionResponse{
		ID:                session.ID,
		CourseScheduleID:  session.CourseScheduleID,
		CourseCode:        session.CourseSchedule.Course.Code,
		CourseName:        session.CourseSchedule.Course.Name,
		Room:              session.CourseSchedule.Room.Name,
		Date:              session.Date.Format("2006-01-02"),
		StartTime:         session.StartTime.Format("15:04"),
		EndTime:           endTime,
		ScheduleStartTime: session.CourseSchedule.StartTime,
		ScheduleEndTime:   session.CourseSchedule.EndTime,
		Type:              string(session.Type),
		Status:            string(session.Status),
		CreatorRole:       session.CreatorRole,
		AutoClose:         session.AutoClose,
		Duration:          session.Duration,
		AllowLate:         session.AllowLate,
		LateThreshold:     session.LateThreshold,
		Notes:             session.Notes,
		QRCodeURL:         qrCodeURL,
		TotalStudents:     totalStudents,
		AttendedCount:     attendedCount,
		LateCount:         lateCount,
		AbsentCount:       absentCount,
		ExcusedCount:      excusedCount,
		CreatedAt:         session.CreatedAt,
	}, nil
}

// generateQRCodeData generates a random string for QR code data
func generateQRCodeData() (string, error) {
	b := make([]byte, 32)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(b), nil
}

// Helper function to parse external user ID from notes field
func parseExternalUserIDFromNotes(notes string) uint {
	// Look for the EXTID: pattern in the notes
	if strings.Contains(notes, "EXTID:") {
		parts := strings.Split(notes, "|")
		for _, part := range parts {
			if strings.HasPrefix(part, "EXTID:") {
				idStr := strings.TrimPrefix(part, "EXTID:")
				if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
					return uint(id)
				}
			}
		}
	}
	return 0
}

// getIndonesiaLocation returns the location for Indonesia
func getIndonesiaLocation() *time.Location {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		// Fallback: Manually create WIB (UTC+7) if timezone data isn't available
		location = time.FixedZone("WIB", 7*60*60)
	}
	return location
}
