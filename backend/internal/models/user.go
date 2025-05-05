package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	Username       string         `json:"username" gorm:"unique;not null;size:50"`
	Password       string         `json:"-" gorm:"not null;size:255"` // Password is not returned in JSON
	Role           string         `json:"role" gorm:"not null;size:20"`
	ExternalUserID *int           `json:"external_user_id" gorm:"uniqueIndex;comment:External user ID from campus system"` // External ID from campus system
	CreatedAt      time.Time      `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time      `json:"updated_at" gorm:"autoUpdateTime"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"` // Soft delete support
}

// TableName returns the table name for the User model
func (User) TableName() string {
	return "users"
}

// BeforeSave is a GORM hook that ensures the password is hashed before saving
// This now uses the Argon2id implementation from password.go
func (u *User) BeforeSave(tx *gorm.DB) error {
	// We don't need to hash the password again if it's already hashed
	// Argon2id hashes start with "$argon2id$" and bcrypt hashes start with "$2a$"
	if u.Password != "" && !isPasswordHashed(u.Password) {
		hashedPassword, err := HashPassword(u.Password)
		if err != nil {
			return err
		}
		u.Password = hashedPassword
	}
	return nil
}

// isPasswordHashed checks if the password is already hashed
func isPasswordHashed(password string) bool {
	// Check if password is already hashed with Argon2id
	if len(password) > 9 && password[:9] == "$argon2id$" {
		return true
	}
	// Check if password is already hashed with bcrypt
	if len(password) > 4 && password[:4] == "$2a$" {
		return true
	}
	return false
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response body
type LoginResponse struct {
	User         User   `json:"user"`
	Token        string `json:"token"`         // JWT token for authorization
	RefreshToken string `json:"refresh_token"` // Field name must match frontend expectations
}

// OrderedLoginResponse represents a login response with controlled field order
type OrderedLoginResponse struct {
	User         User   `json:"user"`
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
}

// RefreshRequest represents the refresh token request body
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
} 