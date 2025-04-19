package handlers

import (
	"errors"
	"net/http"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// StudentLogin handles login requests for students
func StudentLogin(c *gin.Context) {
	var req models.CampusLoginRequest

	// Bind form data
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"result": false, 
			"error": "Invalid request format", 
			"success": "",
		})
		return
	}

	// Call student login service
	campusResponse, err := auth.StudentLogin(req.Username, req.Password)
	if err != nil {
		statusCode := http.StatusInternalServerError
		message := "Authentication failed"

		// Handle specific error types
		switch {
		case errors.Is(err, auth.ErrStudentAuthFailed):
			statusCode = http.StatusUnauthorized
			message = "Campus authentication failed"
		case errors.Is(err, auth.ErrNotAStudent):
			statusCode = http.StatusForbidden
			message = "Only students are allowed"
		}

		// Return a properly formatted response even on error
		c.JSON(statusCode, gin.H{
			"result": false,
			"error": message,
			"success": "",
			"user": nil,
			"token": "",
			"refresh_token": "",
		})
		return
	}

	// Convert to standard login response
	loginResponse := auth.ConvertStudentResponseToLoginResponse(campusResponse)

	// Return the campus login response directly
	c.JSON(http.StatusOK, gin.H{
		"result": true,
		"error": "",
		"success": "Login successful",
		"user": loginResponse.User,
		"token": loginResponse.Token,
		"refresh_token": loginResponse.RefreshToken,
	})
} 