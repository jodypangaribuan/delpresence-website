package main

import (
	"log"
	"os"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/handlers"
	"github.com/delpresence/backend/internal/middleware"
	"github.com/delpresence/backend/internal/utils"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Set Gin mode
	gin.SetMode(utils.GetEnvWithDefault("GIN_MODE", "debug"))

	// Initialize database connection
	database.Initialize()

	// Initialize auth service
	auth.Initialize()
	auth.InitializeStudentAuth()

	// Create admin user
	err = auth.CreateAdminUser()
	if err != nil {
		log.Fatalf("Error creating admin user: %v", err)
	}

	// Create a new Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{utils.GetEnvWithDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")}
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders, "Authorization", "Content-Type")
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	router.Use(cors.New(config))

	// Register authentication routes
	router.POST("/api/auth/login", handlers.Login)
	router.POST("/api/auth/refresh", handlers.RefreshToken)
	
	// Register campus authentication routes
	router.POST("/api/auth/campus/login", handlers.CampusLogin)
	
	// Register student authentication routes
	router.POST("/api/auth/student/login", handlers.StudentLogin)

	// Create handlers
	campusAuthHandler := handlers.NewCampusAuthHandler()
	lecturerHandler := handlers.NewLecturerHandler()
	studentHandler := handlers.NewStudentHandler()
	employeeHandler := handlers.NewEmployeeHandler()

	// Protected routes
	authRequired := router.Group("/api")
	authRequired.Use(middleware.AuthMiddleware())
	{
		// Current user
		authRequired.GET("/auth/me", handlers.GetCurrentUser)

		// Admin routes
		adminRoutes := authRequired.Group("/admin")
		adminRoutes.Use(middleware.RoleMiddleware("Admin"))
		{
			// Campus API token management (admin only)
			adminRoutes.GET("/campus/token", campusAuthHandler.GetToken)
			adminRoutes.POST("/campus/token/refresh", campusAuthHandler.RefreshToken)
			
			// Admin access to lecturer data
			adminRoutes.GET("/lecturers", lecturerHandler.GetAllLecturers)
			adminRoutes.GET("/lecturers/:id", lecturerHandler.GetLecturerByID)
			adminRoutes.POST("/lecturers/sync", lecturerHandler.SyncLecturers)

			// Admin access to employee data (replacing assistant lecturer)
			adminRoutes.GET("/employees", employeeHandler.GetAllEmployees)
			adminRoutes.GET("/employees/:id", employeeHandler.GetEmployeeByID)
			adminRoutes.POST("/employees/sync", employeeHandler.SyncEmployees)

			// Admin access to student data
			adminRoutes.GET("/students", studentHandler.GetAllStudents)
			adminRoutes.GET("/students/:id", studentHandler.GetStudentByID)
			adminRoutes.POST("/students/sync", studentHandler.SyncStudents)
		}
		
		// Lecturer routes
		lecturerRoutes := authRequired.Group("/lecturer")
		lecturerRoutes.Use(middleware.RoleMiddleware("Dosen"))
		{
			// Lecturer profile
			lecturerRoutes.GET("/profile", handlers.GetCurrentUser)
		}
		
		// Employee routes (replacing assistant routes)
		employeeRoutes := authRequired.Group("/employee")
		employeeRoutes.Use(middleware.RoleMiddleware("Pegawai"))
		{
			// Employee profile
			employeeRoutes.GET("/profile", handlers.GetCurrentUser)
		}
		
		// Student routes
		studentRoutes := authRequired.Group("/student")
		studentRoutes.Use(middleware.RoleMiddleware("Mahasiswa"))
		{
			// Student profile
			studentRoutes.GET("/profile", handlers.GetCurrentUser)
		}
	}

	// Start the server
	port := utils.GetEnvWithDefault("SERVER_PORT", "8080")
	log.Printf("Server running on port %s", port)
	err = router.Run(":" + port)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
		os.Exit(1)
	}
} 