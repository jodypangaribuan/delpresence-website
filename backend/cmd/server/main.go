package main

import (
	"log"
	"os"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/auth/campus"
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

	// Initialize auth service (includes both user and student repositories)
	auth.Initialize()

	// Create admin user
	err = auth.CreateAdminUser()
	if err != nil {
		log.Fatalf("Error creating admin user: %v", err)
	}

	// Create a new Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders, "Authorization", "Content-Type")
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	router.Use(cors.New(config))

	// Register authentication routes
	router.POST("/api/auth/login", handlers.Login)
	router.POST("/api/auth/refresh", handlers.RefreshToken)

	// Register campus authentication route (works for all role types)
	router.POST("/api/auth/campus/login", handlers.CampusLogin)

	// Create handlers
	campusAuthHandler := handlers.NewCampusAuthHandler()
	lecturerHandler := handlers.NewLecturerHandler()
	studentHandler := handlers.NewStudentHandler()
	employeeHandler := handlers.NewEmployeeHandler()
	facultyHandler := handlers.NewFacultyHandler()
	studyProgramHandler := handlers.NewStudyProgramHandler()
	buildingHandler := handlers.NewBuildingHandler()
	roomHandler := handlers.NewRoomHandler()
	academicYearHandler := handlers.NewAcademicYearHandler()
	courseHandler := handlers.NewCourseHandler()
	studentGroupHandler := handlers.NewStudentGroupHandler()
	lecturerAssignmentHandler := handlers.NewLecturerAssignmentHandler()
	teachingAssistantAssignmentHandler := handlers.NewTeachingAssistantAssignmentHandler()
	courseScheduleHandler := handlers.NewCourseScheduleHandler()
	attendanceHandler := handlers.NewAttendanceHandler()

	// Protected routes
	authRequired := router.Group("/api")
	authRequired.Use(campus.CampusAuthMiddleware())
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
			adminRoutes.GET("/lecturers/search", lecturerHandler.SearchLecturers)
			adminRoutes.GET("/lecturers/:id", lecturerHandler.GetLecturerByID)
			adminRoutes.POST("/lecturers/sync", lecturerHandler.SyncLecturers)

			// Admin access to employee data (replacing assistant lecturer)
			adminRoutes.GET("/employees", employeeHandler.GetAllEmployees)
			adminRoutes.GET("/employees/:id", employeeHandler.GetEmployeeByID)
			adminRoutes.POST("/employees/sync", employeeHandler.SyncEmployees)

			// Admin access to student data
			adminRoutes.GET("/students", studentHandler.GetAllStudents)
			adminRoutes.GET("/students/:id", studentHandler.GetStudentByID)
			adminRoutes.GET("/students/by-user-id/:user_id", studentHandler.GetStudentByUserID)
			adminRoutes.POST("/students/sync", studentHandler.SyncStudents)

			// Admin access to faculty data
			adminRoutes.GET("/faculties", facultyHandler.GetAllFaculties)
			adminRoutes.GET("/faculties/:id", facultyHandler.GetFacultyByID)
			adminRoutes.POST("/faculties", facultyHandler.CreateFaculty)
			adminRoutes.PUT("/faculties/:id", facultyHandler.UpdateFaculty)
			adminRoutes.DELETE("/faculties/:id", facultyHandler.DeleteFaculty)

			// Admin access to study program data
			adminRoutes.GET("/study-programs", studyProgramHandler.GetAllStudyPrograms)
			adminRoutes.GET("/study-programs/:id", studyProgramHandler.GetStudyProgramByID)
			adminRoutes.POST("/study-programs", studyProgramHandler.CreateStudyProgram)
			adminRoutes.PUT("/study-programs/:id", studyProgramHandler.UpdateStudyProgram)
			adminRoutes.DELETE("/study-programs/:id", studyProgramHandler.DeleteStudyProgram)

			// Admin access to building data
			adminRoutes.GET("/buildings", buildingHandler.GetAllBuildings)
			adminRoutes.GET("/buildings/:id", buildingHandler.GetBuildingByID)
			adminRoutes.POST("/buildings", buildingHandler.CreateBuilding)
			adminRoutes.PUT("/buildings/:id", buildingHandler.UpdateBuilding)
			adminRoutes.DELETE("/buildings/:id", buildingHandler.DeleteBuilding)

			// Admin access to room data
			adminRoutes.GET("/rooms", roomHandler.GetAllRooms)
			adminRoutes.GET("/rooms/:id", roomHandler.GetRoomByID)
			adminRoutes.POST("/rooms", roomHandler.CreateRoom)
			adminRoutes.PUT("/rooms/:id", roomHandler.UpdateRoom)
			adminRoutes.DELETE("/rooms/:id", roomHandler.DeleteRoom)

			// Admin access to academic year data
			adminRoutes.GET("/academic-years", academicYearHandler.GetAllAcademicYears)
			adminRoutes.GET("/academic-years/:id", academicYearHandler.GetAcademicYearByID)
			adminRoutes.POST("/academic-years", academicYearHandler.CreateAcademicYear)
			adminRoutes.PUT("/academic-years/:id", academicYearHandler.UpdateAcademicYear)
			adminRoutes.DELETE("/academic-years/:id", academicYearHandler.DeleteAcademicYear)

			// Admin access to course data
			adminRoutes.GET("/courses", courseHandler.GetAllCourses)
			adminRoutes.GET("/courses/:id", courseHandler.GetCourseByID)
			adminRoutes.POST("/courses", courseHandler.CreateCourse)
			adminRoutes.PUT("/courses/:id", courseHandler.UpdateCourse)
			adminRoutes.DELETE("/courses/:id", courseHandler.DeleteCourse)

			// Admin access to student group data
			adminRoutes.GET("/student-groups", studentGroupHandler.GetAllStudentGroups)
			adminRoutes.GET("/student-groups/:id", studentGroupHandler.GetStudentGroupByID)
			adminRoutes.POST("/student-groups", studentGroupHandler.CreateStudentGroup)
			adminRoutes.PUT("/student-groups/:id", studentGroupHandler.UpdateStudentGroup)
			adminRoutes.DELETE("/student-groups/:id", studentGroupHandler.DeleteStudentGroup)
			adminRoutes.GET("/student-groups/:id/members", studentGroupHandler.GetGroupMembers)
			adminRoutes.GET("/student-groups/:id/available-students", studentGroupHandler.GetAvailableStudents)
			adminRoutes.POST("/student-groups/:id/members", studentGroupHandler.AddStudentToGroup)
			adminRoutes.POST("/student-groups/:id/members/batch", studentGroupHandler.AddMultipleStudentsToGroup)
			adminRoutes.DELETE("/student-groups/:id/members/:student_id", studentGroupHandler.RemoveStudentFromGroup)
			adminRoutes.POST("/student-groups/:id/members/remove-batch", studentGroupHandler.RemoveMultipleStudentsFromGroup)

			// Admin access to course schedules
			adminRoutes.GET("/schedules", courseScheduleHandler.GetAllSchedules)
			adminRoutes.GET("/schedules/:id", courseScheduleHandler.GetScheduleByID)
			adminRoutes.POST("/schedules", courseScheduleHandler.CreateSchedule)
			adminRoutes.PUT("/schedules/:id", courseScheduleHandler.UpdateSchedule)
			adminRoutes.DELETE("/schedules/:id", courseScheduleHandler.DeleteSchedule)

			// Admin access to lecturer assignments
			adminRoutes.GET("/courses/assignments", lecturerAssignmentHandler.GetAllLecturerAssignments)
			adminRoutes.GET("/courses/assignments/:id", lecturerAssignmentHandler.GetLecturerAssignmentByID)
			adminRoutes.POST("/courses/assignments", lecturerAssignmentHandler.CreateLecturerAssignment)
			adminRoutes.PUT("/courses/assignments/:id", lecturerAssignmentHandler.UpdateLecturerAssignment)
			adminRoutes.DELETE("/courses/assignments/:id", lecturerAssignmentHandler.DeleteLecturerAssignment)
			adminRoutes.GET("/courses/:id/lecturers", lecturerAssignmentHandler.GetAssignmentsByCourse)
			adminRoutes.GET("/lecturers/:id/courses", lecturerAssignmentHandler.GetAssignmentsByLecturer)
			adminRoutes.GET("/courses/:id/available-lecturers", lecturerAssignmentHandler.GetAvailableLecturers)

			// Admin access to teaching assistant assignments
			adminRoutes.GET("/courses/ta-assignments", teachingAssistantAssignmentHandler.GetAllTeachingAssistantAssignments)
			adminRoutes.GET("/courses/ta-assignments/:id", teachingAssistantAssignmentHandler.GetTeachingAssistantAssignmentByID)
			adminRoutes.POST("/courses/ta-assignments", teachingAssistantAssignmentHandler.CreateTeachingAssistantAssignment)
			adminRoutes.DELETE("/courses/ta-assignments/:id", teachingAssistantAssignmentHandler.DeleteTeachingAssistantAssignment)
			adminRoutes.GET("/courses/:id/teaching-assistants", teachingAssistantAssignmentHandler.GetAssignmentsByCourse)
			adminRoutes.GET("/employees/:id/assigned-courses", teachingAssistantAssignmentHandler.GetAssignmentsByTeachingAssistant)
			adminRoutes.GET("/courses/:id/available-teaching-assistants", teachingAssistantAssignmentHandler.GetAvailableTeachingAssistants)

			// New endpoint to get lecturer for a course - use a more specific path to avoid conflict
			adminRoutes.GET("/course-lecturers/course/:course_id", courseScheduleHandler.GetLecturerForCourse)
		}

		// Lecturer routes - add lecturer-specific endpoints
		lecturerRoutes := authRequired.Group("/lecturer")
		lecturerRoutes.Use(middleware.RoleMiddleware("Dosen", "dosen"))
		{
			// Get lecturer's own assignments
			lecturerRoutes.GET("/assignments", lecturerAssignmentHandler.GetMyAssignments)

			// Get lecturer's course schedules
			lecturerRoutes.GET("/schedules", courseScheduleHandler.GetMySchedules)

			// Get lecturer's courses (alias for assignments, more intuitive API endpoint)
			lecturerRoutes.GET("/courses", lecturerAssignmentHandler.GetMyAssignments)

			// Get academic years (needed for filtering courses and schedules)
			lecturerRoutes.GET("/academic-years", academicYearHandler.GetAllAcademicYears)

			// Attendance management routes for lecturers
			lecturerRoutes.POST("/attendance/sessions", attendanceHandler.CreateAttendanceSession)
			lecturerRoutes.GET("/attendance/sessions/active", attendanceHandler.GetActiveAttendanceSessions)
			lecturerRoutes.GET("/attendance/sessions", attendanceHandler.GetAttendanceSessions)
			lecturerRoutes.GET("/attendance/sessions/:id", attendanceHandler.GetAttendanceSessionDetails)
			lecturerRoutes.PUT("/attendance/sessions/:id/close", attendanceHandler.CloseAttendanceSession)
			lecturerRoutes.PUT("/attendance/sessions/:id/cancel", attendanceHandler.CancelAttendanceSession)
			lecturerRoutes.GET("/attendance/sessions/:id/students", attendanceHandler.GetStudentAttendances)
			lecturerRoutes.PUT("/attendance/sessions/:id/students/:studentId", attendanceHandler.MarkStudentAttendance)
			lecturerRoutes.GET("/attendance/statistics/course/:courseScheduleId", attendanceHandler.GetAttendanceStatistics)
			lecturerRoutes.GET("/attendance/qrcode/:id", attendanceHandler.GetQRCode)
			lecturerRoutes.GET("/attendance/sessions/:id/report", attendanceHandler.DownloadAttendanceReport)

			// Teaching assistant management endpoints for lecturers
			lecturerRoutes.GET("/ta-assignments", teachingAssistantAssignmentHandler.GetMyTeachingAssistantAssignments)
			lecturerRoutes.POST("/ta-assignments", teachingAssistantAssignmentHandler.CreateTeachingAssistantAssignment)
			lecturerRoutes.DELETE("/ta-assignments/:id", teachingAssistantAssignmentHandler.DeleteTeachingAssistantAssignment)
			lecturerRoutes.GET("/courses/:id/available-teaching-assistants", teachingAssistantAssignmentHandler.GetAvailableTeachingAssistants)
		}

		// Employee routes (replacing assistant routes)
		employeeRoutes := authRequired.Group("/employee")
		employeeRoutes.Use(middleware.RoleMiddleware("Pegawai"))
		{
			// Employee routes go here
			// Teaching assistant can view their assigned courses
			employeeRoutes.GET("/assigned-courses", teachingAssistantAssignmentHandler.GetAssignmentsByTeachingAssistant)

			// Other employee-specific routes can be added here
		}

		// Assistant routes
		assistantRoutes := authRequired.Group("/assistant")
		assistantRoutes.Use(middleware.RoleMiddleware("Asisten Dosen", "asisten dosen"))
		{
			// Assistant can view their assigned schedules
			assistantRoutes.GET("/schedules", teachingAssistantAssignmentHandler.GetMyAssignedSchedules)

			// Get academic years (needed for filtering courses and schedules)
			assistantRoutes.GET("/academic-years", academicYearHandler.GetAllAcademicYears)

			// Register teaching assistant attendance handler
			teachingAssistantAttendanceHandler := handlers.NewTeachingAssistantAttendanceHandler()

			// Attendance management routes for assistants - full capabilities like lecturers
			assistantRoutes.POST("/attendance/sessions", teachingAssistantAttendanceHandler.CreateAttendanceSession)
			assistantRoutes.GET("/attendance/sessions/active", teachingAssistantAttendanceHandler.GetActiveAttendanceSessions)
			assistantRoutes.GET("/attendance/sessions", teachingAssistantAttendanceHandler.GetAttendanceSessions)
			assistantRoutes.GET("/attendance/sessions/:id", teachingAssistantAttendanceHandler.GetAttendanceSessionDetails)
			assistantRoutes.PUT("/attendance/sessions/:id/close", teachingAssistantAttendanceHandler.CloseAttendanceSession)
			assistantRoutes.GET("/attendance/sessions/:id/students", teachingAssistantAttendanceHandler.GetStudentAttendances)
			assistantRoutes.PUT("/attendance/sessions/:id/students/:studentId", teachingAssistantAttendanceHandler.MarkStudentAttendance)
			assistantRoutes.GET("/attendance/qrcode/:id", teachingAssistantAttendanceHandler.GetQRCode)
			assistantRoutes.GET("/attendance/sessions/:id/report", teachingAssistantAttendanceHandler.DownloadAttendanceReport)
		}

		// Student routes
		studentRoutes := authRequired.Group("/student")
		studentRoutes.Use(middleware.RoleMiddleware("Mahasiswa"))
		{
			// Student routes go here
			studentRoutes.GET("/schedules", courseScheduleHandler.GetStudentSchedules)
			studentRoutes.GET("/academic-years", academicYearHandler.GetAllAcademicYears)

			// Add new endpoint for student courses
			studentCourseHandler := handlers.NewStudentCourseHandler()
			studentRoutes.GET("/courses", studentCourseHandler.GetStudentCourses)

			// Add new endpoint for students to check active attendance sessions
			studentAttendanceHandler := handlers.NewStudentAttendanceHandler()
			studentRoutes.GET("/attendance/active-sessions", studentAttendanceHandler.GetActiveAttendanceSessions)

			// Add new endpoint for QR code attendance submission
			studentRoutes.POST("/attendance/qr-submit", studentAttendanceHandler.SubmitQRAttendance)

			// Add new endpoint for attendance history
			studentRoutes.GET("/attendance/history", studentAttendanceHandler.GetAttendanceHistory)
		}
	}

	// Start the server
	port := utils.GetEnvWithDefault("SERVER_PORT", "8080")

	// Add public endpoints
	router.GET("/api/students/by-user-id/:user_id", studentHandler.GetStudentByUserID)

	log.Printf("Server running on port %s", port)
	err = router.Run(":" + port)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
		os.Exit(1)
	}
}
