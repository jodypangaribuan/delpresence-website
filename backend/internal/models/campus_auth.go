package models

// CampusPosition represents a position/role in the campus system
type CampusPosition struct {
	StrukturJabatanID int    `json:"struktur_jabatan_id"`
	Jabatan           string `json:"jabatan"`
}

// CampusUser represents a user in the campus system
type CampusUser struct {
	UserID   int              `json:"user_id"`
	Username string           `json:"username"`
	Email    string           `json:"email"`
	Role     string           `json:"role"`
	Status   int              `json:"status"`
	Jabatan  []CampusPosition `json:"jabatan"`
}

// CampusLoginRequest represents the campus login request
type CampusLoginRequest struct {
	Username string `form:"username" binding:"required"`
	Password string `form:"password" binding:"required"`
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