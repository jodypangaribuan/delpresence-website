package repositories

import (
	"fmt"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// LecturerAssignmentRepository provides methods to interact with lecturer assignments in the database
type LecturerAssignmentRepository struct {
	db *gorm.DB
}

// NewLecturerAssignmentRepository creates a new lecturer assignment repository
func NewLecturerAssignmentRepository() *LecturerAssignmentRepository {
	return &LecturerAssignmentRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all lecturer assignments
func (r *LecturerAssignmentRepository) GetAll(academicYearID uint) ([]models.LecturerAssignment, error) {
	var assignments []models.LecturerAssignment
	query := r.db.Preload("Course").Preload("AcademicYear")
	
	if academicYearID > 0 {
		query = query.Where("academic_year_id = ?", academicYearID)
	}
	
	err := query.Find(&assignments).Error
	if err != nil {
		return nil, err
	}
	
	// Manually load the lecturer for each assignment
	for i := range assignments {
		var lecturer models.Lecturer
		
		// First try getting lecturer by user_id
		if err := r.db.Where("user_id = ?", assignments[i].UserID).First(&lecturer).Error; err == nil {
			assignments[i].Lecturer = &lecturer
		} else {
			// If not found by user_id, try finding by direct ID match
			if err := r.db.Where("id = ?", assignments[i].UserID).First(&lecturer).Error; err == nil {
				assignments[i].Lecturer = &lecturer
			} else {
				// Log the issue but don't return an error
				fmt.Printf("Lecturer with user_id %d or ID %d not found: %v\n", 
					assignments[i].UserID, assignments[i].UserID, err)
			}
		}
	}
	
	return assignments, nil
}

// GetByID returns a specific lecturer assignment
func (r *LecturerAssignmentRepository) GetByID(id uint) (models.LecturerAssignment, error) {
	var assignment models.LecturerAssignment
	err := r.db.Preload("Course").Preload("AcademicYear").First(&assignment, id).Error
	if err != nil {
		return models.LecturerAssignment{}, err
	}
	
	// Manually load the lecturer for the assignment
	var lecturer models.Lecturer
	
	// First try getting lecturer by user_id
	if err := r.db.Where("user_id = ?", assignment.UserID).First(&lecturer).Error; err == nil {
		assignment.Lecturer = &lecturer
	} else {
		// If not found by user_id, try finding by direct ID match
		if err := r.db.Where("id = ?", assignment.UserID).First(&lecturer).Error; err == nil {
			assignment.Lecturer = &lecturer
		} else {
			// Log the issue but don't return an error
			fmt.Printf("Lecturer with user_id %d or ID %d not found: %v\n", 
				assignment.UserID, assignment.UserID, err)
		}
	}
	
	return assignment, nil
}

// GetByLecturerID returns assignments for a specific lecturer
func (r *LecturerAssignmentRepository) GetByLecturerID(userID int, academicYearID uint) ([]models.LecturerAssignment, error) {
	var assignments []models.LecturerAssignment
	query := r.db.Preload("Course").Preload("AcademicYear").Where("user_id = ?", userID)
	
	if academicYearID > 0 {
		query = query.Where("academic_year_id = ?", academicYearID)
	}
	
	err := query.Find(&assignments).Error
	if err != nil {
		return nil, err
	}
	
	// Manually load the lecturer for each assignment
	for i := range assignments {
		var lecturer models.Lecturer
		
		// First try getting lecturer by user_id
		if err := r.db.Where("user_id = ?", assignments[i].UserID).First(&lecturer).Error; err == nil {
			assignments[i].Lecturer = &lecturer
		} else {
			// If not found by user_id, try finding by direct ID match
			if err := r.db.Where("id = ?", assignments[i].UserID).First(&lecturer).Error; err == nil {
				assignments[i].Lecturer = &lecturer
			} else {
				// Log the issue but don't return an error
				fmt.Printf("Lecturer with user_id %d or ID %d not found: %v\n", 
					assignments[i].UserID, assignments[i].UserID, err)
			}
		}
	}
	
	return assignments, nil
}

// GetByCourseID returns all assignments for a specific course
func (r *LecturerAssignmentRepository) GetByCourseID(courseID, academicYearID uint) ([]models.LecturerAssignment, error) {
	var assignments []models.LecturerAssignment
	query := r.db.
		Preload("Course").
		Preload("AcademicYear").
		Where("course_id = ?", courseID)
	
	// Only filter by academic year if it's specified
	if academicYearID > 0 {
		query = query.Where("academic_year_id = ?", academicYearID)
	}
	
	err := query.Find(&assignments).Error
	if err != nil {
		return nil, err
	}
	
	// Manually load the lecturer for each assignment
	for i := range assignments {
		var lecturer models.Lecturer
		
		// First try getting lecturer by user_id
		if err := r.db.Where("user_id = ?", assignments[i].UserID).First(&lecturer).Error; err == nil {
			assignments[i].Lecturer = &lecturer
		} else {
			// If not found by user_id, try finding by direct ID match
			if err := r.db.Where("id = ?", assignments[i].UserID).First(&lecturer).Error; err == nil {
				assignments[i].Lecturer = &lecturer
			} else {
				// Log the issue but don't return an error
				fmt.Printf("Lecturer with user_id %d or ID %d not found: %v\n", 
					assignments[i].UserID, assignments[i].UserID, err)
			}
		}
	}
	
	return assignments, nil
}

// Create creates a new lecturer assignment
func (r *LecturerAssignmentRepository) Create(assignment *models.LecturerAssignment) error {
	return r.db.Create(assignment).Error
}

// Update updates a lecturer assignment
func (r *LecturerAssignmentRepository) Update(assignment *models.LecturerAssignment) error {
	fmt.Printf("Starting Update operation for LecturerAssignment ID=%d\n", assignment.ID)
	
	// Start a transaction
	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()
	
	if err := tx.Error; err != nil {
		return err
	}
	
	// Check if the record exists first
	var count int64
	if err := tx.Model(&models.LecturerAssignment{}).Where("id = ?", assignment.ID).Count(&count).Error; err != nil {
		tx.Rollback()
		return err
	}
	
	if count == 0 {
		tx.Rollback()
		return fmt.Errorf("lecturer assignment with ID %d not found", assignment.ID)
	}
	
	// Now perform the update
	result := tx.Model(&models.LecturerAssignment{}).
		Where("id = ?", assignment.ID).
		Updates(map[string]interface{}{
			"user_id":          assignment.UserID,
			"course_id":        assignment.CourseID,
			"academic_year_id": assignment.AcademicYearID,
		})
	
	if result.Error != nil {
		tx.Rollback()
		return result.Error
	}
	
	// Check if anything was actually updated
	if result.RowsAffected == 0 {
		tx.Rollback()
		return fmt.Errorf("no changes were made to lecturer assignment with ID %d", assignment.ID)
	}
	
	// Commit the transaction
	return tx.Commit().Error
}

// Delete deletes a lecturer assignment
func (r *LecturerAssignmentRepository) Delete(id uint) error {
	return r.db.Delete(&models.LecturerAssignment{}, id).Error
}

// AssignmentExists checks if an assignment already exists for the given course and academic year
func (r *LecturerAssignmentRepository) AssignmentExists(userID int, courseID, academicYearID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.LecturerAssignment{}).
		Where("user_id = ? AND course_id = ? AND academic_year_id = ?", userID, courseID, academicYearID).
		Count(&count).Error
	return count > 0, err
}

// AssignmentExistsForCourse checks if an assignment already exists for the given course regardless of academic year
func (r *LecturerAssignmentRepository) AssignmentExistsForCourse(userID int, courseID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.LecturerAssignment{}).
		Where("user_id = ? AND course_id = ?", userID, courseID).
		Count(&count).Error
	return count > 0, err
}

// GetAvailableLecturers returns all lecturers not already assigned to the given course in the given academic year
func (r *LecturerAssignmentRepository) GetAvailableLecturers(courseID, academicYearID uint) ([]models.Lecturer, error) {
	var lecturers []models.Lecturer
	
	// If no academic year specified, return all lecturers
	if academicYearID == 0 {
		err := r.db.Find(&lecturers).Error
		return lecturers, err
	}
	
	// Get all lecturer IDs already assigned to this course in this academic year
	var assignedLecturerIDs []int
	r.db.Model(&models.LecturerAssignment{}).
		Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID).
		Pluck("user_id", &assignedLecturerIDs)
	
	// Query to get all lecturers except those already assigned
	subQuery := r.db.Model(&models.LecturerAssignment{}).
		Select("user_id").
		Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID)
	
	query := r.db.Model(&models.Lecturer{})
	
	// If there are assigned lecturers, exclude them
	if len(assignedLecturerIDs) > 0 {
		query = query.Where("user_id NOT IN (?)", subQuery)
	}
	
	err := query.Find(&lecturers).Error
	return lecturers, err
}

// GetLecturerAssignmentResponses returns all lecturer assignments with detailed information
func (r *LecturerAssignmentRepository) GetLecturerAssignmentResponses(academicYearID uint) ([]models.LecturerAssignmentResponse, error) {
	var responses []models.LecturerAssignmentResponse
	
	// Debug: Print the academicYearID
	fmt.Printf("GetLecturerAssignmentResponses called with academicYearID: %d\n", academicYearID)
	
	// First, get all the assignments without joins to check if we have data
	var assignments []models.LecturerAssignment
	baseQuery := r.db.Model(&models.LecturerAssignment{})
	if academicYearID > 0 {
		baseQuery = baseQuery.Where("academic_year_id = ?", academicYearID)
	}
	
	err := baseQuery.Find(&assignments).Error
	if err != nil {
		return nil, err
	}
	
	fmt.Printf("Found %d assignments in the database\n", len(assignments))
	
	// If we found assignments, get the detailed information
	// But use separate queries to avoid losing data due to JOINs
	for _, assignment := range assignments {
		response := models.LecturerAssignmentResponse{
			ID:             assignment.ID,
			UserID:         assignment.UserID,
			CourseID:       assignment.CourseID,
			AcademicYearID: assignment.AcademicYearID,
			CreatedAt:      assignment.CreatedAt,
			UpdatedAt:      assignment.UpdatedAt,
		}
		
		// Get course information
		var course models.Course
		if err := r.db.First(&course, assignment.CourseID).Error; err == nil {
			response.CourseName = course.Name
			response.CourseCode = course.Code
			response.CourseSemester = course.Semester
		} else {
			fmt.Printf("Course with ID %d not found: %v\n", assignment.CourseID, err)
			response.CourseName = "Unknown Course"
			response.CourseCode = "N/A"
		}
		
		// Get academic year information
		var academicYear models.AcademicYear
		if err := r.db.First(&academicYear, assignment.AcademicYearID).Error; err == nil {
			response.AcademicYearName = academicYear.Name
			response.AcademicYearSemester = academicYear.Semester
		} else {
			fmt.Printf("Academic year with ID %d not found: %v\n", assignment.AcademicYearID, err)
			response.AcademicYearName = "N/A"
			response.AcademicYearSemester = "N/A"
		}
		
		// First try getting lecturer by user_id from the lecturers table
		var lecturer models.Lecturer
		if err := r.db.Where("user_id = ?", assignment.UserID).First(&lecturer).Error; err == nil {
			response.LecturerName = lecturer.FullName
			response.LecturerNIP = lecturer.NIP
			response.LecturerEmail = lecturer.Email
		} else {
			// If not found by user_id, try finding by direct ID match (for backward compatibility)
			if err := r.db.Where("id = ?", assignment.UserID).First(&lecturer).Error; err == nil {
				response.LecturerName = lecturer.FullName
				response.LecturerNIP = lecturer.NIP
				response.LecturerEmail = lecturer.Email
				
				// Log that we found by ID instead of user_id
				fmt.Printf("Lecturer found by ID %d instead of user_id\n", assignment.UserID)
			} else {
				// Handle the case where lecturer doesn't exist
				fmt.Printf("Lecturer with user_id %d or ID %d not found: %v\n", assignment.UserID, assignment.UserID, err)
				response.LecturerName = "Unknown Lecturer"
				response.LecturerNIP = "N/A"
			}
		}
		
		responses = append(responses, response)
	}
	
	return responses, nil
}

// GetLecturerAssignmentResponseByID returns a specific lecturer assignment with detailed information
func (r *LecturerAssignmentRepository) GetLecturerAssignmentResponseByID(id uint) (*models.LecturerAssignmentResponse, error) {
	// Get the assignment first
	var assignment models.LecturerAssignment
	if err := r.db.First(&assignment, id).Error; err != nil {
		return nil, err
	}
	
	// Create response with basic assignment info
	response := models.LecturerAssignmentResponse{
		ID:             assignment.ID,
		UserID:         assignment.UserID,
		CourseID:       assignment.CourseID,
		AcademicYearID: assignment.AcademicYearID,
		CreatedAt:      assignment.CreatedAt,
		UpdatedAt:      assignment.UpdatedAt,
	}
	
	// Get course information
	var course models.Course
	if err := r.db.First(&course, assignment.CourseID).Error; err == nil {
		response.CourseName = course.Name
		response.CourseCode = course.Code
		response.CourseSemester = course.Semester
	} else {
		response.CourseName = "Unknown Course"
		response.CourseCode = "N/A"
	}
	
	// Get academic year information
	var academicYear models.AcademicYear
	if err := r.db.First(&academicYear, assignment.AcademicYearID).Error; err == nil {
		response.AcademicYearName = academicYear.Name
		response.AcademicYearSemester = academicYear.Semester
	} else {
		response.AcademicYearName = "N/A"
		response.AcademicYearSemester = "N/A"
	}
	
	// First try getting lecturer by user_id from the lecturers table
	var lecturer models.Lecturer
	if err := r.db.Where("user_id = ?", assignment.UserID).First(&lecturer).Error; err == nil {
		response.LecturerName = lecturer.FullName
		response.LecturerNIP = lecturer.NIP
		response.LecturerEmail = lecturer.Email
	} else {
		// If not found by user_id, try finding by direct ID match (for backward compatibility)
		if err := r.db.Where("id = ?", assignment.UserID).First(&lecturer).Error; err == nil {
			response.LecturerName = lecturer.FullName
			response.LecturerNIP = lecturer.NIP
			response.LecturerEmail = lecturer.Email
		} else {
			// Handle the case where lecturer doesn't exist
			response.LecturerName = "Unknown Lecturer"
			response.LecturerNIP = "N/A"
		}
	}
	
	return &response, nil
}

// DB returns the underlying database connection
func (r *LecturerAssignmentRepository) DB() *gorm.DB {
	return r.db
} 