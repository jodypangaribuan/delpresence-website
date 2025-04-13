package handlers

import (
	"errors"
	"net/http"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// CampusLogin handles login requests for campus users (lecturers and assistants)
func CampusLogin(c *gin.Context) {
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

	// Call campus login service
	campusResponse, err := auth.CampusLogin(req.Username, req.Password)
	if err != nil {
		statusCode := http.StatusInternalServerError
		message := "Authentication failed"

		// Handle specific error types
		switch {
		case errors.Is(err, auth.ErrCampusAuthFailed):
			statusCode = http.StatusUnauthorized
			message = "Campus authentication failed"
		case errors.Is(err, auth.ErrInvalidRole):
			statusCode = http.StatusForbidden
			message = "Only lecturers and assistants are allowed"
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

	// Return the campus login response directly
	c.JSON(http.StatusOK, campusResponse)
} 