package models

import (
	"encoding/json"
	"log"
)

// CampusPosition represents a position/role in the campus system
type CampusPosition struct {
	StrukturJabatanID int    `json:"struktur_jabatan_id"`
	Jabatan           string `json:"jabatan"`
}

// CampusUser represents a user in the campus system
type CampusUser struct {
	UserID   int             `json:"user_id"`
	Username string          `json:"username"`
	Email    string          `json:"email"`
	Role     string          `json:"role"`
	Status   int             `json:"status"`
	Jabatan  json.RawMessage `json:"jabatan"` // Using RawMessage to handle different types
}

// GetJabatanPositions returns the jabatan as []CampusPosition if it's an array,
// or an empty array if it's a string or any other type
func (u *CampusUser) GetJabatanPositions() []CampusPosition {
	var positions []CampusPosition
	err := json.Unmarshal(u.Jabatan, &positions)
	if err != nil {
		// If not an array, it might be a string or something else - just return empty array
		log.Printf("Jabatan is not an array of positions: %v", err)
		return []CampusPosition{}
	}
	return positions
}

// GetJabatanString returns the jabatan as string if it's a string,
// or empty string if it's an array or any other type
func (u *CampusUser) GetJabatanString() string {
	var jabatanString string
	err := json.Unmarshal(u.Jabatan, &jabatanString)
	if err != nil {
		// If not a string, it might be an array or something else - just return empty string
		log.Printf("Jabatan is not a string: %v", err)
		return ""
	}
	return jabatanString
}

// CampusLoginRequest represents the campus login request
type CampusLoginRequest struct {
	Username string `form:"username" json:"username" binding:"required"`
	Password string `form:"password" json:"password" binding:"required"`
}

// CampusLoginResponse represents the response from the campus login API
type CampusLoginResponse struct {
	Result       bool       `json:"result"`
	Error        string     `json:"error"`
	Success      string     `json:"success"`
	User         CampusUser `json:"user"`
	Token        string     `json:"token"`
	RefreshToken string     `json:"refresh_token"`
}
