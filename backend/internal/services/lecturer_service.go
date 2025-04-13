package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

const (
	CampusLecturersURL = "https://cis.del.ac.id/api/library-api/dosen"
)

// LecturerService handles lecturer operations
type LecturerService struct {
	repository   *repositories.LecturerRepository
	campusAuth   *CampusAuthService
}

// NewLecturerService creates a new LecturerService
func NewLecturerService() *LecturerService {
	return &LecturerService{
		repository: repositories.NewLecturerRepository(),
		campusAuth: NewCampusAuthService(),
	}
}

// GetAllLecturers returns all lecturers from the database
func (s *LecturerService) GetAllLecturers() ([]models.Lecturer, error) {
	return s.repository.FindAll()
}

// GetLecturerByID returns a lecturer by ID
func (s *LecturerService) GetLecturerByID(id uint) (*models.Lecturer, error) {
	return s.repository.FindByID(id)
}

// SyncLecturers fetches lecturers from the campus API and syncs them to the database
func (s *LecturerService) SyncLecturers() (int, error) {
	// Get auth token from campus auth service
	token, err := s.campusAuth.GetToken()
	if err != nil {
		return 0, fmt.Errorf("failed to get authentication token: %w", err)
	}

	// Fetch lecturers from campus API
	campusLecturers, err := s.fetchLecturersFromCampus(token)
	if err != nil {
		// Try refreshing token once if there's an error
		if strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "403") {
			token, errRefresh := s.campusAuth.RefreshToken()
			if errRefresh != nil {
				return 0, fmt.Errorf("failed to refresh authentication token: %w", errRefresh)
			}
			campusLecturers, err = s.fetchLecturersFromCampus(token)
			if err != nil {
				return 0, err
			}
		} else {
			return 0, err
		}
	}

	// Convert to our model
	lecturers := make([]models.Lecturer, 0, len(campusLecturers))
	for _, cl := range campusLecturers {
		// Get first email if multiple
		email := cl.Email
		if strings.Contains(email, ",") {
			email = strings.Split(email, ",")[0]
			email = strings.TrimSpace(email)
		}

		// Helper function to convert interface to int
		convertToInt := func(val interface{}) int {
			if val == nil {
				return 0
			}
			
			switch v := val.(type) {
			case int:
				return v
			case float64:
				return int(v)
			case string:
				intVal, err := strconv.Atoi(v)
				if err != nil {
					log.Printf("Warning: could not convert string '%s' to int, using 0", v)
					return 0
				}
				return intVal
			default:
				log.Printf("Warning: unexpected type for integer field: %T, using 0", val)
				return 0
			}
		}
		
		// Convert ProdiID to string regardless of its original type
		var prodiIDStr string
		switch v := cl.ProdiID.(type) {
		case string:
			prodiIDStr = v
		case int:
			prodiIDStr = fmt.Sprintf("%d", v)
		case float64:
			prodiIDStr = fmt.Sprintf("%.0f", v)
		default:
			// If it's some other type, convert to JSON and then to string
			if cl.ProdiID != nil {
				prodiIDBytes, _ := json.Marshal(cl.ProdiID)
				prodiIDStr = string(prodiIDBytes)
				// Remove quotes if it's a JSON string
				prodiIDStr = strings.Trim(prodiIDStr, "\"")
			}
		}

		lecturer := models.Lecturer{
			EmployeeID:       convertToInt(cl.PegawaiID),
			LecturerID:       convertToInt(cl.DosenID),
			NIP:              cl.NIP,
			FullName:         cl.Nama,
			Email:            email,
			StudyProgramID:   prodiIDStr,
			StudyProgram:     cl.Prodi,
			AcademicRank:     cl.JabatanAkademik,
			AcademicRankDesc: cl.JabatanAkademikDesc,
			EducationLevel:   cl.JenjangPendidikan,
			NIDN:             cl.NIDN,
			UserID:           convertToInt(cl.UserID),
			LastSync:         time.Now(),
		}
		lecturers = append(lecturers, lecturer)
	}

	// Save to database
	err = s.repository.UpsertMany(lecturers)
	if err != nil {
		return 0, err
	}

	return len(lecturers), nil
}

// fetchLecturersFromCampus fetches lecturers from the campus API
func (s *LecturerService) fetchLecturersFromCampus(token string) ([]models.CampusLecturer, error) {
	log.Printf("Fetching lecturers from campus API: %s", CampusLecturersURL)
	
	// Create request to campus API
	req, err := http.NewRequest("GET", CampusLecturersURL, nil)
	if err != nil {
		return nil, err
	}

	// Add authorization header
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	// Send request
	client := &http.Client{Timeout: 15 * time.Second}
	log.Printf("Sending request to campus API with token")
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Network error when fetching lecturers: %v", err)
		return nil, fmt.Errorf("network error when fetching lecturers: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to fetch lecturers from campus API with status code: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to fetch lecturers from campus API with status code: %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	// Read the response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	log.Printf("Received response from campus API, length: %d bytes", len(bodyBytes))
	
	// For debugging, log a small portion of the response
	previewLen := 200
	if len(bodyBytes) < previewLen {
		previewLen = len(bodyBytes)
	}
	log.Printf("Response preview: %s", string(bodyBytes[:previewLen]))

	// Parse response
	var campusResp models.CampusLecturerResponse
	err = json.Unmarshal(bodyBytes, &campusResp)
	if err != nil {
		log.Printf("Failed to parse campus API response: %v, raw response length: %d", err, len(bodyBytes))
		log.Printf("First 500 characters of response: %s", string(bodyBytes[:min(500, len(bodyBytes))]))
		return nil, fmt.Errorf("failed to parse campus API response: %w, raw response: %s", err, string(bodyBytes))
	}

	// Check if result is OK
	if campusResp.Result != "Ok" {
		log.Printf("Campus API returned an error: %s", campusResp.Result)
		return nil, fmt.Errorf("campus API returned an error: %s", campusResp.Result)
	}

	// Check if we have lecturers
	if len(campusResp.Data.Lecturers) == 0 {
		log.Printf("No lecturers found in campus API response")
		return nil, errors.New("no lecturers found in campus API response")
	}

	log.Printf("Successfully fetched %d lecturers from campus API", len(campusResp.Data.Lecturers))
	return campusResp.Data.Lecturers, nil
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
} 