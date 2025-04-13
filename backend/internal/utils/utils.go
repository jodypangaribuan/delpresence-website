package utils

import (
	"log"
	"os"
	"strconv"
)

// GetEnvWithDefault gets an environment variable or returns a default value
func GetEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetEnvAsInt gets an environment variable as an integer or returns a default value
func GetEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		log.Printf("Failed to convert %s to int, using default: %d", key, defaultValue)
		return defaultValue
	}
	return value
}

// GetEnvAsBool gets an environment variable as a boolean or returns a default value
func GetEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		log.Printf("Failed to convert %s to bool, using default: %t", key, defaultValue)
		return defaultValue
	}
	return value
} 