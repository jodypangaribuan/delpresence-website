package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// CampusLogin handles login requests for campus users (all roles)
func CampusLogin(c *gin.Context) {
	var req models.CampusLoginRequest

	// Bind form data
	if err := c.ShouldBind(&req); err != nil {
		log.Printf("Error binding request data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request format",
		})
		return
	}

	log.Printf("Campus login attempt for username: %s", req.Username)

	// Call campus login service
	campusResponse, err := auth.CampusLogin(req.Username, req.Password)
	if err != nil {
		statusCode := http.StatusInternalServerError
		message := "Authentication failed"

		// Handle specific error types
		if errors.Is(err, auth.ErrCampusAuthFailed) {
			statusCode = http.StatusUnauthorized
			message = "Campus authentication failed"
		}

		log.Printf("Campus login failed: %v", err)

		// Return a properly formatted error response
		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	log.Printf("Campus login successful for user: %s with role: %s", campusResponse.User.Username, campusResponse.User.Role)

	// Convert to standard login response
	loginResponse := auth.ConvertCampusResponseToLoginResponse(campusResponse)
	log.Printf("Converted to login response with user role: %s", loginResponse.User.Role)
	
	// Debug logging to help diagnose token structure issues
	log.Printf("Response token length: %d, refresh token length: %d", 
		len(loginResponse.Token), len(loginResponse.RefreshToken))

	// Use custom response struct to ensure the correct field order
	orderedResponse := models.OrderedLoginResponse{
		User:         loginResponse.User,
		Token:        loginResponse.Token,
		RefreshToken: loginResponse.RefreshToken,
	}
	
	// Set content type
	c.Header("Content-Type", "application/json")
	
	// Manually marshal to JSON to ensure field order
	jsonBytes, err := json.Marshal(orderedResponse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generating response"})
		return
	}
	
	// Write the response
	c.Writer.WriteHeader(http.StatusOK)
	c.Writer.Write(jsonBytes)
}
