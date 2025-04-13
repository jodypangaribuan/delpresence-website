package handlers

import (
	"net/http"

	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// CampusAuthHandler handles campus authentication related requests
type CampusAuthHandler struct {
	service *services.CampusAuthService
}

// NewCampusAuthHandler creates a new CampusAuthHandler
func NewCampusAuthHandler() *CampusAuthHandler {
	return &CampusAuthHandler{
		service: services.NewCampusAuthService(),
	}
}

// GetToken gets a token from the campus API
func (h *CampusAuthHandler) GetToken(c *gin.Context) {
	// Only allow admins to access this endpoint
	// This is a simple example, your actual implementation may vary
	// based on your authentication system
	if c.GetString("role") != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Get token
	token, err := h.service.GetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get token: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token retrieved successfully",
		"token":   token,
	})
}

// RefreshToken refreshes the token from the campus API
func (h *CampusAuthHandler) RefreshToken(c *gin.Context) {
	// Only allow admins to access this endpoint
	if c.GetString("role") != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Refresh token
	token, err := h.service.RefreshToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh token: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"token":   token,
	})
} 