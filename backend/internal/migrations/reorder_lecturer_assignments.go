package migrations

import (
	"fmt"
	"log"
	
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// ReorderLecturerAssignmentsTable reorders the fields in the lecturer_assignments table
func ReorderLecturerAssignmentsTable() error {
	db := database.GetDB()
	
	// Check if the table exists
	if !db.Migrator().HasTable("lecturer_assignments") {
		log.Println("lecturer_assignments table doesn't exist, skipping reordering")
		return nil
	}
	
	log.Println("Starting to reorder lecturer_assignments table...")
	
	// Start a transaction
	return db.Transaction(func(tx *gorm.DB) error {
		// Step 1: Create a temporary table with the new order
		tempTableName := "lecturer_assignments_temp"
		
		log.Println("Creating temporary table with new field order...")
		
		// Drop the temporary table if it exists
		if tx.Migrator().HasTable(tempTableName) {
			if err := tx.Migrator().DropTable(tempTableName); err != nil {
				return fmt.Errorf("failed to drop existing temporary table: %w", err)
			}
		}
		
		// Define the structure for the temporary table using a struct
		type LecturerAssignmentTemp struct {
			gorm.Model
			
			// Lecturer details
			UserID         int  `gorm:"index:idx_lecturer_assignment_user_id"`
			
			// Course details
			CourseID       uint `gorm:"index:idx_lecturer_assignment_course_id"`
			
			// Academic year details
			AcademicYearID uint `gorm:"index:idx_lecturer_assignment_academic_year_id"`
		}
		
		// Create the temporary table
		if err := tx.Table(tempTableName).Migrator().CreateTable(&LecturerAssignmentTemp{}); err != nil {
			return fmt.Errorf("failed to create temporary table: %w", err)
		}
		
		// Step 2: Copy data from the original table to the temporary table
		log.Println("Copying data to temporary table...")
		
		if err := tx.Exec(`
			INSERT INTO ` + tempTableName + ` (
				id, created_at, updated_at, deleted_at, 
				user_id, course_id, academic_year_id
			)
			SELECT 
				id, created_at, updated_at, deleted_at, 
				user_id, course_id, academic_year_id
			FROM lecturer_assignments
		`).Error; err != nil {
			return fmt.Errorf("failed to copy data to temporary table: %w", err)
		}
		
		// Step 3: Drop the original table
		log.Println("Dropping original table...")
		
		if err := tx.Migrator().DropTable("lecturer_assignments"); err != nil {
			return fmt.Errorf("failed to drop original table: %w", err)
		}
		
		// Step 4: Rename the temporary table to the original table name
		log.Println("Renaming temporary table to original table name...")
		
		if err := tx.Migrator().RenameTable(tempTableName, "lecturer_assignments"); err != nil {
			return fmt.Errorf("failed to rename temporary table: %w", err)
		}
		
		// Step 5: Recreate foreign key constraints
		log.Println("Recreating foreign key constraints...")
		
		// Create an empty model and migrate it to ensure all constraints are properly set
		if err := tx.Migrator().AutoMigrate(&models.LecturerAssignment{}); err != nil {
			return fmt.Errorf("failed to recreate constraints: %w", err)
		}
		
		log.Println("Successfully reordered lecturer_assignments table")
		return nil
	})
} 