package services

import (
	"errors"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

// BuildingService is a service for building operations
type BuildingService struct {
	repository *repositories.BuildingRepository
}

// NewBuildingService creates a new building service
func NewBuildingService() *BuildingService {
	return &BuildingService{
		repository: repositories.NewBuildingRepository(),
	}
}

// CreateBuilding creates a new building
func (s *BuildingService) CreateBuilding(building *models.Building) error {
	// Check if code exists (including soft-deleted)
	exists, err := s.repository.CheckCodeExists(building.Code, 0)
	if err != nil {
		return err
	}

	if exists {
		// Try to find a soft-deleted building with this code
		deletedBuilding, err := s.repository.FindDeletedByCode(building.Code)
		if err != nil {
			return err
		}

		if deletedBuilding != nil {
			// Restore the soft-deleted building with updated data
			deletedBuilding.Name = building.Name
			deletedBuilding.Floors = building.Floors
			deletedBuilding.Description = building.Description
			
			// Restore the building
			restoredBuilding, err := s.repository.RestoreByCode(building.Code)
			if err != nil {
				return err
			}
			
			// Update with new data
			restoredBuilding.Name = building.Name
			restoredBuilding.Floors = building.Floors
			restoredBuilding.Description = building.Description
			
			return s.repository.Update(restoredBuilding)
		}
		
		return errors.New("kode gedung sudah digunakan")
	}

	// Create building
	return s.repository.Create(building)
}

// UpdateBuilding updates an existing building
func (s *BuildingService) UpdateBuilding(building *models.Building) error {
	// Check if building exists
	existingBuilding, err := s.repository.FindByID(building.ID)
	if err != nil {
		return err
	}
	if existingBuilding == nil {
		return errors.New("gedung tidak ditemukan")
	}

	// If code is changed, check if new code already exists
	if building.Code != existingBuilding.Code {
		exists, err := s.repository.CheckCodeExists(building.Code, building.ID)
		if err != nil {
			return err
		}
		if exists {
			return errors.New("kode gedung sudah digunakan")
		}
	}

	// Update building
	return s.repository.Update(building)
}

// GetBuildingByID gets a building by ID
func (s *BuildingService) GetBuildingByID(id uint) (*models.Building, error) {
	return s.repository.FindByID(id)
}

// GetAllBuildings gets all buildings
func (s *BuildingService) GetAllBuildings() ([]models.Building, error) {
	return s.repository.FindAll()
}

// DeleteBuilding deletes a building
func (s *BuildingService) DeleteBuilding(id uint) error {
	// Check if building exists
	building, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if building == nil {
		return errors.New("gedung tidak ditemukan")
	}

	// Check if there are any associated rooms
	roomCount, err := s.repository.CountRooms(id)
	if err != nil {
		return err
	}
	if roomCount > 0 {
		return errors.New("tidak dapat menghapus gedung yang memiliki ruangan")
	}

	// Delete building (soft delete)
	return s.repository.DeleteByID(id)
}

// BuildingWithStats represents a building with additional statistics
type BuildingWithStats struct {
	Building  models.Building `json:"building"`
	RoomCount int64           `json:"room_count"`
}

// GetBuildingWithStats gets a building with its statistics
func (s *BuildingService) GetBuildingWithStats(id uint) (*BuildingWithStats, error) {
	// Get building
	building, err := s.repository.FindByID(id)
	if err != nil {
		return nil, err
	}
	if building == nil {
		return nil, errors.New("gedung tidak ditemukan")
	}

	// Count rooms
	roomCount, err := s.repository.CountRooms(id)
	if err != nil {
		return nil, err
	}

	// Return building with stats
	return &BuildingWithStats{
		Building:  *building,
		RoomCount: roomCount,
	}, nil
}

// GetAllBuildingsWithStats gets all buildings with their statistics
func (s *BuildingService) GetAllBuildingsWithStats() ([]BuildingWithStats, error) {
	// Get all buildings
	buildings, err := s.repository.FindAll()
	if err != nil {
		return nil, err
	}

	// Build response with stats
	result := make([]BuildingWithStats, len(buildings))
	for i, building := range buildings {
		// Count rooms for each building
		roomCount, err := s.repository.CountRooms(building.ID)
		if err != nil {
			return nil, err
		}

		result[i] = BuildingWithStats{
			Building:  building,
			RoomCount: roomCount,
		}
	}

	return result, nil
} 