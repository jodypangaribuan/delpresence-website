package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

const (
	CampusStudentsURL = "https://cis.del.ac.id/api/library-api/mahasiswa?status=aktif"
)

// StudentService provides functionality for managing students
type StudentService struct {
	repository *repositories.StudentRepository
	campusAuth *CampusAuthService
}

// NewStudentService creates a new student service
func NewStudentService() *StudentService {
	return &StudentService{
		repository: repositories.NewStudentRepository(),
		campusAuth: NewCampusAuthService(),
	}
}

// GetAllStudents returns all students from the database
func (s *StudentService) GetAllStudents() ([]models.Student, error) {
	return s.repository.FindAll()
}

// GetStudentByID returns a student by ID
func (s *StudentService) GetStudentByID(id uint) (*models.Student, error) {
	return s.repository.FindByID(id)
}

// GetStudentByUserID returns a student by their external UserID from campus
func (s *StudentService) GetStudentByUserID(userID int) (*models.Student, error) {
	return s.repository.FindByUserID(userID)
}

// SyncStudents fetches students from the campus API and syncs them to the database
func (s *StudentService) SyncStudents() (int, error) {
	// Get auth token from campus auth service
	token, err := s.campusAuth.GetToken()
	if err != nil {
		return 0, fmt.Errorf("failed to get authentication token: %w", err)
	}

	// Fetch students from campus API
	campusStudents, err := s.fetchStudentsFromCampus(token)
	if err != nil {
		// Try refreshing token once if there's an error
		if strings.Contains(err.Error(), "401") || strings.Contains(err.Error(), "403") {
			token, errRefresh := s.campusAuth.RefreshToken()
			if errRefresh != nil {
				return 0, fmt.Errorf("failed to refresh authentication token: %w", errRefresh)
			}
			campusStudents, err = s.fetchStudentsFromCampus(token)
			if err != nil {
				return 0, err
			}
		} else {
			return 0, err
		}
	}

	// Convert to our model
	students := make([]models.Student, 0, len(campusStudents))
	for _, cs := range campusStudents {
		student := models.Student{
			DimID:          cs.DimID,
			UserID:         cs.UserID,
			UserName:       cs.UserName,
			NIM:            cs.NIM,
			FullName:       cs.Nama,
			Email:          cs.Email,
			StudyProgramID: cs.ProdiID,
			StudyProgram:   cs.ProdiName,
			Faculty:        cs.Fakultas,
			YearEnrolled:   cs.Angkatan,
			Status:         cs.Status,
			Dormitory:      cs.Asrama,
			LastSync:       time.Now(),
		}
		students = append(students, student)
	}

	// Save to database
	err = s.repository.UpsertMany(students)
	if err != nil {
		return 0, err
	}

	return len(students), nil
}

// fetchStudentsFromCampus fetches students from the campus API
func (s *StudentService) fetchStudentsFromCampus(token string) ([]models.CampusStudent, error) {
	log.Printf("Fetching students from campus API: %s", CampusStudentsURL)

	// Create request to campus API
	req, err := http.NewRequest("GET", CampusStudentsURL, nil)
	if err != nil {
		return nil, err
	}

	// Add authorization header
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	// Send request with increased timeout (2 minutes)
	client := &http.Client{Timeout: 120 * time.Second}
	log.Printf("Sending request to campus API with token (timeout: 2 minutes)")

	// Execute request with context for better error handling
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	req = req.WithContext(ctx)

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Network error when fetching students: %v", err)

		// Check for specific timeout errors
		if os.IsTimeout(err) || strings.Contains(err.Error(), "timeout") || strings.Contains(err.Error(), "deadline exceeded") {
			return nil, fmt.Errorf("campus API request timed out after 120 seconds: %w", err)
		}

		return nil, fmt.Errorf("network error when fetching students: %w", err)
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to fetch students from campus API with status code: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to fetch students from campus API with status code: %d, response: %s", resp.StatusCode, string(bodyBytes))
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
	var campusResp models.CampusStudentResponse
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

	// Check if we have students
	if len(campusResp.Data.Students) == 0 {
		log.Printf("No students found in campus API response")
		return nil, errors.New("no students found in campus API response")
	}

	log.Printf("Successfully fetched %d students from campus API", len(campusResp.Data.Students))
	return campusResp.Data.Students, nil
}
