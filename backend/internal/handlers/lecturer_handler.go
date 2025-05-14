package handlers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// LecturerHandler handles lecturer-related requests
type LecturerHandler struct {
	service *services.LecturerService
}

// NewLecturerHandler creates a new LecturerHandler
func NewLecturerHandler() *LecturerHandler {
	return &LecturerHandler{
		service: services.NewLecturerService(),
	}
}

// GetAllLecturers returns all lecturers
func (h *LecturerHandler) GetAllLecturers(c *gin.Context) {
	lecturers, err := h.service.GetAllLecturers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get lecturers"})
		return
	}

	// Transform the data to include the study program name as a string
	type LecturerResponse struct {
		ID               uint      `json:"id"`
		EmployeeID       int       `json:"employee_id"`
		LecturerID       int       `json:"lecturer_id"`
		NIP              string    `json:"nip"`
		FullName         string    `json:"full_name"`
		Email            string    `json:"email"`
		StudyProgramID   uint      `json:"study_program_id"`
		StudyProgram     string    `json:"study_program"` // String field for frontend
		AcademicRank     string    `json:"academic_rank"`
		AcademicRankDesc string    `json:"academic_rank_desc"`
		EducationLevel   string    `json:"education_level"`
		NIDN             string    `json:"nidn"`
		UserID           int       `json:"user_id"`
		LastSync         time.Time `json:"last_sync"`
		CreatedAt        time.Time `json:"created_at"`
		UpdatedAt        time.Time `json:"updated_at"`
	}

	// Map the lecturers to the response structure
	response := make([]LecturerResponse, len(lecturers))
	for i, lecturer := range lecturers {
		response[i] = LecturerResponse{
			ID:               lecturer.ID,
			EmployeeID:       lecturer.EmployeeID,
			LecturerID:       lecturer.LecturerID,
			NIP:              lecturer.NIP,
			FullName:         lecturer.FullName,
			Email:            lecturer.Email,
			StudyProgramID:   lecturer.StudyProgramID,
			StudyProgram:     lecturer.StudyProgramName, // Use the direct field
			AcademicRank:     lecturer.AcademicRank,
			AcademicRankDesc: lecturer.AcademicRankDesc,
			EducationLevel:   lecturer.EducationLevel,
			NIDN:             lecturer.NIDN,
			UserID:           lecturer.UserID,
			LastSync:         lecturer.LastSync,
			CreatedAt:        lecturer.CreatedAt,
			UpdatedAt:        lecturer.UpdatedAt,
		}
		
		// If StudyProgramName is empty but we have a study program object, use its name as fallback
		if response[i].StudyProgram == "" && lecturer.StudyProgram != nil {
			response[i].StudyProgram = lecturer.StudyProgram.Name
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// GetLecturerByID returns a lecturer by ID
func (h *LecturerHandler) GetLecturerByID(c *gin.Context) {
	// Parse ID from URL
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	// Get lecturer
	lecturer, err := h.service.GetLecturerByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get lecturer"})
		return
	}

	if lecturer == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Lecturer not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": lecturer})
}

// SyncLecturers syncs lecturers from the campus API
func (h *LecturerHandler) SyncLecturers(c *gin.Context) {
	// Sync lecturers using the service (which now handles authentication internally)
	count, err := h.service.SyncLecturers()
	if err != nil {
		// Determine a more specific error message and status code
		statusCode := http.StatusInternalServerError
		errorMsg := err.Error()
		
		// Check for authentication errors
		if strings.Contains(errorMsg, "authentication failed") || 
		   strings.Contains(errorMsg, "token") {
			statusCode = http.StatusUnauthorized
			errorMsg = "Failed to authenticate with campus API: " + errorMsg
		} else if strings.Contains(errorMsg, "network error") || 
		          strings.Contains(errorMsg, "timeout") {
			errorMsg = "Network error when connecting to campus API: " + errorMsg
		} else if strings.Contains(errorMsg, "unmarshal") || 
		          strings.Contains(errorMsg, "parse") {
			errorMsg = "Error processing campus API response: " + errorMsg
		}
		
		c.JSON(statusCode, gin.H{"error": errorMsg})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lecturers synced successfully",
		"count":   count,
	})
}

// SearchLecturers searches for lecturers by name, nidn, or other criteria
func (h *LecturerHandler) SearchLecturers(c *gin.Context) {
	// Get query parameter for search - support both 'query' (new) and 'q' (old) for backward compatibility
	searchQuery := c.Query("query")
	
	// If the new parameter is empty, try the old one
	if searchQuery == "" {
		searchQuery = c.Query("q")
	}
	
	if searchQuery == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status": "error", 
			"message": "Search query is required",
		})
		return
	}

	// Search lecturers
	lecturers, err := h.service.SearchLecturers(searchQuery)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status": "error",
			"message": "Failed to search lecturers: " + err.Error(),
		})
		return
	}

	// Transform the results to a simplified format for the dropdown
	type LecturerOption struct {
		ID       uint   `json:"id"`
		UserID   int    `json:"user_id"` // Include UserID from lecturer table
		FullName string `json:"full_name"`
		NIP      string `json:"nip"`      // Include NIP which is mapped to n_ip in DB
		NIDN     string `json:"nidn"`     // NIDN is mapped to n_id_n in DB
		Program  string `json:"program"`
		Email    string `json:"email,omitempty"` // Include email if available
	}

	options := make([]LecturerOption, len(lecturers))
	for i, lecturer := range lecturers {
		options[i] = LecturerOption{
			ID:       lecturer.ID,
			UserID:   lecturer.UserID, // Include UserID in the response
			FullName: lecturer.FullName,
			NIP:      lecturer.NIP,
			NIDN:     lecturer.NIDN,
			Program:  lecturer.StudyProgramName,
			Email:    lecturer.Email,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data": options,
	})
} 