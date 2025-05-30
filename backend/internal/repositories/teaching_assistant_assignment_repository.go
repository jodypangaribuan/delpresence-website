package repositories

import (
	"fmt"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// TeachingAssistantAssignmentRepository provides methods to interact with teaching assistant assignments in the database
type TeachingAssistantAssignmentRepository struct {
	db *gorm.DB
}

// NewTeachingAssistantAssignmentRepository creates a new teaching assistant assignment repository
func NewTeachingAssistantAssignmentRepository() *TeachingAssistantAssignmentRepository {
	return &TeachingAssistantAssignmentRepository{
		db: database.GetDB(),
	}
}

// GetAll returns all teaching assistant assignments
func (r *TeachingAssistantAssignmentRepository) GetAll(academicYearID uint) ([]models.TeachingAssistantAssignment, error) {
	var assignments []models.TeachingAssistantAssignment
	query := r.db.Preload("Course").Preload("AcademicYear")

	if academicYearID > 0 {
		query = query.Where("academic_year_id = ?", academicYearID)
	}

	err := query.Find(&assignments).Error
	if err != nil {
		return nil, err
	}

	// Load employee data for each assignment
	for i := range assignments {
		var employee models.Employee
		if err := r.db.Where("user_id = ?", assignments[i].UserID).First(&employee).Error; err == nil {
			assignments[i].Employee = &employee
		}
	}

	return assignments, nil
}

// GetByID returns a specific teaching assistant assignment
func (r *TeachingAssistantAssignmentRepository) GetByID(id uint) (models.TeachingAssistantAssignment, error) {
	var assignment models.TeachingAssistantAssignment
	err := r.db.Preload("Course").Preload("AcademicYear").First(&assignment, id).Error
	if err != nil {
		return assignment, err
	}

	// Load employee data
	var employee models.Employee
	if err := r.db.Where("user_id = ?", assignment.UserID).First(&employee).Error; err == nil {
		assignment.Employee = &employee
	}

	return assignment, nil
}

// GetByEmployeeID returns assignments for a specific teaching assistant
func (r *TeachingAssistantAssignmentRepository) GetByEmployeeID(employeeID uint, academicYearID uint) ([]models.TeachingAssistantAssignment, error) {
	// First get the user_id from the employee
	var employee models.Employee
	if err := r.db.First(&employee, employeeID).Error; err != nil {
		return nil, err
	}

	var assignments []models.TeachingAssistantAssignment
	query := r.db.Preload("Course").Preload("AcademicYear")

	if academicYearID > 0 {
		query = query.Where("user_id = ? AND academic_year_id = ?", employee.UserID, academicYearID)
	} else {
		query = query.Where("user_id = ?", employee.UserID)
	}

	// For each assignment, load the employee data
	err := query.Find(&assignments).Error
	if err != nil {
		return nil, err
	}

	// Load employee data for each assignment
	for i := range assignments {
		var emp models.Employee
		if err := r.db.Where("user_id = ?", assignments[i].UserID).First(&emp).Error; err == nil {
			assignments[i].Employee = &emp
		}
	}

	return assignments, nil
}

// GetByCourseID returns assignments for a specific course
func (r *TeachingAssistantAssignmentRepository) GetByCourseID(courseID uint, academicYearID uint) ([]models.TeachingAssistantAssignment, error) {
	var assignments []models.TeachingAssistantAssignment
	query := r.db.Preload("Employee").Preload("AcademicYear")

	if academicYearID > 0 {
		query = query.Where("course_id = ? AND academic_year_id = ?", courseID, academicYearID)
	} else {
		query = query.Where("course_id = ?", courseID)
	}

	err := query.Find(&assignments).Error
	return assignments, err
}

// GetByLecturerID returns assignments created by a specific lecturer
func (r *TeachingAssistantAssignmentRepository) GetByLecturerID(lecturerID uint, academicYearID uint) ([]models.TeachingAssistantAssignment, error) {
	var assignments []models.TeachingAssistantAssignment
	query := r.db.Preload("Course").Preload("AcademicYear")

	if academicYearID > 0 {
		query = query.Where("assigned_by_id = ? AND academic_year_id = ?", lecturerID, academicYearID)
	} else {
		query = query.Where("assigned_by_id = ?", lecturerID)
	}

	err := query.Find(&assignments).Error
	if err != nil {
		return nil, err
	}

	// Load employee data for each assignment
	for i := range assignments {
		var employee models.Employee
		if err := r.db.Where("user_id = ?", assignments[i].UserID).First(&employee).Error; err == nil {
			assignments[i].Employee = &employee
		}
	}

	return assignments, nil
}

// Create creates a new teaching assistant assignment
func (r *TeachingAssistantAssignmentRepository) Create(assignment models.TeachingAssistantAssignment) (models.TeachingAssistantAssignment, error) {
	err := r.db.Create(&assignment).Error
	return assignment, err
}

// Update updates an existing teaching assistant assignment
func (r *TeachingAssistantAssignmentRepository) Update(assignment models.TeachingAssistantAssignment) (models.TeachingAssistantAssignment, error) {
	err := r.db.Save(&assignment).Error
	return assignment, err
}

// Delete deletes a teaching assistant assignment
func (r *TeachingAssistantAssignmentRepository) Delete(id uint) error {
	return r.db.Unscoped().Delete(&models.TeachingAssistantAssignment{}, id).Error
}

// AssignmentExistsForCourse checks if a teaching assistant is already assigned to a course
func (r *TeachingAssistantAssignmentRepository) AssignmentExistsForCourse(userID int, courseID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.TeachingAssistantAssignment{}).
		Where("user_id = ? AND course_id = ? AND user_id > 0", userID, courseID).
		Count(&count).Error
	return count > 0, err
}

// GetAvailableTeachingAssistants returns all employees eligible to be teaching assistants not already assigned to the given course
func (r *TeachingAssistantAssignmentRepository) GetAvailableTeachingAssistants(courseID, academicYearID uint) ([]models.Employee, error) {
	var employees []models.Employee

	// If no academic year specified, return all teaching assistants
	if academicYearID == 0 {
		err := r.db.Find(&employees).Error
		return employees, err
	}

	// Get all teaching assistant UserIDs already assigned to this course in this academic year
	// Only get UserIDs that are not 0 (0 means the teaching assistant has been removed)
	var assignedUserIDs []int
	r.db.Model(&models.TeachingAssistantAssignment{}).
		Where("course_id = ? AND academic_year_id = ? AND user_id > 0", courseID, academicYearID).
		Pluck("user_id", &assignedUserIDs)

	// Query to get all teaching assistants except those already assigned
	query := r.db.Model(&models.Employee{})

	// If there are assigned teaching assistants, exclude them
	if len(assignedUserIDs) > 0 {
		query = query.Where("user_id NOT IN (?)", assignedUserIDs)
	}

	err := query.Find(&employees).Error
	return employees, err
}

// GetTeachingAssistantAssignmentResponses returns all teaching assistant assignments with detailed information
func (r *TeachingAssistantAssignmentRepository) GetTeachingAssistantAssignmentResponses(academicYearID uint) ([]models.TeachingAssistantAssignmentResponse, error) {
	var assignments []models.TeachingAssistantAssignment
	var responses []models.TeachingAssistantAssignmentResponse

	// Get all assignments
	query := r.db.Preload("Course").Preload("AcademicYear")
	if academicYearID > 0 {
		query = query.Where("academic_year_id = ?", academicYearID)
	}

	if err := query.Find(&assignments).Error; err != nil {
		return nil, err
	}

	// Convert to responses
	for _, assignment := range assignments {
		response := models.TeachingAssistantAssignmentResponse{
			ID:             assignment.ID,
			UserID:         assignment.UserID,
			CourseID:       assignment.CourseID,
			AcademicYearID: assignment.AcademicYearID,
			AssignedByID:   assignment.AssignedByID,
			CreatedAt:      assignment.CreatedAt,
			UpdatedAt:      assignment.UpdatedAt,
		}

		// Add course details
		if assignment.Course.ID > 0 {
			response.CourseName = assignment.Course.Name
			response.CourseCode = assignment.Course.Code
			response.CourseSemester = assignment.Course.Semester
		} else {
			// Try to fetch course details
			var course models.Course
			if err := r.db.First(&course, assignment.CourseID).Error; err == nil {
				response.CourseName = course.Name
				response.CourseCode = course.Code
				response.CourseSemester = course.Semester
			} else {
				response.CourseName = "Unknown Course"
				response.CourseCode = "N/A"
			}
		}

		// Add academic year details
		if assignment.AcademicYear.ID > 0 {
			response.AcademicYearName = assignment.AcademicYear.Name
			response.AcademicYearSemester = assignment.AcademicYear.Semester
		} else {
			// Try to fetch academic year details
			var academicYear models.AcademicYear
			if err := r.db.First(&academicYear, assignment.AcademicYearID).Error; err == nil {
				response.AcademicYearName = academicYear.Name
				response.AcademicYearSemester = academicYear.Semester
			} else {
				response.AcademicYearName = "N/A"
				response.AcademicYearSemester = "N/A"
			}
		}

		// Add employee details
		var employee models.Employee
		if err := r.db.Where("user_id = ?", assignment.UserID).First(&employee).Error; err == nil {
			response.EmployeeName = employee.FullName
			response.EmployeeNIP = employee.NIP
			response.EmployeeEmail = employee.Email
			response.EmployeePosition = employee.Position
		} else {
			response.EmployeeName = "Unknown Employee"
			response.EmployeeNIP = "N/A"
			response.EmployeeEmail = "N/A"
			response.EmployeePosition = "N/A"
		}

		// Add assigned by details
		var lecturer models.Lecturer
		if err := r.db.Where("user_id = ?", assignment.AssignedByID).First(&lecturer).Error; err == nil {
			response.AssignedByName = lecturer.FullName
		} else {
			response.AssignedByName = fmt.Sprintf("User ID %d", assignment.AssignedByID)
		}

		responses = append(responses, response)
	}

	return responses, nil
}
