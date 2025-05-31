package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/delpresence/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the database connection
var DB *gorm.DB

// Initialize connects to the database and creates tables if they don't exist
func Initialize() {
	var err error

	// Get database connection details from environment variables
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	// Configure GORM logger
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
		logger.Config{
			SlowThreshold:             time.Second, // Slow SQL threshold
			LogLevel:                  logger.Info, // Log level
			IgnoreRecordNotFoundError: true,        // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      false,       // Don't include params in the SQL log
			Colorful:                  true,        // Enable color
		},
	)

	// Create connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		host, port, user, password, dbname)

	// Connect to database
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger:                                   newLogger,
		DisableForeignKeyConstraintWhenMigrating: true, // Disable foreign key checks during migrations
	})
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	// Get the underlying SQL DB to configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatalf("Error getting underlying SQL DB: %v", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Connected to database successfully")

	log.Println("Starting database migration...")

	// First migrate the User model (no external dependencies)
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatalf("Error auto-migrating User model: %v\n", err)
	}
	log.Println("User table migrated successfully")

	// Then migrate the Faculty model
	err = DB.AutoMigrate(&models.Faculty{})
	if err != nil {
		log.Fatalf("Error auto-migrating Faculty model: %v\n", err)
	}
	log.Println("Faculty table migrated successfully")

	// Then migrate the StudyProgram model (depends on Faculty)
	err = DB.AutoMigrate(&models.StudyProgram{})
	if err != nil {
		log.Fatalf("Error auto-migrating StudyProgram model: %v\n", err)
	}
	log.Println("StudyProgram table migrated successfully")

	// Then migrate the Student model
	err = DB.AutoMigrate(&models.Student{})
	if err != nil {
		log.Fatalf("Error auto-migrating Student model: %v\n", err)
	}
	log.Println("Student table migrated successfully")

	// Then migrate the Lecturer model (depends on StudyProgram)
	err = DB.AutoMigrate(&models.Lecturer{})
	if err != nil {
		log.Fatalf("Error auto-migrating Lecturer model: %v\n", err)
	}
	log.Println("Lecturer table migrated successfully")

	// Then migrate the Employee model
	err = DB.AutoMigrate(&models.Employee{})
	if err != nil {
		log.Fatalf("Error auto-migrating Employee model: %v\n", err)
	}
	log.Println("Employee table migrated successfully")

	// Finally migrate the Admin model
	err = DB.AutoMigrate(&models.Admin{})
	if err != nil {
		log.Fatalf("Error auto-migrating Admin model: %v\n", err)
	}
	log.Println("Admin table migrated successfully")

	// Then migrate the Building model
	err = DB.AutoMigrate(&models.Building{})
	if err != nil {
		log.Fatalf("Error auto-migrating Building model: %v\n", err)
	}
	log.Println("Building table migrated successfully")

	// Then migrate the Room model (depends on Building)
	err = DB.AutoMigrate(&models.Room{})
	if err != nil {
		log.Fatalf("Error auto-migrating Room model: %v\n", err)
	}
	log.Println("Room table migrated successfully")

	// Then migrate the AcademicYear model
	err = DB.AutoMigrate(&models.AcademicYear{})
	if err != nil {
		log.Fatalf("Error auto-migrating AcademicYear model: %v\n", err)
	}

	// Drop existing unique index if it exists
	if DB.Migrator().HasIndex(&models.AcademicYear{}, "idx_academic_years_name_deleted_at") {
		log.Println("Dropping existing unique index on academic_years table...")
		if err := DB.Migrator().DropIndex(&models.AcademicYear{}, "idx_academic_years_name_deleted_at"); err != nil {
			log.Printf("Error dropping existing index: %v\n", err)
		}
	}

	// Ensure the new composite unique index exists
	if !DB.Migrator().HasIndex(&models.AcademicYear{}, "idx_academic_years_name_semester_deleted_at") {
		log.Println("Creating new composite unique index on academic_years table...")
		if err := DB.Exec("CREATE UNIQUE INDEX idx_academic_years_name_semester_deleted_at ON academic_years (name, semester, COALESCE(deleted_at, '0001-01-01 00:00:00'::timestamp))").Error; err != nil {
			log.Printf("Error creating new composite index: %v\n", err)
		}
	}

	log.Println("AcademicYear table migrated successfully")

	// Then migrate the Course model (depends on Department, Faculty, and AcademicYear)
	err = DB.AutoMigrate(&models.Course{})
	if err != nil {
		log.Fatalf("Error auto-migrating Course model: %v\n", err)
	}
	log.Println("Course table migrated successfully")

	// Then migrate the StudentGroup model
	err = DB.AutoMigrate(&models.StudentGroup{})
	if err != nil {
		log.Fatalf("Error auto-migrating StudentGroup model: %v\n", err)
	}
	log.Println("StudentGroup table migrated successfully")

	// Then migrate the StudentToGroup join table
	err = DB.AutoMigrate(&models.StudentToGroup{})
	if err != nil {
		log.Fatalf("Error auto-migrating StudentToGroup model: %v\n", err)
	}
	log.Println("StudentToGroup table migrated successfully")

	// Then migrate the LecturerAssignment model
	// Drop and recreate lecturer_assignments table with new field order
	if DB.Migrator().HasTable("lecturer_assignments") {
		log.Println("Dropping lecturer_assignments table to reorder fields...")
		if err := DB.Migrator().DropTable("lecturer_assignments"); err != nil {
			log.Fatalf("Error dropping lecturer_assignments table: %v\n", err)
		}
	}

	log.Println("Creating lecturer_assignments table with new field order...")
	err = DB.AutoMigrate(&models.LecturerAssignment{})
	if err != nil {
		log.Fatalf("Failed to migrate LecturerAssignment model: %v", err)
		return
	}
	log.Println("LecturerAssignment model migrated successfully")

	// Migrate TeachingAssistantAssignment model
	// Drop and recreate teaching_assistant_assignments table with new field order
	if DB.Migrator().HasTable("teaching_assistant_assignments") {
		log.Println("Dropping teaching_assistant_assignments table to update schema...")
		if err := DB.Migrator().DropTable("teaching_assistant_assignments"); err != nil {
			log.Fatalf("Error dropping teaching_assistant_assignments table: %v\n", err)
		}
	}

	log.Println("Creating teaching_assistant_assignments table with new schema...")
	err = DB.AutoMigrate(&models.TeachingAssistantAssignment{})
	if err != nil {
		log.Fatalf("Failed to migrate TeachingAssistantAssignment model: %v", err)
		return
	}
	log.Println("TeachingAssistantAssignment model migrated successfully")

	// Then migrate the CourseSchedule model
	err = DB.AutoMigrate(&models.CourseSchedule{})
	if err != nil {
		log.Fatalf("Failed to migrate CourseSchedule model: %v", err)
		return
	}
	log.Println("CourseSchedule model migrated successfully")

	// Then migrate the attendance models
	err = DB.AutoMigrate(&models.AttendanceSession{}, &models.StudentAttendance{})
	if err != nil {
		log.Fatalf("Error auto-migrating Attendance models: %v\n", err)
	}
	log.Println("Attendance tables migrated successfully")

	// Migrate the StudentFace model for face recognition
	err = DB.AutoMigrate(&models.StudentFace{})
	if err != nil {
		log.Fatalf("Error auto-migrating StudentFace model: %v\n", err)
	}
	log.Println("StudentFace table migrated successfully")

	log.Println("Database schema migrated successfully")
}

// Close closes the database connection
func Close() {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			log.Printf("Error getting underlying SQL DB: %v", err)
			return
		}
		sqlDB.Close()
	}
}

// GetDB returns the database connection
func GetDB() *gorm.DB {
	return DB
}
