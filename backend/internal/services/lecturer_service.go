package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
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
	repository *repositories.LecturerRepository
}

// NewLecturerService creates a new LecturerService
func NewLecturerService() *LecturerService {
	return &LecturerService{
		repository: repositories.NewLecturerRepository(),
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
func (s *LecturerService) SyncLecturers(token string) (int, error) {
	// Fetch lecturers from campus API
	campusLecturers, err := s.fetchLecturersFromCampus(token)
	if err != nil {
		return 0, err
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

		lecturer := models.Lecturer{
			EmployeeID:       cl.PegawaiID,
			LecturerID:       cl.DosenID,
			NIP:              cl.NIP,
			FullName:         cl.Nama,
			Email:            email,
			StudyProgramID:   cl.ProdiID,
			StudyProgram:     cl.Prodi,
			AcademicRank:     cl.JabatanAkademik,
			AcademicRankDesc: cl.JabatanAkademikDesc,
			EducationLevel:   cl.JenjangPendidikan,
			NIDN:             cl.NIDN,
			UserID:           cl.UserID,
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
	// Create request to campus API
	req, err := http.NewRequest("GET", CampusLecturersURL, nil)
	if err != nil {
		return nil, err
	}

	// Add authorization header
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check response status
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("failed to fetch lecturers from campus API")
	}

	// Parse response
	var campusResp models.CampusLecturerResponse
	err = json.NewDecoder(resp.Body).Decode(&campusResp)
	if err != nil {
		return nil, err
	}

	// Check if result is OK
	if campusResp.Result != "Ok" {
		return nil, errors.New("campus API returned an error")
	}

	return campusResp.Data.Lecturers, nil
} 