package models

import (
	"time"

	"gorm.io/gorm"
)

// CourseGroup represents a group of courses
type CourseGroup struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	Code          string         `gorm:"unique;not null" json:"code"`
	Name          string         `gorm:"not null" json:"name"`
	DepartmentID  uint           `json:"department_id"`
	Department    Department     `gorm:"foreignKey:DepartmentID" json:"department"`
	FacultyID     uint           `json:"faculty_id"`
	Faculty       Faculty        `gorm:"foreignKey:FacultyID" json:"faculty"`
	Courses       []*Course      `gorm:"many2many:course_to_groups;" json:"courses,omitempty"`
	CourseCount   int            `gorm:"-" json:"course_count"`
	TotalCredits  int            `gorm:"-" json:"total_credits"`
	SemesterRange string         `gorm:"-" json:"semester_range"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// CourseToGroup is a join table for the many-to-many relationship between courses and groups
type CourseToGroup struct {
	CourseID      uint `gorm:"primaryKey" json:"course_id"`
	CourseGroupID uint `gorm:"primaryKey" json:"course_group_id"`
}

// CalculateStats calculates course count, total credits, and semester range
func (cg *CourseGroup) CalculateStats() {
	if cg.Courses == nil {
		cg.CourseCount = 0
		cg.TotalCredits = 0
		cg.SemesterRange = ""
		return
	}
	
	cg.CourseCount = len(cg.Courses)
	
	// Calculate total credits
	totalCredits := 0
	semesters := make(map[int]bool)
	for _, course := range cg.Courses {
		totalCredits += course.Credits
		semesters[course.Semester] = true
	}
	cg.TotalCredits = totalCredits
	
	// Create semester range string
	if len(semesters) > 0 {
		// Convert map keys to slice
		semesterList := make([]int, 0, len(semesters))
		for sem := range semesters {
			semesterList = append(semesterList, sem)
		}
		
		// Sort the semester list
		for i := 0; i < len(semesterList); i++ {
			for j := i + 1; j < len(semesterList); j++ {
				if semesterList[i] > semesterList[j] {
					semesterList[i], semesterList[j] = semesterList[j], semesterList[i]
				}
			}
		}
		
		// Create comma-separated string
		semesterRange := ""
		for i, sem := range semesterList {
			if i > 0 {
				semesterRange += ", "
			}
			semesterRange += string(rune('0' + sem))
		}
		cg.SemesterRange = semesterRange
	}
} 