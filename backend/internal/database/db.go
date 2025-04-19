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
			SlowThreshold:             time.Second,   // Slow SQL threshold
			LogLevel:                  logger.Info,   // Log level
			IgnoreRecordNotFoundError: true,         // Ignore ErrRecordNotFound error for logger
			ParameterizedQueries:      false,        // Don't include params in the SQL log
			Colorful:                  true,         // Enable color
		},
	)

	// Create connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		host, port, user, password, dbname)

	// Connect to database
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: newLogger,
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

	// Auto-migrate in specific order to handle dependencies
	log.Println("Starting database migration...")
	
	// First migrate the User model (no external dependencies)
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatalf("Error auto-migrating User model: %v\n", err)
	}
	log.Println("User table migrated successfully")
	
	// Then migrate the Student model
	err = DB.AutoMigrate(&models.Student{})
	if err != nil {
		log.Fatalf("Error auto-migrating Student model: %v\n", err)
	}
	log.Println("Student table migrated successfully")
	
	// Then migrate the Lecturer model
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