package handlers

import (
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/tealeg/xlsx/v3"
)

// TeachingAssistantAttendanceHandler handles attendance-related API requests from teaching assistants
type TeachingAssistantAttendanceHandler struct {
	attendanceService *services.AttendanceService
}

// NewTeachingAssistantAttendanceHandler creates a new attendance handler for teaching assistants
func NewTeachingAssistantAttendanceHandler() *TeachingAssistantAttendanceHandler {
	return &TeachingAssistantAttendanceHandler{
		attendanceService: services.NewAttendanceService(),
	}
}

// CreateAttendanceSession creates a new attendance session for a course schedule
func (h *TeachingAssistantAttendanceHandler) CreateAttendanceSession(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse request
	var req struct {
		CourseScheduleID uint                   `json:"course_schedule_id"`
		Type             string                 `json:"type"`
		Date             string                 `json:"date"`
		Settings         map[string]interface{} `json:"settings"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid request body",
		})
		return
	}

	// Convert date string to time.Time
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid date format, use YYYY-MM-DD",
		})
		return
	}

	// Convert string type to enum
	var attendanceType models.AttendanceType
	switch req.Type {
	case "QR_CODE":
		attendanceType = models.AttendanceTypeQRCode
	case "FACE_RECOGNITION":
		attendanceType = models.AttendanceTypeFaceRecognition
	case "MANUAL":
		attendanceType = models.AttendanceTypeManual
	case "BOTH":
		attendanceType = models.AttendanceTypeBoth
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid attendance type",
		})
		return
	}

	// Create the session
	session, err := h.attendanceService.CreateAttendanceSession(userID, req.CourseScheduleID, date, attendanceType, req.Settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Get the response format
	response, err := h.attendanceService.GetSessionDetails(session.ID, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Session created but error retrieving details",
		})
		return
	}

	// Return the session details
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   response,
	})
}

// GetActiveAttendanceSessions gets all active attendance sessions for the authenticated assistant
func (h *TeachingAssistantAttendanceHandler) GetActiveAttendanceSessions(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Get active sessions using the new function that supports TAs
	sessions, err := h.attendanceService.GetActiveSessionsForUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get active sessions",
		})
		return
	}

	// Return sessions
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   sessions,
	})
}

// GetAttendanceSessions gets attendance sessions for the authenticated assistant
func (h *TeachingAssistantAttendanceHandler) GetAttendanceSessions(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Parse query parameters
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	// Default to today if not provided
	if startDateStr == "" {
		startDateStr = time.Now().Format("2006-01-02")
	}
	if endDateStr == "" {
		endDateStr = time.Now().Format("2006-01-02")
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid start_date format, use YYYY-MM-DD",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid end_date format, use YYYY-MM-DD",
		})
		return
	}

	// Set end time to end of day
	endDate = endDate.Add(24*time.Hour - time.Second)

	// Get sessions (now supports teaching assistants properly)
	sessions, err := h.attendanceService.GetSessionsByDateRange(userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return sessions
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   sessions,
	})
}

// GetAttendanceSessionDetails gets detailed information for a specific attendance session
func (h *TeachingAssistantAttendanceHandler) GetAttendanceSessionDetails(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Get session details
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return session details
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   session,
	})
}

// CloseAttendanceSession closes an active attendance session
func (h *TeachingAssistantAttendanceHandler) CloseAttendanceSession(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Close the session
	if err := h.attendanceService.CloseAttendanceSession(uint(sessionID), userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return success
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Attendance session closed successfully",
	})
}

// GetStudentAttendances gets student attendance records for a session
func (h *TeachingAssistantAttendanceHandler) GetStudentAttendances(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Get student attendances
	attendances, err := h.attendanceService.GetStudentAttendances(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return student attendances
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   attendances,
	})
}

// MarkStudentAttendance marks a student's attendance for a session
func (h *TeachingAssistantAttendanceHandler) MarkStudentAttendance(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID and student ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	studentID, err := strconv.ParseUint(c.Param("studentId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid student ID",
		})
		return
	}

	// Parse request
	var req struct {
		Status             string `json:"status"`
		Notes              string `json:"notes"`
		VerificationMethod string `json:"verification_method"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid request body",
		})
		return
	}

	// Convert string status to enum
	var status models.StudentAttendanceStatus
	switch req.Status {
	case "PRESENT":
		status = models.StudentAttendanceStatusPresent
	case "LATE":
		status = models.StudentAttendanceStatusLate
	case "ABSENT":
		status = models.StudentAttendanceStatusAbsent
	case "EXCUSED":
		status = models.StudentAttendanceStatusExcused
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid attendance status",
		})
		return
	}

	// Mark student attendance
	if err := h.attendanceService.MarkStudentAttendance(uint(sessionID), uint(studentID), status, req.VerificationMethod, req.Notes, &userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Student attendance marked successfully",
	})
}

// GetQRCode generates a QR code for an attendance session
func (h *TeachingAssistantAttendanceHandler) GetQRCode(c *gin.Context) {
	// Extract assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid session ID",
		})
		return
	}

	// Get session to verify ownership
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Check if the session uses QR code
	if session.Type != "QR Code" && session.Type != "Keduanya" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "This session does not use QR code",
		})
		return
	}

	// Return QR code URL
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": map[string]interface{}{
			"qr_code_url": "/api/attendance/qr-code/" + strconv.FormatUint(sessionID, 10),
		},
	})
}

// DownloadAttendanceReport downloads attendance report as Excel file for a specific session
func (h *TeachingAssistantAttendanceHandler) DownloadAttendanceReport(c *gin.Context) {
	// Extract teaching assistant ID from authenticated user
	userID := c.MustGet("userID").(uint)

	// Extract session ID from URL
	sessionID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session ID"})
		return
	}

	// Get session details
	session, err := h.attendanceService.GetSessionDetails(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Get all student attendances for this session
	attendances, err := h.attendanceService.GetStudentAttendances(uint(sessionID), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve attendance data"})
		return
	}

	// Create Excel file
	file := xlsx.NewFile()

	// Create main summary sheet
	summarySheet, err := file.AddSheet("Summary")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Excel sheet"})
		return
	}

	// Add title and styling
	titleRow := summarySheet.AddRow()
	titleCell := titleRow.AddCell()
	titleCell.Value = fmt.Sprintf("LAPORAN PRESENSI MAHASISWA")
	titleStyle := xlsx.NewStyle()
	titleStyle.Font.Bold = true
	titleStyle.Font.Size = 16
	titleCell.SetStyle(titleStyle)

	// Add course information
	summarySheet.AddRow() // Empty row for spacing

	courseRow := summarySheet.AddRow()
	courseNameLabel := courseRow.AddCell()
	courseNameLabel.Value = "Mata Kuliah"
	courseNameValue := courseRow.AddCell()
	courseNameValue.Value = fmt.Sprintf("%s - %s", session.CourseCode, session.CourseName)

	dateRow := summarySheet.AddRow()
	dateLabel := dateRow.AddCell()
	dateLabel.Value = "Tanggal"
	dateValue := dateRow.AddCell()
	dateValue.Value = session.Date

	timeRow := summarySheet.AddRow()
	timeLabel := timeRow.AddCell()
	timeLabel.Value = "Waktu"
	timeValue := timeRow.AddCell()
	timeValue.Value = fmt.Sprintf("%s - %s", session.StartTime, session.EndTime)

	roomRow := summarySheet.AddRow()
	roomLabel := roomRow.AddCell()
	roomLabel.Value = "Ruangan"
	roomValue := roomRow.AddCell()
	roomValue.Value = session.Room

	// Add statistics
	summarySheet.AddRow() // Empty row for spacing

	statsRow := summarySheet.AddRow()
	statsLabel := statsRow.AddCell()
	statsLabel.Value = "Statistik Kehadiran"
	statsStyle := xlsx.NewStyle()
	statsStyle.Font.Bold = true
	statsLabel.SetStyle(statsStyle)

	totalRow := summarySheet.AddRow()
	totalLabel := totalRow.AddCell()
	totalLabel.Value = "Total Mahasiswa"
	totalValue := totalRow.AddCell()
	totalValue.Value = fmt.Sprintf("%d", session.TotalStudents)

	presentRow := summarySheet.AddRow()
	presentLabel := presentRow.AddCell()
	presentLabel.Value = "Hadir"
	presentValue := presentRow.AddCell()
	presentValue.Value = fmt.Sprintf("%d", session.AttendedCount)

	lateRow := summarySheet.AddRow()
	lateLabel := lateRow.AddCell()
	lateLabel.Value = "Terlambat"
	lateValue := lateRow.AddCell()
	lateValue.Value = fmt.Sprintf("%d", session.LateCount)

	absentRow := summarySheet.AddRow()
	absentLabel := absentRow.AddCell()
	absentLabel.Value = "Tidak Hadir"
	absentValue := absentRow.AddCell()
	absentValue.Value = fmt.Sprintf("%d", session.AbsentCount)

	excusedRow := summarySheet.AddRow()
	excusedLabel := excusedRow.AddCell()
	excusedLabel.Value = "Izin"
	excusedValue := excusedRow.AddCell()
	excusedValue.Value = fmt.Sprintf("%d", session.ExcusedCount)

	percentRow := summarySheet.AddRow()
	percentLabel := percentRow.AddCell()
	percentLabel.Value = "Persentase Kehadiran"
	percentValue := percentRow.AddCell()

	// Calculate attendance percentage
	totalStudents := session.TotalStudents
	if totalStudents > 0 {
		attendancePercent := float64(session.AttendedCount+session.LateCount) / float64(totalStudents) * 100
		percentValue.Value = fmt.Sprintf("%.2f%%", attendancePercent)
	} else {
		percentValue.Value = "N/A"
	}

	// Create detailed attendance sheet
	detailSheet, err := file.AddSheet("Daftar Hadir")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create detail sheet"})
		return
	}

	// Add table header with styling
	headerRow := detailSheet.AddRow()

	headerStyle := xlsx.NewStyle()
	headerStyle.Font.Bold = true
	headerStyle.Fill.PatternType = "solid"
	headerStyle.Fill.BgColor = "C6E0B4" // Light green background
	headerStyle.Alignment.Horizontal = "center"
	headerStyle.Border.Left = "thin"
	headerStyle.Border.Right = "thin"
	headerStyle.Border.Top = "thin"
	headerStyle.Border.Bottom = "thin"

	headerCells := []string{"No", "NIM", "Nama Mahasiswa", "Status", "Waktu Presensi", "Metode Verifikasi", "Keterangan"}
	for _, header := range headerCells {
		cell := headerRow.AddCell()
		cell.Value = header
		cell.SetStyle(headerStyle)
	}

	// Add data rows
	for i, attendance := range attendances {
		row := detailSheet.AddRow()

		// Style for data cells
		dataStyle := xlsx.NewStyle()
		dataStyle.Border.Left = "thin"
		dataStyle.Border.Right = "thin"
		dataStyle.Border.Top = "thin"
		dataStyle.Border.Bottom = "thin"

		// Status-specific styling
		statusStyle := xlsx.NewStyle()
		statusStyle.Border.Left = "thin"
		statusStyle.Border.Right = "thin"
		statusStyle.Border.Top = "thin"
		statusStyle.Border.Bottom = "thin"
		statusStyle.Font.Bold = true
		statusStyle.Alignment.Horizontal = "center"

		// Set row background color based on status
		switch attendance.Status {
		case "PRESENT":
			statusStyle.Fill.PatternType = "solid"
			statusStyle.Fill.BgColor = "C6EFCE" // Light green
			statusStyle.Font.Color = "006100"   // Dark green
		case "LATE":
			statusStyle.Fill.PatternType = "solid"
			statusStyle.Fill.BgColor = "FFEB9C" // Light yellow
			statusStyle.Font.Color = "9C5700"   // Dark orange
		case "ABSENT":
			statusStyle.Fill.PatternType = "solid"
			statusStyle.Fill.BgColor = "FFC7CE" // Light red
			statusStyle.Font.Color = "9C0006"   // Dark red
		case "EXCUSED":
			statusStyle.Fill.PatternType = "solid"
			statusStyle.Fill.BgColor = "DDEBF7" // Light blue
			statusStyle.Font.Color = "2F75B5"   // Dark blue
		}

		// Add data cells
		numCell := row.AddCell()
		numCell.SetInt(i + 1)
		numCell.SetStyle(dataStyle)

		nimCell := row.AddCell()
		nimCell.Value = attendance.StudentNIM
		nimCell.SetStyle(dataStyle)

		nameCell := row.AddCell()
		nameCell.Value = attendance.StudentName
		nameCell.SetStyle(dataStyle)

		statusCell := row.AddCell()

		// Translate status to Indonesian
		statusText := ""
		switch attendance.Status {
		case "PRESENT":
			statusText = "Hadir"
		case "LATE":
			statusText = "Terlambat"
		case "ABSENT":
			statusText = "Tidak Hadir"
		case "EXCUSED":
			statusText = "Izin"
		default:
			statusText = attendance.Status
		}

		statusCell.Value = statusText
		statusCell.SetStyle(statusStyle)

		timeCell := row.AddCell()
		timeCell.Value = attendance.CheckInTime
		timeCell.SetStyle(dataStyle)

		methodCell := row.AddCell()

		// Translate verification method to Indonesian
		methodText := ""
		switch attendance.VerificationMethod {
		case "QR_CODE":
			methodText = "Kode QR"
		case "FACE_RECOGNITION":
			methodText = "Pengenalan Wajah"
		case "MANUAL":
			methodText = "Manual"
		default:
			methodText = attendance.VerificationMethod
		}

		methodCell.Value = methodText
		methodCell.SetStyle(dataStyle)

		noteCell := row.AddCell()
		noteCell.Value = attendance.Notes
		noteCell.SetStyle(dataStyle)
	}

	// Auto-size columns for better readability
	detailSheet.SetColWidth(1, 1, 5)  // No
	detailSheet.SetColWidth(2, 2, 15) // NIM
	detailSheet.SetColWidth(3, 3, 30) // Name
	detailSheet.SetColWidth(4, 4, 15) // Status
	detailSheet.SetColWidth(5, 5, 20) // Check-in time
	detailSheet.SetColWidth(6, 6, 20) // Verification method
	detailSheet.SetColWidth(7, 7, 30) // Notes

	// Set filename with course code, course name and date
	filename := fmt.Sprintf("Presensi_%s_%s_%s.xlsx",
		session.CourseCode,
		formatTAFilename(session.CourseName),
		formatTAFilename(session.Date))

	// Set response headers
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

	// Write file to response
	err = file.Write(c.Writer)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate Excel file"})
		return
	}
}

// Helper function to format strings for filenames
func formatTAFilename(s string) string {
	// Replace spaces with underscores
	s = strings.ReplaceAll(s, " ", "_")

	// Replace slashes with hyphens
	s = strings.ReplaceAll(s, "/", "-")
	s = strings.ReplaceAll(s, "\\", "-")

	// Remove other special characters
	reg := regexp.MustCompile(`[^\w\-]`)
	s = reg.ReplaceAllString(s, "")

	// Convert to lowercase for consistency
	return strings.ToLower(s)
}
