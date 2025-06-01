package services

import (
	"regexp"
	"strings"
)

// UtilityService provides common utility functions
type UtilityService struct{}

// NewUtilityService creates a new utility service
func NewUtilityService() *UtilityService {
	return &UtilityService{}
}

// SanitizeString sanitizes a string for use in filenames
// by removing or replacing special characters
func SanitizeString(s string) string {
	// Replace spaces with underscores
	s = strings.ReplaceAll(s, " ", "_")

	// Replace slashes with hyphens
	s = strings.ReplaceAll(s, "/", "-")
	s = strings.ReplaceAll(s, "\\", "-")

	// Remove other special characters
	reg := regexp.MustCompile(`[^\w\-]`)
	s = reg.ReplaceAllString(s, "")

	// Convert to lowercase for consistency
	s = strings.ToLower(s)

	return s
}
