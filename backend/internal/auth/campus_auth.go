package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"mime/multipart"
	"net/http"

	"github.com/delpresence/backend/internal/models"
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
	
	return &loginResponse, nil
}

// ConvertCampusResponseToLoginResponse converts campus login response to standard login response
func ConvertCampusResponseToLoginResponse(campusResponse *models.CampusLoginResponse) *models.LoginResponse {
	// Create user object from campus user
	user := models.User{
		ID:       uint(campusResponse.User.UserID),
		Username: campusResponse.User.Username,
		Role:     campusResponse.User.Role,
	}
	
	// Return login response
	return &models.LoginResponse{
		Token:        campusResponse.Token,
		RefreshToken: campusResponse.RefreshToken,
		User:         user,
	}
} 