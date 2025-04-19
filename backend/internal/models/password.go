package models

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
)

// Argon2 parameters
const (
	// KeyLength is the length of the generated key in bytes
	KeyLength = 32
	// SaltLength is the length of the salt in bytes
	SaltLength = 16
	// Time specifies the number of iterations
	Time = 3
	// Memory specifies the memory size in KiB
	Memory = 64 * 1024
	// Threads specifies the number of threads to use
	Threads = 4
	// The algorithm version
	Version = argon2.Version
)

// A list of errors returned from this package
var (
	ErrInvalidHash         = errors.New("the encoded hash is not in the correct format")
	ErrIncompatibleVersion = errors.New("incompatible version of argon2")
	ErrMismatchedHash      = errors.New("passwords do not match")
)

// HashPasswordArgon2 returns a hash of the password using Argon2id
func HashPasswordArgon2(password string) (string, error) {
	// Generate a cryptographically secure random salt
	salt := make([]byte, SaltLength)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// Hash the password with Argon2id
	hash := argon2.IDKey([]byte(password), salt, Time, Memory, Threads, KeyLength)

	// Format the hash to include all parameters
	encodedHash := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		Version, Memory, Time, Threads,
		base64.RawStdEncoding.EncodeToString(salt),
		base64.RawStdEncoding.EncodeToString(hash))

	return encodedHash, nil
}

// VerifyPasswordArgon2 compares a password with an Argon2id hash
func VerifyPasswordArgon2(password, encodedHash string) (bool, error) {
	// Extract the parameters, salt and key from the encoded hash
	vals := strings.Split(encodedHash, "$")
	if len(vals) != 6 {
		return false, ErrInvalidHash
	}

	var version int
	_, err := fmt.Sscanf(vals[2], "v=%d", &version)
	if err != nil {
		return false, err
	}
	if version != Version {
		return false, ErrIncompatibleVersion
	}

	var memory, iterations, parallelism int
	_, err = fmt.Sscanf(vals[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
	if err != nil {
		return false, err
	}

	salt, err := base64.RawStdEncoding.DecodeString(vals[4])
	if err != nil {
		return false, err
	}

	decodedHash, err := base64.RawStdEncoding.DecodeString(vals[5])
	if err != nil {
		return false, err
	}

	// Compute the hash of the password with the same parameters
	keyToCheck := argon2.IDKey([]byte(password), salt, uint32(iterations), uint32(memory), uint8(parallelism), uint32(len(decodedHash)))

	// Check that the contents of the hashed passwords are identical. Note
	// that we are using the subtle.ConstantTimeCompare() function for this
	// to help prevent timing attacks.
	return subtle.ConstantTimeCompare(decodedHash, keyToCheck) == 1, nil
}

// HashPassword is a compatibility function that uses Argon2id
// It can be used as a drop-in replacement for the bcrypt-based HashPassword
func HashPassword(password string) (string, error) {
	return HashPasswordArgon2(password)
}

// CheckPasswordHash is a compatibility function that uses Argon2id
// It can be used as a drop-in replacement for the bcrypt-based CheckPasswordHash
func CheckPasswordHash(password, hash string) bool {
	// Check if this is an Argon2id hash
	if strings.HasPrefix(hash, "$argon2id$") {
		match, err := VerifyPasswordArgon2(password, hash)
		if err != nil {
			return false
		}
		return match
	}

	// Fallback to bcrypt for backward compatibility with existing passwords
	err := bcryptCompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// bcryptCompareHashAndPassword is a wrapper around bcrypt for backward compatibility
func bcryptCompareHashAndPassword(hash []byte, password []byte) error {
	return bcrypt.CompareHashAndPassword(hash, password)
} 