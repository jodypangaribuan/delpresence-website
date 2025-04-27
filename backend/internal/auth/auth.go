package auth

import (
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
	"github.com/dgrijalva/jwt-go"
)

var (
	// ErrInvalidCredentials is returned when credentials are invalid
	ErrInvalidCredentials = errors.New("invalid credentials")

	// ErrUserNotFound is returned when user is not found
	ErrUserNotFound = errors.New("user not found")

	// ErrInvalidToken is returned when token is invalid
	ErrInvalidToken = errors.New("invalid token")
)

// UserRepository is the repository for user operations
var UserRepository *repositories.UserRepository

// Initialize initializes the auth service
func Initialize() {
	UserRepository = repositories.NewUserRepository()
}

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.StandardClaims
}

// GenerateTokens generates a JWT token and refresh token
func GenerateTokens(user models.User) (string, string, error) {
	// Get JWT secret key from environment
	jwtKey := []byte(os.Getenv("JWT_SECRET"))

	// Create token expiration time (12 hours)
	tokenExpirationTime := time.Now().Add(12 * time.Hour)

	// Create refresh token expiration time (7 days)
	refreshExpirationTime := time.Now().Add(7 * 24 * time.Hour)

	// Create the JWT claims
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: tokenExpirationTime.Unix(),
		},
	}

	// Create the refresh token claims
	refreshClaims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: refreshExpirationTime.Unix(),
		},
	}

	// Create the JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		return "", "", err
	}

	// Create the refresh token
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(jwtKey)
	if err != nil {
		return "", "", err
	}

	return tokenString, refreshTokenString, nil
}

// ValidateToken validates a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	// Get JWT secret key from environment
	jwtKey := []byte(os.Getenv("JWT_SECRET"))

	// Parse the JWT token
	token, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtKey, nil
		},
	)

	if err != nil {
		return nil, err
	}

	// Extract the claims
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

// Login authenticates a user and returns user data with JWT tokens
func Login(username, password string) (*models.LoginResponse, error) {
	// Find user by username
	user, err := UserRepository.FindByUsername(username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	// Check if password is correct
	if !models.CheckPasswordHash(password, user.Password) {
		return nil, ErrInvalidCredentials
	}

	// Generate JWT tokens
	token, refreshToken, err := GenerateTokens(*user)
	if err != nil {
		return nil, err
	}

	// Return login response
	return &models.LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}

// CreateAdminUser creates the admin user if it doesn't exist
func CreateAdminUser() error {
	// Check if admin user exists
	count, err := UserRepository.CountByUsername("admin")
	if err != nil {
		return err
	}

	// If admin user exists, return
	if count > 0 {
		return nil
	}

	// Create admin user
	adminUser := models.User{
		Username: "admin",
		Password: "delpresence", // Will be hashed by BeforeSave hook
		Role:     "Admin",
	}

	// Insert admin user
	err = UserRepository.Create(&adminUser)
	if err != nil {
		return err
	}

	log.Println("Admin user created successfully")
	return nil
}

// RefreshToken refreshes a JWT token using a refresh token
func RefreshToken(refreshTokenString string) (*models.LoginResponse, error) {
	// Validate the refresh token
	claims, err := ValidateToken(refreshTokenString)
	if err != nil {
		return nil, err
	}

	// Get user from database
	user, err := UserRepository.FindByID(claims.UserID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrUserNotFound
	}

	// Generate new JWT tokens
	token, refreshToken, err := GenerateTokens(*user)
	if err != nil {
		return nil, err
	}

	// Return login response
	return &models.LoginResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}
