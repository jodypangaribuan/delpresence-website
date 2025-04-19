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
	CampusAuthURL = "https://cis.del.ac.id/api/jwt-api/do-auth"
)

var (
	// ErrCampusAuthFailed is returned when campus authentication fails
	ErrCampusAuthFailed = errors.New("campus authentication failed")
	
	// ErrInvalidRole is returned when the user has an invalid role
	ErrInvalidRole = errors.New("invalid role: only Dosen and Asisten Dosen are allowed")
)

// CampusLogin handles authentication with the campus API
func CampusLogin(username, password string) (*models.CampusLoginResponse, error) {
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
	request, err := http.NewRequest("POST", CampusAuthURL, &requestBody)
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
		return nil, ErrCampusAuthFailed
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
	
	// Verify user role (only allow Dosen and Asisten Dosen)
	if loginResponse.User.Role != "Dosen" && loginResponse.User.Role != "Asisten Dosen" {
		return nil, ErrInvalidRole
	}

	// Save or update user in our database
	err = SaveCampusUserToDatabase(&loginResponse, password)
	if err != nil {
		return nil, err
	}
	
	return &loginResponse, nil
}

// SaveCampusUserToDatabase creates or updates a user record for a campus user
func SaveCampusUserToDatabase(campusResponse *models.CampusLoginResponse, password string) error {
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

	// Create a new user - password will be hashed by the BeforeSave hook
	hashedPassword, err := models.HashPassword(password)
	if err != nil {
		return err
	}

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

	return nil
}

// ConvertCampusResponseToLoginResponse converts campus login response to standard login response
func ConvertCampusResponseToLoginResponse(campusResponse *models.CampusLoginResponse) *models.LoginResponse {
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