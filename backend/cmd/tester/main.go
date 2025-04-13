package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

const (
	AuthURL       = "https://cis-dev.del.ac.id/api/jwt-api/do-auth"
	LecturersURL  = "https://cis.del.ac.id/api/library-api/dosen"
	OutputFile    = "lecturer_response.json"
)

// Simple Auth Response struct
type AuthResponse struct {
	Result       bool        `json:"result"`
	Error        string      `json:"error"`
	Success      string      `json:"success"`
	User         interface{} `json:"user"`
	Token        string      `json:"token"`
	RefreshToken string      `json:"refresh_token"`
}

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// Get credentials from environment
	username := os.Getenv("CAMPUS_API_USERNAME")
	password := os.Getenv("CAMPUS_API_PASSWORD")

	if username == "" || password == "" {
		log.Fatalf("Username or password not set in environment variables")
	}

	fmt.Printf("Testing API with username: %s\n", username)

	// Get auth token
	token, err := authenticate(username, password)
	if err != nil {
		log.Fatalf("Authentication failed: %v", err)
	}

	fmt.Printf("Authentication successful, token received\n")

	// Fetch lecturers
	err = fetchLecturers(token)
	if err != nil {
		log.Fatalf("Failed to fetch lecturers: %v", err)
	}

	fmt.Printf("Successfully fetched and saved lecturer data to %s\n", OutputFile)
}

// authenticate tries to get a token using different methods
func authenticate(username, password string) (string, error) {
	// Try different authentication methods
	fmt.Println("Trying JSON authentication...")
	token, err := authenticateWithJSON(username, password)
	if err != nil {
		fmt.Printf("JSON authentication failed: %v\n", err)
		
		fmt.Println("Trying form-data authentication...")
		token, err = authenticateWithFormData(username, password)
		if err != nil {
			fmt.Printf("Form-data authentication failed: %v\n", err)
			return "", fmt.Errorf("all authentication methods failed")
		}
	}
	return token, nil
}

// authenticateWithJSON tries to authenticate using JSON
func authenticateWithJSON(username, password string) (string, error) {
	// Create JSON payload
	payload := map[string]string{
		"username": username,
		"password": password,
	}
	
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("error creating JSON payload: %w", err)
	}
	
	// Create request
	req, err := http.NewRequest("POST", AuthURL, bytes.NewReader(payloadBytes))
	if err != nil {
		return "", fmt.Errorf("error creating request: %w", err)
	}
	
	// Set Content-Type header
	req.Header.Set("Content-Type", "application/json")
	
	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()
	
	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("authentication failed with status code: %d, response: %s", 
			resp.StatusCode, string(bodyBytes))
	}
	
	// Parse response
	var authResp AuthResponse
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %w", err)
	}
	
	fmt.Printf("Received response: %s\n", string(bodyBytes))
	
	err = json.Unmarshal(bodyBytes, &authResp)
	if err != nil {
		return "", fmt.Errorf("error parsing response: %w", err)
	}
	
	// Check if result is successful
	if !authResp.Result {
		return "", fmt.Errorf("authentication failed: %s", authResp.Error)
	}
	
	return authResp.Token, nil
}

// authenticateWithFormData tries to authenticate using form-data
func authenticateWithFormData(username, password string) (string, error) {
	// Create form data
	formData := fmt.Sprintf("username=%s&password=%s", username, password)
	
	// Create request
	req, err := http.NewRequest("POST", AuthURL, strings.NewReader(formData))
	if err != nil {
		return "", fmt.Errorf("error creating request: %w", err)
	}
	
	// Set Content-Type header
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	
	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()
	
	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("authentication failed with status code: %d, response: %s", 
			resp.StatusCode, string(bodyBytes))
	}
	
	// Parse response
	var authResp AuthResponse
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %w", err)
	}
	
	fmt.Printf("Received response: %s\n", string(bodyBytes))
	
	err = json.Unmarshal(bodyBytes, &authResp)
	if err != nil {
		return "", fmt.Errorf("error parsing response: %w", err)
	}
	
	// Check if result is successful
	if !authResp.Result {
		return "", fmt.Errorf("authentication failed: %s", authResp.Error)
	}
	
	return authResp.Token, nil
}

// fetchLecturers fetches lecturer data from the campus API
func fetchLecturers(token string) error {
	// Create request
	req, err := http.NewRequest("GET", LecturersURL, nil)
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}
	
	// Add authorization header
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token))
	
	// Send request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()
	
	// Check response status
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to fetch lecturers with status code: %d, response: %s", 
			resp.StatusCode, string(bodyBytes))
	}
	
	// Read response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading response body: %w", err)
	}
	
	// Save raw response to a file for inspection
	err = os.WriteFile(OutputFile, bodyBytes, 0644)
	if err != nil {
		return fmt.Errorf("error saving response to file: %w", err)
	}
	
	// Print response preview
	previewLen := 200
	if len(bodyBytes) < previewLen {
		previewLen = len(bodyBytes)
	}
	fmt.Printf("Response preview: %s\n", string(bodyBytes[:previewLen]))
	
	// Try to parse as generic JSON to check structure
	var responseMap map[string]interface{}
	err = json.Unmarshal(bodyBytes, &responseMap)
	if err != nil {
		return fmt.Errorf("error parsing response as JSON: %w", err)
	}
	
	// Check for data.dosen structure
	data, ok := responseMap["data"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("unexpected response structure, no 'data' field found")
	}
	
	dosen, ok := data["dosen"].([]interface{})
	if !ok {
		return fmt.Errorf("unexpected response structure, no 'dosen' array field found in data")
	}
	
	fmt.Printf("Found %d lecturers in response\n", len(dosen))
	
	// If we have lecturers, examine the first one
	if len(dosen) > 0 {
		lecturer := dosen[0].(map[string]interface{})
		fmt.Println("\nFirst lecturer data structure:")
		for key, value := range lecturer {
			fmt.Printf("  %s: %T = %v\n", key, value, value)
		}
		
		// Specifically check the prodi_id field
		prodiID, exists := lecturer["prodi_id"]
		if exists {
			fmt.Printf("\nProdi ID type: %T, value: %v\n", prodiID, prodiID)
		} else {
			fmt.Println("\nProdi ID field not found in lecturer data")
		}
	}
	
	return nil
} 