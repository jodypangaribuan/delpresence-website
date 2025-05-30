package campus

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/delpresence/backend/internal/auth"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/gin-gonic/gin"
)

var (
	// ErrInvalidToken is returned when token is invalid
	ErrInvalidToken = errors.New("invalid campus token")
)

// CampusTokenClaims represents claims extracted from a campus token
type CampusTokenClaims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// ValidateCampusToken validates a token against the campus server
// The campus server must have an endpoint that validates tokens
func ValidateCampusToken(token string) (*CampusTokenClaims, error) {
	// If the campus server doesn't have a token validation endpoint,
	// we can try to decode the token directly since JWT tokens are self-contained

	// For JWT tokens that we can't validate properly (because we don't have the secret),
	// we can at least extract the payload which contains user information
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, ErrInvalidToken
	}

	// The payload is the second part
	payload := parts[1]

	// Add padding if needed
	if len(payload)%4 != 0 {
		payload += strings.Repeat("=", 4-len(payload)%4)
	}

	// Base64 decode
	jsonPayload, err := base64Decode(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to decode payload: %w", err)
	}

	// Log the full payload for debugging
	log.Printf("Decoded JWT payload: %s", string(jsonPayload))

	// Try multiple possible formats to find user information

	// First try the format seen in logs with uid field
	var uidClaims struct {
		UID      interface{} `json:"uid"`
		Username string      `json:"username"`
		Role     string      `json:"role"`
	}

	if err := json.Unmarshal(jsonPayload, &uidClaims); err == nil && uidClaims.UID != nil {
		userID := extractUserID(uidClaims.UID)

		// If we found a UID but no username/role, we need to query our database
		// to get the correct role instead of defaulting to "Dosen"
		role := fetchUserRoleFromDatabase(userID)

		return &CampusTokenClaims{
			UserID:   userID,
			Username: uidClaims.Username,
			Role:     role,
		}, nil
	}

	// Try standard format
	var claims struct {
		UserID   interface{} `json:"user_id"`
		Username string      `json:"username"`
		Role     string      `json:"role"`
	}

	if err := json.Unmarshal(jsonPayload, &claims); err == nil && (claims.UserID != nil || claims.Username != "") {
		// Convert UserID to uint
		userID := extractUserID(claims.UserID)

		return &CampusTokenClaims{
			UserID:   userID,
			Username: claims.Username,
			Role:     claims.Role,
		}, nil
	}

	// Try alternative format with sub field
	var altClaims struct {
		Sub      interface{} `json:"sub"`
		Username string      `json:"preferred_username"`
		Role     string      `json:"role"`
	}

	if err := json.Unmarshal(jsonPayload, &altClaims); err == nil && (altClaims.Sub != nil || altClaims.Username != "") {
		userID := extractUserID(altClaims.Sub)

		return &CampusTokenClaims{
			UserID:   userID,
			Username: altClaims.Username,
			Role:     altClaims.Role,
		}, nil
	}

	// Try format with user object
	var userObjClaims struct {
		User struct {
			ID       interface{} `json:"id"`
			UserID   interface{} `json:"user_id"`
			Username string      `json:"username"`
			Role     string      `json:"role"`
		} `json:"user"`
	}

	if err := json.Unmarshal(jsonPayload, &userObjClaims); err == nil &&
		(userObjClaims.User.ID != nil || userObjClaims.User.UserID != nil || userObjClaims.User.Username != "") {
		var userID uint
		if userObjClaims.User.UserID != nil {
			userID = extractUserID(userObjClaims.User.UserID)
		} else {
			userID = extractUserID(userObjClaims.User.ID)
		}

		return &CampusTokenClaims{
			UserID:   userID,
			Username: userObjClaims.User.Username,
			Role:     userObjClaims.User.Role,
		}, nil
	}

	// Generic approach as last resort
	var genericMap map[string]interface{}
	if err := json.Unmarshal(jsonPayload, &genericMap); err == nil {
		// Log the full map structure
		log.Printf("Token payload as map: %+v", genericMap)

		userID := uint(0)
		username := ""
		role := "" // Don't default to Dosen, we'll fetch from the database

		// Check for uid field first (as seen in logs)
		if uid, ok := genericMap["uid"]; ok {
			userID = extractUserID(uid)
		} else if id, ok := genericMap["user_id"]; ok {
			userID = extractUserID(id)
		} else if id, ok := genericMap["sub"]; ok {
			userID = extractUserID(id)
		}

		if u, ok := genericMap["username"].(string); ok {
			username = u
		} else if u, ok := genericMap["preferred_username"].(string); ok {
			username = u
		}

		if r, ok := genericMap["role"].(string); ok {
			role = r
		} else if userID > 0 {
			// If no role in token but we have a userID, fetch from database
			role = fetchUserRoleFromDatabase(userID)
		}

		if userID > 0 {
			return &CampusTokenClaims{
				UserID:   userID,
				Username: username,
				Role:     role,
			}, nil
		}
	}

	// If we couldn't extract user information, return an error
	return nil, fmt.Errorf("could not find user information in token payload")
}

// extractUserID converts various ID formats to uint
func extractUserID(id interface{}) uint {
	if id == nil {
		return 0
	}

	switch v := id.(type) {
	case float64:
		return uint(v)
	case float32:
		return uint(v)
	case int:
		return uint(v)
	case int64:
		return uint(v)
	case int32:
		return uint(v)
	case uint:
		return v
	case uint64:
		return uint(v)
	case uint32:
		return uint(v)
	case string:
		var intID int
		if _, err := fmt.Sscanf(v, "%d", &intID); err == nil {
			return uint(intID)
		}
	}

	return 0
}

// base64Decode decodes a base64 string with URL encoding
func base64Decode(s string) ([]byte, error) {
	// Replace URL encoding characters
	s = strings.ReplaceAll(s, "-", "+")
	s = strings.ReplaceAll(s, "_", "/")

	return base64.StdEncoding.DecodeString(s)
}

// CampusAuthMiddleware ensures the request has a valid JWT token from either system
func CampusAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		path := c.Request.URL.Path

		// Add debug log
		log.Printf("Processing request for path: %s", path)

		// Check if the header exists and has the correct format
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required and must be a Bearer token"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// First try to validate with internal system
		internalClaims, err := auth.ValidateToken(tokenString)
		if err == nil {
			// Internal token is valid
			c.Set("userID", internalClaims.UserID)
			c.Set("username", internalClaims.Username)
			c.Set("role", internalClaims.Role)

			// Add debug log
			log.Printf("Internal token validation successful for user ID: %v, username: %s, role: %s",
				internalClaims.UserID, internalClaims.Username, internalClaims.Role)

			c.Next()
			return
		}

		// If internal validation failed, try campus token validation
		log.Printf("Internal token validation failed: %v, trying campus token validation", err)
		campusClaims, err := ValidateCampusToken(tokenString)
		if err != nil {
			log.Printf("Campus token validation failed: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Make sure we have a valid userID
		if campusClaims.UserID == 0 {
			log.Printf("Could not extract userID from campus token")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: could not extract user ID"})
			c.Abort()
			return
		}

		// Set basic user info
		c.Set("userID", campusClaims.UserID)

		// Set username (use userID as string if not available)
		username := campusClaims.Username
		if username == "" {
			username = fmt.Sprintf("user_%d", campusClaims.UserID)
		}
		c.Set("username", username)

		// Determine role from path and token
		role := campusClaims.Role

		// Add debug log for role detection
		log.Printf("Initial role from token: %s", role)

		// If role is empty, infer from the URL path
		if role == "" {
			if strings.Contains(path, "/api/lecturer/") {
				role = "Dosen"
				log.Printf("Setting role to Dosen based on path: %s", path)
			} else if strings.Contains(path, "/api/employee/") {
				role = "Pegawai"
				log.Printf("Setting role to Pegawai based on path: %s", path)
			} else if strings.Contains(path, "/api/student/") {
				role = "Mahasiswa"
				log.Printf("Setting role to Mahasiswa based on path: %s", path)
			} else if strings.Contains(path, "/api/assistant/") {
				role = "Asisten Dosen"
				log.Printf("Setting role to Asisten Dosen based on path: %s", path)
			} else {
				// Default to "Guest" for unknown paths
				role = "Guest"
				log.Printf("Setting role to Guest for unknown path: %s", path)
			}
		}

		c.Set("role", role)

		// Log the context info
		log.Printf("Set context for request: userID=%v, username=%s, role=%s, path=%s",
			campusClaims.UserID, username, role, path)

		c.Next()
	}
}

// fetchUserRoleFromDatabase fetches the user's role from the database based on user ID
func fetchUserRoleFromDatabase(userID uint) string {
	// Create a new user repository
	userRepo := repositories.NewUserRepository()

	// Try to find user by external ID
	user, err := userRepo.FindByExternalUserID(int(userID))
	if err != nil {
		log.Printf("Error finding user with ID %d: %v", userID, err)
		return ""
	}

	if user == nil {
		log.Printf("User with ID %d not found in database", userID)
		return ""
	}

	log.Printf("Found user with role: %s for user ID: %d", user.Role, userID)
	return user.Role
}
