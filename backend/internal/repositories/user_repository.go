package repositories

import (
	"errors"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// UserRepository handles database operations for users
type UserRepository struct {
	DB *gorm.DB
}

// NewUserRepository creates a new UserRepository
func NewUserRepository() *UserRepository {
	return &UserRepository{
		DB: database.DB,
	}
}

// FindByUsername finds a user by username
func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	result := r.DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil when user not found
		}
		return nil, result.Error
	}
	return &user, nil
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	result := r.DB.First(&user, id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &user, nil
}

// FindByExternalUserID finds a user by external user ID
func (r *UserRepository) FindByExternalUserID(externalUserID int) (*models.User, error) {
	var user models.User
	result := r.DB.Where("external_user_id = ?", externalUserID).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil when user not found
		}
		return nil, result.Error
	}
	return &user, nil
}

// Create creates a new user
func (r *UserRepository) Create(user *models.User) error {
	return r.DB.Create(user).Error
}

// Update updates an existing user
func (r *UserRepository) Update(user *models.User) error {
	return r.DB.Save(user).Error
}

// Delete deletes a user
func (r *UserRepository) Delete(id uint) error {
	return r.DB.Delete(&models.User{}, id).Error
}

// CountByUsername counts users with a specific username
func (r *UserRepository) CountByUsername(username string) (int64, error) {
	var count int64
	result := r.DB.Model(&models.User{}).Where("username = ?", username).Count(&count)
	return count, result.Error
} 