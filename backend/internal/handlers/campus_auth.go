package handlers

import (
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
			"result":  false,
			"error":   "Invalid request format",
			"success": "",
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

		// Return a properly formatted response even on error
		c.JSON(statusCode, gin.H{
			"result":        false,
			"error":         message,
			"success":       "",
			"user":          nil,
			"token":         "",
			"refresh_token": "",
		})
		return
	}

	log.Printf("Campus login successful for user: %s with role: %s", campusResponse.User.Username, campusResponse.User.Role)

	// Convert to standard login response
	loginResponse := auth.ConvertCampusResponseToLoginResponse(campusResponse)
	log.Printf("Converted to login response with user role: %s", loginResponse.User.Role)

	// Return the login response with user data
	c.JSON(http.StatusOK, gin.H{
		"result":        true,
		"error":         "",
		"success":       "Login successful",
		"user":          loginResponse.User,
		"token":         loginResponse.Token,
		"refresh_token": loginResponse.RefreshToken,
	})
}
