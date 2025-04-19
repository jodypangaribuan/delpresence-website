package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/delpresence/backend/internal/services"
	"github.com/gin-gonic/gin"
)

// EmployeeHandler handles HTTP requests related to employees
type EmployeeHandler struct {
	service *services.EmployeeService
}

// NewEmployeeHandler creates a new employee handler
func NewEmployeeHandler() *EmployeeHandler {
	return &EmployeeHandler{
		service: services.NewEmployeeService(),
	}
}

// GetAllEmployees returns all employees
func (h *EmployeeHandler) GetAllEmployees(c *gin.Context) {
	employees, err := h.service.GetAllEmployees()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Employees retrieved successfully",
		"data":    employees,
	})
}

// GetEmployeeByID returns an employee by ID
func (h *EmployeeHandler) GetEmployeeByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	employee, err := h.service.GetEmployeeByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Employee retrieved successfully",
		"data":    employee,
	})
}

// SyncEmployees syncs employees from the campus API
func (h *EmployeeHandler) SyncEmployees(c *gin.Context) {
	// Sync employees using the service
	count, err := h.service.SyncEmployees()
	if err != nil {
		errMsg := err.Error()
		statusCode := http.StatusInternalServerError
		responseMsg := "Failed to sync employees"
		
		// Check for specific errors to provide better messages
		if strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "deadline exceeded") {
			statusCode = http.StatusGatewayTimeout
			responseMsg = "Connection to campus API timed out"
		} else if strings.Contains(errMsg, "connection refused") {
			statusCode = http.StatusServiceUnavailable
			responseMsg = "Campus API service unavailable"
		}
		
		c.JSON(statusCode, gin.H{
			"status":  "error",
			"message": responseMsg,
			"error":   errMsg,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Employees synced successfully",
		"data": gin.H{
			"count": count,
		},
	})
} 