package middleware

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/delpresence/backend/internal/auth"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware ensures the request has a valid JWT token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")

		// Check if the header exists and has the correct format
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required and must be a Bearer token"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Validate the token
		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Store the claims in the context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RoleMiddleware ensures the user has the required role
func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the user role from the context
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found in token"})
			c.Abort()
			return
		}

		// Log the request info for debugging
		path := c.Request.URL.Path
		method := c.Request.Method
		userID, _ := c.Get("userID")
		username, _ := c.Get("username")

		// Convert role to string and normalize
		userRole := ""
		if roleStr, ok := role.(string); ok {
			userRole = strings.ToLower(roleStr)
		} else {
			userRole = strings.ToLower(fmt.Sprintf("%v", role))
		}

		// Log the role information
		log.Printf("RoleMiddleware check for path: %s %s - user: %v (%s), role: %s, required roles: %v",
			method, path, userID, username, userRole, roles)

		// Special handling for assistant variations
		if containsStringVariation(userRole, []string{"asisten", "dosen"}) {
			for _, r := range roles {
				// If any required role contains "asisten" or is for teaching assistants
				if strings.Contains(strings.ToLower(r), "asisten") {
					log.Printf("Role match (assistant special case): %s matches %s", userRole, r)
					c.Next()
					return
				}
			}
		}

		// Standard role check - case-insensitive comparison
		for _, r := range roles {
			if userRole == strings.ToLower(r) {
				log.Printf("Role match: %s matches %s", userRole, r)
				c.Next()
				return
			}
		}

		log.Printf("Role check failed: user role %s doesn't match any of %v", userRole, roles)
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to access this resource"})
		c.Abort()
	}
}

// containsStringVariation checks if the input string contains all the given parts in any order
func containsStringVariation(input string, parts []string) bool {
	inputLower := strings.ToLower(input)
	for _, part := range parts {
		if !strings.Contains(inputLower, strings.ToLower(part)) {
			return false
		}
	}
	return true
}
