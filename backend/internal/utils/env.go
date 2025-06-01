package utils

import "os"

// GetEnv retrieves an environment variable value or returns a default if not set
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
