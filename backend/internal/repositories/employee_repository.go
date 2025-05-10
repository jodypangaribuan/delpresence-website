package repositories

import (
	"log"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"gorm.io/gorm"
)

// EmployeeRepository handles database operations for employees
type EmployeeRepository struct {
	db *gorm.DB
}

// NewEmployeeRepository creates a new employee repository
func NewEmployeeRepository() *EmployeeRepository {
	return &EmployeeRepository{
		db: database.GetDB(),
	}
}

// FindAll returns all employees from the database
func (r *EmployeeRepository) FindAll() ([]models.Employee, error) {
	var employees []models.Employee
	result := r.db.Find(&employees)
	return employees, result.Error
}

// FindByID returns an employee by ID
func (r *EmployeeRepository) FindByID(id uint) (*models.Employee, error) {
	var employee models.Employee
	result := r.db.First(&employee, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &employee, nil
}

// FindByNIP returns an employee by NIP
func (r *EmployeeRepository) FindByNIP(nip string) (*models.Employee, error) {
	var employee models.Employee
	result := r.db.Where("nip = ?", nip).First(&employee)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, result.Error
	}
	return &employee, nil
}

// FindByUserID returns an employee by external UserID from campus
func (r *EmployeeRepository) FindByUserID(userID int) (*models.Employee, error) {
	var employee models.Employee
	result := r.db.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, result.Error
	}
	return &employee, nil
}

// UpsertMany creates or updates multiple employees
func (r *EmployeeRepository) UpsertMany(employees []models.Employee) error {
	if len(employees) == 0 {
		return nil
	}

	tx := r.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, employee := range employees {
		// Try to find existing employee by EmployeeID
		var existingEmployee models.Employee
		result := tx.Where("employee_id = ?", employee.EmployeeID).First(&existingEmployee)
		
		if result.Error == nil {
			// Update existing employee
			employee.ID = existingEmployee.ID
			employee.CreatedAt = existingEmployee.CreatedAt
			
			if err := tx.Save(&employee).Error; err != nil {
				tx.Rollback()
				return err
			}
		} else {
			// Create new employee
			if err := tx.Create(&employee).Error; err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	log.Printf("Upserted %d employees", len(employees))
	return tx.Commit().Error
}

// Create creates a new employee
func (r *EmployeeRepository) Create(employee *models.Employee) error {
	return r.db.Create(employee).Error
}

// Update updates an existing employee
func (r *EmployeeRepository) Update(employee *models.Employee) error {
	return r.db.Save(employee).Error
}

// Delete deletes an employee by ID
func (r *EmployeeRepository) Delete(id uint) error {
	return r.db.Delete(&models.Employee{}, id).Error
} 