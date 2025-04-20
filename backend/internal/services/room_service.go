package services

import (
	"errors"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/repositories"
)

// RoomService is a service for room operations
type RoomService struct {
	repository       *repositories.RoomRepository
	buildingRepository *repositories.BuildingRepository
}

// NewRoomService creates a new room service
func NewRoomService() *RoomService {
	return &RoomService{
		repository:       repositories.NewRoomRepository(),
		buildingRepository: repositories.NewBuildingRepository(),
	}
}

// CreateRoom creates a new room
func (s *RoomService) CreateRoom(room *models.Room) error {
	// Check if code already exists
	existingRoom, err := s.repository.FindByCode(room.Code)
	if err != nil {
		return err
	}
	if existingRoom != nil {
		return errors.New("room with this code already exists")
	}

	// Check if building exists
	building, err := s.buildingRepository.FindByID(room.BuildingID)
	if err != nil {
		return err
	}
	if building == nil {
		return errors.New("building not found")
	}

	// Create room
	return s.repository.Create(room)
}

// UpdateRoom updates an existing room
func (s *RoomService) UpdateRoom(room *models.Room) error {
	// Check if room exists
	existingRoom, err := s.repository.FindByID(room.ID)
	if err != nil {
		return err
	}
	if existingRoom == nil {
		return errors.New("room not found")
	}

	// If code is changed, check if new code already exists
	if room.Code != existingRoom.Code {
		existingWithCode, err := s.repository.FindByCode(room.Code)
		if err != nil {
			return err
		}
		if existingWithCode != nil && existingWithCode.ID != room.ID {
			return errors.New("room with this code already exists")
		}
	}

	// Check if building exists
	building, err := s.buildingRepository.FindByID(room.BuildingID)
	if err != nil {
		return err
	}
	if building == nil {
		return errors.New("building not found")
	}

	// Update room
	return s.repository.Update(room)
}

// GetRoomByID gets a room by ID
func (s *RoomService) GetRoomByID(id uint) (*models.Room, error) {
	return s.repository.FindByID(id)
}

// GetAllRooms gets all rooms
func (s *RoomService) GetAllRooms() ([]models.Room, error) {
	return s.repository.FindAll()
}

// GetRoomsByBuildingID gets all rooms by building ID
func (s *RoomService) GetRoomsByBuildingID(buildingID uint) ([]models.Room, error) {
	// Check if building exists
	building, err := s.buildingRepository.FindByID(buildingID)
	if err != nil {
		return nil, err
	}
	if building == nil {
		return nil, errors.New("building not found")
	}

	return s.repository.FindByBuildingID(buildingID)
}

// DeleteRoom deletes a room
func (s *RoomService) DeleteRoom(id uint) error {
	// Check if room exists
	room, err := s.repository.FindByID(id)
	if err != nil {
		return err
	}
	if room == nil {
		return errors.New("room not found")
	}

	// Delete room
	return s.repository.DeleteByID(id)
}

// RoomWithDetails represents a room with additional details
type RoomWithDetails struct {
	Room         models.Room     `json:"room"`
	BuildingName string          `json:"building_name"`
}

// GetRoomsWithDetails gets all rooms with building details
func (s *RoomService) GetRoomsWithDetails() ([]RoomWithDetails, error) {
	// Get all rooms
	rooms, err := s.repository.FindAll()
	if err != nil {
		return nil, err
	}

	// Build response with details
	result := make([]RoomWithDetails, len(rooms))
	for i, room := range rooms {
		result[i] = RoomWithDetails{
			Room:         room,
			BuildingName: room.Building.Name,
		}
	}

	return result, nil
} 