package handlers

import (
	"net/http"
	"strconv"

	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// BuildingHandler handles HTTP requests related to buildings
type BuildingHandler struct {
	service *services.BuildingService
}

// NewBuildingHandler creates a new building handler
func NewBuildingHandler() *BuildingHandler {
	return &BuildingHandler{
		service: services.NewBuildingService(),
	}
}

// GetAllBuildings returns all buildings
func (h *BuildingHandler) GetAllBuildings(c *gin.Context) {
	stats := c.Query("stats")
	var result interface{}
	var err error

	if stats == "true" {
		result, err = h.service.GetAllBuildingsWithStats()
	} else {
		result, err = h.service.GetAllBuildings()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Buildings retrieved successfully",
		"data":    result,
	})
}

// GetBuildingByID returns a building by ID
func (h *BuildingHandler) GetBuildingByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	stats := c.Query("stats")
	var result interface{}

	if stats == "true" {
		result, err = h.service.GetBuildingWithStats(uint(id))
	} else {
		result, err = h.service.GetBuildingByID(uint(id))
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Building not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Building retrieved successfully",
		"data":    result,
	})
}

// CreateBuilding creates a new building
func (h *BuildingHandler) CreateBuilding(c *gin.Context) {
	var building models.Building

	if err := c.ShouldBindJSON(&building); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.service.CreateBuilding(&building); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Building created successfully",
		"data":    building,
	})
}

// UpdateBuilding updates a building
func (h *BuildingHandler) UpdateBuilding(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	var building models.Building
	if err := c.ShouldBindJSON(&building); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	building.ID = uint(id)

	if err := h.service.UpdateBuilding(&building); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Building updated successfully",
		"data":    building,
	})
}

// DeleteBuilding deletes a building
func (h *BuildingHandler) DeleteBuilding(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	if err := h.service.DeleteBuilding(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Building deleted successfully",
	})
} 