package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"log"
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
)

// CampusLogin handles authentication with the campus API for all roles
// This includes students, lecturers, and employees
func CampusLogin(username, password string) (*models.CampusLoginResponse, error) {
	log.Printf("Attempting campus login for username: %s", username)

	// Create a buffer to write form data
	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	// Add username field
	usernameField, err := writer.CreateFormField("username")
	if err != nil {
		log.Printf("Error creating username field: %v", err)
		return nil, err
	}
	_, err = usernameField.Write([]byte(username))
	if err != nil {
		log.Printf("Error writing username: %v", err)
		return nil, err
	}

	// Add password field
	passwordField, err := writer.CreateFormField("password")
	if err != nil {
		log.Printf("Error creating password field: %v", err)
		return nil, err
	}
	_, err = passwordField.Write([]byte(password))
	if err != nil {
		log.Printf("Error writing password: %v", err)
		return nil, err
	}

	// Close the multipart writer
	err = writer.Close()
	if err != nil {
		log.Printf("Error closing multipart writer: %v", err)
		return nil, err
	}

	// Create HTTP request
	request, err := http.NewRequest("POST", CampusAuthURL, &requestBody)
	if err != nil {
		log.Printf("Error creating HTTP request: %v", err)
		return nil, err
	}

	// Set content type
	request.Header.Set("Content-Type", writer.FormDataContentType())
	log.Printf("Making request to URL: %s", CampusAuthURL)

	// Send request
	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		log.Printf("Error sending request: %v", err)
		return nil, err
	}
	defer response.Body.Close()

	// Check response status code
	log.Printf("Received response with status code: %d", response.StatusCode)
	if response.StatusCode != http.StatusOK {
		log.Printf("Status code is not OK: %d", response.StatusCode)
		return nil, ErrCampusAuthFailed
	}

	// Parse response
	var loginResponse models.CampusLoginResponse
	err = json.NewDecoder(response.Body).Decode(&loginResponse)
	if err != nil {
		log.Printf("Error decoding response: %v", err)
		return nil, err
	}

	// Check if login was successful
	log.Printf("Login result: %v, Role: %s", loginResponse.Result, loginResponse.User.Role)
	if !loginResponse.Result {
		log.Printf("Login failed with error: %s", loginResponse.Error)
		return nil, errors.New(loginResponse.Error)
	}

	// Save or update user in our database
	err = SaveCampusUserToDatabase(&loginResponse, password)
	if err != nil {
		log.Printf("Error saving user to database: %v", err)
		return nil, err
	}

	log.Printf("Campus login successful for user: %s, role: %s", loginResponse.User.Username, loginResponse.User.Role)
	return &loginResponse, nil
}

// SaveCampusUserToDatabase creates or updates a user record for a campus user
func SaveCampusUserToDatabase(campusResponse *models.CampusLoginResponse, password string) error {
	// Initialize user repository if needed
	if UserRepository == nil {
		log.Printf("Initializing UserRepository")
		UserRepository = repositories.NewUserRepository()
	}

	// Check if a user with this external ID already exists
	externalUserID := campusResponse.User.UserID
	log.Printf("Checking if user with external ID %d exists", externalUserID)
	existingUser, err := UserRepository.FindByExternalUserID(externalUserID)
	if err != nil {
		log.Printf("Error finding user by external ID: %v", err)
		return err
	}

	if existingUser != nil {
		log.Printf("User already exists in database, no need to create")
		return nil
	}

	// Create a new user - password will be hashed by the BeforeSave hook
	log.Printf("Creating new user record for %s with role %s", campusResponse.User.Username, campusResponse.User.Role)
	hashedPassword, err := models.HashPassword(password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return err
	}

	newUser := models.User{
		Username:       campusResponse.User.Username,
		Password:       hashedPassword,
		Role:           campusResponse.User.Role,
		ExternalUserID: &externalUserID,
	}

	// Save the user
	log.Printf("Saving new user to database")
	err = UserRepository.Create(&newUser)
	if err != nil {
		log.Printf("Error creating user: %v", err)
		return err
	}

	log.Printf("User created successfully")
	return nil
}

// ConvertCampusResponseToLoginResponse converts campus login response to standard login response
func ConvertCampusResponseToLoginResponse(campusResponse *models.CampusLoginResponse) *models.LoginResponse {
	// Initialize user repository if needed
	if UserRepository == nil {
		log.Printf("Initializing UserRepository")
		UserRepository = repositories.NewUserRepository()
	}

	// Get the user from our database
	externalUserID := campusResponse.User.UserID
	log.Printf("Looking up user with external ID %d", externalUserID)
	user, err := UserRepository.FindByExternalUserID(externalUserID)
	if err != nil {
		log.Printf("Error finding user: %v", err)
	}

	// If user doesn't exist in our database, use the campus user info
	if user == nil {
		log.Printf("User not found in database, creating temporary user object")
		// Create default user object from campus user
		user = &models.User{
			Username: campusResponse.User.Username,
			Role:     campusResponse.User.Role,
		}
	}

	log.Printf("Converted campus user to login response with role: %s", user.Role)
	
	// Return login response - ensure token and refreshToken are correctly set
	// This is critical for frontend compatibility
	return &models.LoginResponse{
		Token:        campusResponse.Token,        // JWT token for authorization
		RefreshToken: campusResponse.RefreshToken, // Refresh token for obtaining new JWT
		User:         *user,
	}
}
