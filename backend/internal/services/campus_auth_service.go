package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/delpresence/backend/internal/models"
)

const (
	CampusAuthURL       = "https://cis-dev.del.ac.id/api/jwt-api/do-auth"
	tokenExpirationTime = 45 * time.Minute // Tokens typically expire after 50 minutes, let's refresh a bit earlier
)

// CampusAuthService handles authentication with the campus system
type CampusAuthService struct {
	username    string
	password    string
	token       string
	tokenExpiry time.Time
	mutex       sync.Mutex
}

// NewCampusAuthService creates a new CampusAuthService
func NewCampusAuthService() *CampusAuthService {
	// Get credentials from environment variables with fallbacks
	username := os.Getenv("CAMPUS_API_USERNAME")
	password := os.Getenv("CAMPUS_API_PASSWORD")

	// If not in env, use defaults (for development only, should be set in production)
	if username == "" {
		username = "johannes"
	}
	if password == "" {
		password = "Del@2022"
	}

	return &CampusAuthService{
		username: username,
		password: password,
	}
}

// GetToken returns a valid token, authenticating if necessary
func (s *CampusAuthService) GetToken() (string, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// If we have a valid token that's not about to expire, return it
	if s.token != "" && time.Now().Before(s.tokenExpiry) {
		return s.token, nil
	}

	// Otherwise, authenticate and get a new token
	return s.authenticate()
}

// authenticate logs in to the campus API and gets a new token
func (s *CampusAuthService) authenticate() (string, error) {
	log.Printf("Attempting to authenticate with campus API using username: %s", s.username)
	
	// Try different authentication methods in sequence
	token, err := s.authenticateWithMultipartForm()
	if err != nil {
		log.Printf("Multipart form authentication failed: %v. Trying JSON auth...", err)
		token, err = s.authenticateWithJSON()
		if err != nil {
			log.Printf("JSON authentication failed: %v. Trying URL encoded form...", err)
			token, err = s.authenticateWithURLEncodedForm()
			if err != nil {
				log.Printf("All authentication methods failed")
				return "", fmt.Errorf("all authentication methods failed, last error: %w", err)
			}
		}
	}
	
	return token, nil
}

// authenticateWithMultipartForm tries to authenticate using multipart/form-data
func (s *CampusAuthService) authenticateWithMultipartForm() (string, error) {
	// Create a multipart form body
	var requestBody bytes.Buffer
	multipartWriter := multipart.NewWriter(&requestBody)
	
	// Add username field
	usernameField, err := multipartWriter.CreateFormField("username")
	if err != nil {
		return "", fmt.Errorf("error creating username field: %w", err)
	}
	_, err = usernameField.Write([]byte(s.username))
	if err != nil {
		return "", fmt.Errorf("error writing username: %w", err)
	}
	
	// Add password field
	passwordField, err := multipartWriter.CreateFormField("password")
	if err != nil {
		return "", fmt.Errorf("error creating password field: %w", err)
	}
	_, err = passwordField.Write([]byte(s.password))
	if err != nil {
		return "", fmt.Errorf("error writing password: %w", err)
	}
	
	// Close the multipart writer
	err = multipartWriter.Close()
	if err != nil {
		return "", fmt.Errorf("error closing multipart writer: %w", err)
	}
	
	// Try primary URL
	token, err := s.sendAuthRequest(CampusAuthURL, &requestBody, multipartWriter.FormDataContentType())
	if err != nil && (strings.Contains(err.Error(), "no route to host") || 
		strings.Contains(err.Error(), "connection refused") ||
		strings.Contains(err.Error(), "i/o timeout")) {
		// Try alternative URL
		alternativeURL := "http://cis.del.ac.id/api/jwt-api/do-auth"
		log.Printf("Primary URL failed, trying alternative URL (multipart form): %s", alternativeURL)
		
		// Reset request body and recreate form
		requestBody.Reset()
		multipartWriter = multipart.NewWriter(&requestBody)
		
		// Add username field
		usernameField, err = multipartWriter.CreateFormField("username")
		if err != nil {
			return "", fmt.Errorf("error creating username field: %w", err)
		}
		_, err = usernameField.Write([]byte(s.username))
		if err != nil {
			return "", fmt.Errorf("error writing username: %w", err)
		}
		
		// Add password field
		passwordField, err = multipartWriter.CreateFormField("password")
		if err != nil {
			return "", fmt.Errorf("error creating password field: %w", err)
		}
		_, err = passwordField.Write([]byte(s.password))
		if err != nil {
			return "", fmt.Errorf("error writing password: %w", err)
		}
		
		// Close the multipart writer
		err = multipartWriter.Close()
		if err != nil {
			return "", fmt.Errorf("error closing multipart writer: %w", err)
		}
		
		return s.sendAuthRequest(alternativeURL, &requestBody, multipartWriter.FormDataContentType())
	}
	
	return token, err
}

// authenticateWithJSON tries to authenticate using JSON
func (s *CampusAuthService) authenticateWithJSON() (string, error) {
	// Create JSON payload
	payload := map[string]string{
		"username": s.username,
		"password": s.password,
	}
	
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("error creating JSON payload: %w", err)
	}
	
	// Try primary URL
	token, err := s.sendAuthRequest(CampusAuthURL, bytes.NewBuffer(payloadBytes), "application/json")
	if err != nil && (strings.Contains(err.Error(), "no route to host") || 
		strings.Contains(err.Error(), "connection refused") ||
		strings.Contains(err.Error(), "i/o timeout")) {
		// Try alternative URL
		alternativeURL := "http://cis.del.ac.id/api/jwt-api/do-auth"
		log.Printf("Primary URL failed, trying alternative URL (JSON): %s", alternativeURL)
		return s.sendAuthRequest(alternativeURL, bytes.NewBuffer(payloadBytes), "application/json")
	}
	
	return token, err
}

// authenticateWithURLEncodedForm tries to authenticate using application/x-www-form-urlencoded
func (s *CampusAuthService) authenticateWithURLEncodedForm() (string, error) {
	// Create form data
	formData := fmt.Sprintf("username=%s&password=%s", s.username, s.password)
	
	// Try primary URL
	token, err := s.sendAuthRequest(CampusAuthURL, bytes.NewBufferString(formData), "application/x-www-form-urlencoded")
	if err != nil && (strings.Contains(err.Error(), "no route to host") || 
		strings.Contains(err.Error(), "connection refused") ||
		strings.Contains(err.Error(), "i/o timeout")) {
		// Try alternative URL
		alternativeURL := "http://cis.del.ac.id/api/jwt-api/do-auth"
		log.Printf("Primary URL failed, trying alternative URL (URL encoded form): %s", alternativeURL)
		return s.sendAuthRequest(alternativeURL, bytes.NewBufferString(formData), "application/x-www-form-urlencoded")
	}
	
	return token, err
}

// sendAuthRequest sends an authentication request with the given content
func (s *CampusAuthService) sendAuthRequest(url string, body io.Reader, contentType string) (string, error) {
	// Create request
	log.Printf("Making request to URL: %s with Content-Type: %s", url, contentType)
	req, err := http.NewRequest("POST", url, body)
	if err != nil {
		return "", fmt.Errorf("error creating request: %w", err)
	}
	
	// Set Content-Type header
	req.Header.Set("Content-Type", contentType)
	
	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error connecting to URL %s: %v", url, err)
		return "", fmt.Errorf("error sending request to %s: %w", url, err)
	}
	defer resp.Body.Close()
	
	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Authentication failed with status code: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return "", fmt.Errorf("authentication failed with status code: %d, response: %s", resp.StatusCode, string(bodyBytes))
	}
	
	// Parse response
	var authResp models.CampusLoginResponse
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body: %v", err)
		return "", fmt.Errorf("error reading response body: %w", err)
	}
	
	log.Printf("Received response from campus API: %s", string(bodyBytes))
	
	err = json.Unmarshal(bodyBytes, &authResp)
	if err != nil {
		log.Printf("Error parsing response: %v, raw response: %s", err, string(bodyBytes))
		return "", fmt.Errorf("error parsing response (JSON Unmarshal error): %w, raw response: %s", err, string(bodyBytes))
	}
	
	// Check if result is successful
	if !authResp.Result {
		log.Printf("Authentication failed: %s", authResp.Error)
		return "", fmt.Errorf("authentication failed: %s", authResp.Error)
	}
	
	log.Printf("Authentication successful, token received")
	
	// Save token and set expiry
	s.token = authResp.Token
	s.tokenExpiry = time.Now().Add(tokenExpirationTime)
	
	return s.token, nil
}

// RefreshToken force refreshes the token even if it's not expired
func (s *CampusAuthService) RefreshToken() (string, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	// Clear current token
	s.token = ""
	
	// Get new token
	return s.authenticate()
} 