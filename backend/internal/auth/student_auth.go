package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

const (
	StudentAuthURL = "https://cis.del.ac.id/api/jwt-api/do-auth"
)

var (
	// ErrStudentAuthFailed is returned when student authentication fails
	ErrStudentAuthFailed = errors.New("student authentication failed")
	
	// ErrNotAStudent is returned when the user is not a student
	ErrNotAStudent = errors.New("invalid role: only Mahasiswa is allowed")

	// StudentRepository handles database operations for students
	StudentRepository *repositories.StudentRepository
)

// InitializeStudentAuth initializes the student auth service
func InitializeStudentAuth() {
	if StudentRepository == nil {
		StudentRepository = repositories.NewStudentRepository()
	}
}

// StudentLogin handles authentication with the campus API for students
func StudentLogin(username, password string) (*models.CampusLoginResponse, error) {
	// Create a buffer to write form data
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)
	
	// Add username field
	usernameField, err := writer.CreateFormField("username")
	if err != nil {
		return nil, err
	}
	_, err = usernameField.Write([]byte(username))
	if err != nil {
		return nil, err
	}
	
	// Add password field
	passwordField, err := writer.CreateFormField("password")
	if err != nil {
		return nil, err
	}
	_, err = passwordField.Write([]byte(password))
	if err != nil {
		return nil, err
	}
	
	// Close the multipart writer
	err = writer.Close()
	if err != nil {
		return nil, err
	}
	
	// Create HTTP request
	request, err := http.NewRequest("POST", StudentAuthURL, &requestBody)
	if err != nil {
		return nil, err
	}
	
	// Set content type
	request.Header.Set("Content-Type", writer.FormDataContentType())
	
	// Send request
	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	
	// Check response status code
	if response.StatusCode != http.StatusOK {
		return nil, ErrStudentAuthFailed
	}
	
	// Parse response
	var loginResponse models.CampusLoginResponse
	err = json.NewDecoder(response.Body).Decode(&loginResponse)
	if err != nil {
		return nil, err
	}
	
	// Check if login was successful
	if !loginResponse.Result {
		return nil, errors.New(loginResponse.Error)
	}
	
	// Verify user role (only allow Mahasiswa)
	if loginResponse.User.Role != "Mahasiswa" {
		return nil, ErrNotAStudent
	}

	// Save or update user in our database
	err = SaveStudentToDatabase(&loginResponse, password)
	if err != nil {
		return nil, err
	}
	
	return &loginResponse, nil
}

// SaveStudentToDatabase creates or updates a user record for a student
func SaveStudentToDatabase(campusResponse *models.CampusLoginResponse, password string) error {
	// Initialize user repository if needed
	if UserRepository == nil {
		UserRepository = repositories.NewUserRepository()
	}

	// Check if a user with this external ID already exists
	externalUserID := campusResponse.User.UserID
	existingUser, err := UserRepository.FindByExternalUserID(externalUserID)
	if err != nil {
		return err
	}

	if existingUser != nil {
		// User exists, no need to update
		return nil
	}

	// Hash password
	hashedPassword, err := models.HashPassword(password)
	if err != nil {
		return err
	}

	// Create a new user with hashed password
	newUser := models.User{
		Username:       campusResponse.User.Username,
		Password:       hashedPassword,
		Role:           campusResponse.User.Role,
		ExternalUserID: &externalUserID,
	}

	// Save the user
	err = UserRepository.Create(&newUser)
	if err != nil {
		return err
	}

	// Now check if we have this student in our students table
	if StudentRepository == nil {
		StudentRepository = repositories.NewStudentRepository()
	}

	student, err := StudentRepository.FindByUserID(externalUserID)
	if err != nil {
		return err
	}

	// If we don't have the student details yet, we can attempt to fetch them
	// This could be handled as a separate task or synchronization process
	if student == nil {
		// For now, we just log that student info is not available
		// In a real implementation, you might want to trigger a sync here
	}

	return nil
}

// ConvertStudentResponseToLoginResponse converts campus login response to standard login response for students
func ConvertStudentResponseToLoginResponse(campusResponse *models.CampusLoginResponse) *models.LoginResponse {
	// Initialize user repository if needed
	if UserRepository == nil {
		UserRepository = repositories.NewUserRepository()
	}

	// Get the user from our database
	externalUserID := campusResponse.User.UserID
	user, _ := UserRepository.FindByExternalUserID(externalUserID)

	// If user doesn't exist in our database, use the campus user info
	if user == nil {
		// Create default user object from campus user
		user = &models.User{
			Username: campusResponse.User.Username,
			Role:     campusResponse.User.Role,
		}
	}
	
	// Return login response
	return &models.LoginResponse{
		Token:        campusResponse.Token,
		RefreshToken: campusResponse.RefreshToken,
		User:         *user,
	}
} 