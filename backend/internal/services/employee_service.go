package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

const (
	CampusEmployeesURL = "https://cis.del.ac.id/api/library-api/pegawai"
)

// EmployeeService handles business logic for employees
type EmployeeService struct {
	repo       *repositories.EmployeeRepository
	campusAuth *CampusAuthService
}

// NewEmployeeService creates a new employee service
func NewEmployeeService() *EmployeeService {
	return &EmployeeService{
		repo:       repositories.NewEmployeeRepository(),
		campusAuth: NewCampusAuthService(),
	}
}

// GetAllEmployees returns all employees
func (s *EmployeeService) GetAllEmployees() ([]models.Employee, error) {
	return s.repo.FindAll()
}

// GetEmployeeByID returns an employee by ID
func (s *EmployeeService) GetEmployeeByID(id uint) (*models.Employee, error) {
	return s.repo.FindByID(id)
}

// SyncEmployees synchronizes employees with the campus API
func (s *EmployeeService) SyncEmployees() (int, error) {
	// Get auth token from campus auth service
	token, err := s.campusAuth.GetToken()
	if err != nil {
		return 0, fmt.Errorf("failed to get authentication token: %w", err)
	}

	// Fetch employees from campus API
	employeeData, err := s.fetchEmployeesFromCampus(token)
	if err != nil {
		return 0, err
	}

	// Convert to internal model
	employees := make([]models.Employee, 0, len(employeeData))
	for _, empData := range employeeData {
		// Handle email formatting
		email := empData.Email
		if email == "-" {
			email = ""
		}

		// Convert UserID from interface{} to int
		var userID int
		switch v := empData.UserID.(type) {
		case int:
			userID = v
		case float64:
			userID = int(v)
		case string:
			// Try to parse string to int
			var convErr error
			userID, convErr = strconv.Atoi(v)
			if convErr != nil {
				userID = 0 // Default value if conversion fails
			}
		default:
			userID = 0 // Default value for unknown types
		}

		// Convert PegawaiID from interface{} to int
		var pegawaiID int
		switch v := empData.PegawaiID.(type) {
		case int:
			pegawaiID = v
		case float64:
			pegawaiID = int(v)
		case string:
			// Try to parse string to int
			var convErr error
			pegawaiID, convErr = strconv.Atoi(v)
			if convErr != nil {
				pegawaiID = 0 // Default value if conversion fails
			}
		default:
			pegawaiID = 0 // Default value for unknown types
		}

		employee := models.Employee{
			EmployeeID:     pegawaiID,
			UserID:         userID,
			NIP:            empData.NIP,
			FullName:       empData.Nama,
			Email:          email,
			Position:       empData.Posisi,
			Department:     "", // Not available in the response
			EmploymentType: empData.StatusPegawai,
			LastSync:       time.Now(),
		}
		employees = append(employees, employee)
	}

	// Save employees to database
	if err := s.repo.UpsertMany(employees); err != nil {
		return 0, err
	}

	return len(employees), nil
}

// fetchEmployeesFromCampus fetches employees from the campus API
func (s *EmployeeService) fetchEmployeesFromCampus(token string) ([]models.CampusEmployee, error) {
	// Create a new HTTP request
	req, err := http.NewRequest("GET", CampusEmployeesURL, nil)
	if err != nil {
		return nil, err
	}

	// Add authorization header
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))

	// Set timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Send the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Check response status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Campus API returned status code %d", resp.StatusCode)
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Parse response based on datapegawai.json format
	var response struct {
		Result string `json:"result"`
		Data   struct {
			Pegawai []models.CampusEmployee `json:"pegawai"`
		} `json:"data"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse API response: %w", err)
	}

	return response.Data.Pegawai, nil
} 