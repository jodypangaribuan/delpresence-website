package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// Login handles the login request
func Login(c *gin.Context) {
	var req models.LoginRequest

	// Validate the request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Attempt to login
	response, err := auth.Login(req.Username, req.Password)
	if err != nil {
		var statusCode int
		var message string

		// Handle different error types
		switch {
		case errors.Is(err, auth.ErrUserNotFound), errors.Is(err, auth.ErrInvalidCredentials):
			statusCode = http.StatusUnauthorized
			message = "Invalid username or password"
		default:
			statusCode = http.StatusInternalServerError
			message = "An error occurred during login"
		}

		c.JSON(statusCode, gin.H{"error": message})
		return
	}

	// Use custom response struct to ensure the correct field order
	orderedResponse := models.OrderedLoginResponse{
		User:         response.User,
		Token:        response.Token,
		RefreshToken: response.RefreshToken,
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

// RefreshToken handles token refresh requests
func RefreshToken(c *gin.Context) {
	var req models.RefreshRequest

	// Validate the request body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Attempt to refresh the token
	response, err := auth.RefreshToken(req.RefreshToken)
	if err != nil {
		var statusCode int
		var message string

		// Handle different error types
		switch {
		case errors.Is(err, auth.ErrInvalidToken):
			statusCode = http.StatusUnauthorized
			message = "Invalid or expired refresh token"
		case errors.Is(err, auth.ErrUserNotFound):
			statusCode = http.StatusUnauthorized
			message = "User not found"
		default:
			statusCode = http.StatusInternalServerError
			message = "An error occurred during token refresh"
		}

		c.JSON(statusCode, gin.H{"error": message})
		return
	}

	// Use custom response struct to ensure the correct field order
	orderedResponse := models.OrderedLoginResponse{
		User:         response.User,
		Token:        response.Token,
		RefreshToken: response.RefreshToken,
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

// GetCurrentUser returns the currently logged-in user
func GetCurrentUser(c *gin.Context) {
	// Get the user ID from the context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in token"})
		return
	}

	// Get the username from the context
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username not found in token"})
		return
	}

	// Get the role from the context
	role, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Role not found in token"})
		return
	}

	// Return the user data
	c.JSON(http.StatusOK, gin.H{
		"id":       userID,
		"username": username,
		"role":     role,
	})
} 