package services

import (
	"errors"
	"fmt"

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
	// Check if code exists (including soft-deleted)
	exists, err := s.repository.CheckCodeExists(room.Code, 0)
	if err != nil {
		return err
	}

	if exists {
		// Try to find a soft-deleted room with this code
		deletedRoom, err := s.repository.FindDeletedByCode(room.Code)
		if err != nil {
			return err
		}

		if deletedRoom != nil {
			// Restore the soft-deleted room with updated data
			restoredRoom, err := s.repository.RestoreByCode(room.Code)
			if err != nil {
				return err
			}
			
			// Update with new data
			restoredRoom.Name = room.Name
			restoredRoom.BuildingID = room.BuildingID
			restoredRoom.Floor = room.Floor
			restoredRoom.Capacity = room.Capacity
			
			return s.repository.Update(restoredRoom)
		}
		
		return errors.New("kode ruangan sudah digunakan")
	}

	// Check if building exists
	building, err := s.buildingRepository.FindByID(room.BuildingID)
	if err != nil {
		return err
	}
	if building == nil {
		return errors.New("gedung tidak ditemukan")
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
		return errors.New("ruangan tidak ditemukan")
	}

	// If code is changed, check if new code already exists
	if room.Code != existingRoom.Code {
		exists, err := s.repository.CheckCodeExists(room.Code, room.ID)
		if err != nil {
			return err
		}
		if exists {
			return errors.New("kode ruangan sudah digunakan")
		}
	}

	// Check if building exists
	building, err := s.buildingRepository.FindByID(room.BuildingID)
	if err != nil {
		return err
	}
	if building == nil {
		return errors.New("gedung tidak ditemukan")
	}

	// Check if capacity has changed
	capacityChanged := existingRoom.Capacity != room.Capacity
	
	// Update room
	if err := s.repository.Update(room); err != nil {
		return err
	}
	
	// If capacity changed, update all course schedules that use this room
	if capacityChanged {
		scheduleRepo := repositories.NewCourseScheduleRepository()
		if err := scheduleRepo.UpdateSchedulesForRoom(room.ID, room.Capacity); err != nil {
			// Log error but don't fail the operation
			// This is to prevent updates to rooms from failing due to schedule update issues
			// The schedules will eventually be updated when they're accessed
			fmt.Printf("Error updating course schedules for room ID %d: %v\n", room.ID, err)
		}
	}
	
	return nil
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
		return nil, errors.New("gedung tidak ditemukan")
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
		return errors.New("ruangan tidak ditemukan")
	}

	// Delete room (soft delete)
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