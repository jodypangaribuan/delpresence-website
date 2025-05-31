package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"time"

	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// Struktur untuk FaceService
const FaceServiceURL = "http://face-recognition-api:8000/api"

// FaceRegistrationHandler menangani request terkait pendaftaran wajah
type FaceRecognitionHandler struct{}

// NewFaceRecognitionHandler membuat handler baru
func NewFaceRecognitionHandler() *FaceRecognitionHandler {
	return &FaceRecognitionHandler{}
}

// Request dan response models
type FaceRegistrationRequest struct {
	StudentID int    `json:"student_id"`
	Image     string `json:"image"`
}

type FaceVerificationRequest struct {
	StudentID int    `json:"student_id"`
	Image     string `json:"image"`
}

type FaceDeleteRequest struct {
	StudentID   int    `json:"student_id"`
	EmbeddingID string `json:"embedding_id"`
}

type GenericResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// RegisterFace menangani pendaftaran wajah
func (h *FaceRecognitionHandler) RegisterFace(c *gin.Context) {
	var req FaceRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from token context
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Unauthorized",
		})
		return
	}

	// We're using student ID from request, but could be derived from user ID if needed

	// Create request body
	reqBody, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to process request",
		})
		return
	}

	// Make request to face service
	resp, err := http.Post(
		fmt.Sprintf("%s/student/face-registration", FaceServiceURL),
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"message": "Face recognition service unavailable",
		})
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to read response from face service",
		})
		return
	}

	// Parse response
	var response GenericResponse
	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to parse response from face service",
		})
		return
	}

	// Store embedding in database if successful
	if response.Success && response.Data != nil {
		data, ok := response.Data.(map[string]interface{})
		if ok {
			// Get the embedding data
			studentID, _ := data["student_id"].(float64)
			embeddingID, _ := data["embedding_id"].(string)

			// Handle the embedding vector
			var embeddingArray models.EmbeddingArray

			// Extract embedding from response
			embeddingRaw, hasEmbedding := data["embedding"]
			if hasEmbedding {
				// Convert the embedding to our type
				if rawSlice, ok := embeddingRaw.([]interface{}); ok {
					for _, v := range rawSlice {
						if fv, ok := v.(float64); ok {
							embeddingArray = append(embeddingArray, fv)
						}
					}
				}
			}

			// Create student face record
			studentFace := models.StudentFace{
				StudentID:   int(studentID),
				EmbeddingID: embeddingID,
				Embedding:   embeddingArray,
				CreatedAt:   time.Now(),
			}

			// Save to database
			db := database.GetDB()
			if err := db.Create(&studentFace).Error; err != nil {
				// Log the error but still return success to the client as the face service succeeded
				fmt.Printf("Error storing face embedding in database: %v\n", err)
			} else {
				fmt.Printf("Successfully stored face embedding for student %d\n", studentFace.StudentID)
			}
		}
	}

	// Return response
	c.JSON(resp.StatusCode, response)
}

// VerifyFace menangani verifikasi wajah untuk absensi
func (h *FaceRecognitionHandler) VerifyFace(c *gin.Context) {
	var req FaceVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from token context
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Unauthorized",
		})
		return
	}

	// We're using student ID from request, but could be derived from user ID if needed

	// Create request body
	reqBody, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to process request",
		})
		return
	}

	// Make request to face service
	resp, err := http.Post(
		fmt.Sprintf("%s/attendance/face-verification", FaceServiceURL),
		"application/json",
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"message": "Face recognition service unavailable",
		})
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to read response from face service",
		})
		return
	}

	// Parse response
	var response GenericResponse
	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to parse response from face service",
		})
		return
	}

	// Store embedding in database if verification was successful
	if response.Success && response.Data != nil {
		data, ok := response.Data.(map[string]interface{})
		if ok && data["verified"] == true {
			// Get the embedding data
			studentID, _ := data["student_id"].(float64)
			embeddingID, _ := data["embedding_id"].(string)

			// Handle the embedding vector
			var embeddingArray models.EmbeddingArray

			// Extract embedding from response
			embeddingRaw, hasEmbedding := data["embedding"]
			if hasEmbedding {
				// Convert the embedding to our type
				if rawSlice, ok := embeddingRaw.([]interface{}); ok {
					for _, v := range rawSlice {
						if fv, ok := v.(float64); ok {
							embeddingArray = append(embeddingArray, fv)
						}
					}
				}

				// Check if we already have this embedding ID in our database
				db := database.GetDB()
				var existingFace models.StudentFace
				result := db.Where("embedding_id = ?", embeddingID).First(&existingFace)

				// If not found, create a new record
				if result.Error != nil {
					// Create student face record
					studentFace := models.StudentFace{
						StudentID:   int(studentID),
						EmbeddingID: embeddingID,
						Embedding:   embeddingArray,
						CreatedAt:   time.Now(),
					}

					// Save to database
					if err := db.Create(&studentFace).Error; err != nil {
						// Log the error but still return success to the client
						fmt.Printf("Error storing verified face embedding in database: %v\n", err)
					} else {
						fmt.Printf("Successfully stored verified face embedding for student %d\n", studentFace.StudentID)
					}
				}
			}
		}
	}

	// Return response
	c.JSON(resp.StatusCode, response)
}

// GetRegisteredFaces mendapatkan daftar wajah yang terdaftar
func (h *FaceRecognitionHandler) GetRegisteredFaces(c *gin.Context) {
	// Get student ID from URL parameter
	studentIDStr := c.Param("studentId")
	studentID, err := strconv.Atoi(studentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Invalid student ID",
		})
		return
	}

	// Get data from our database first
	db := database.GetDB()
	var faces []models.StudentFace
	result := db.Where("student_id = ?", studentID).Find(&faces)

	// If we have data in our database, return it directly
	if result.Error == nil && len(faces) > 0 {
		// Convert to a simpler response format
		type FaceData struct {
			EmbeddingID string    `json:"embedding_id"`
			CreatedAt   time.Time `json:"created_at"`
		}

		var faceDataList []FaceData
		for _, face := range faces {
			faceDataList = append(faceDataList, FaceData{
				EmbeddingID: face.EmbeddingID,
				CreatedAt:   face.CreatedAt,
			})
		}

		c.JSON(http.StatusOK, GenericResponse{
			Success: true,
			Message: fmt.Sprintf("Found %d registered faces", len(faces)),
			Data: map[string]interface{}{
				"student_id": studentID,
				"face_count": len(faces),
				"faces":      faceDataList,
			},
		})
		return
	}

	// If no data in our database or there was an error, fall back to the face service
	resp, err := http.Get(fmt.Sprintf("%s/student/%d/registered-faces", FaceServiceURL, studentID))
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"message": "Face recognition service unavailable",
		})
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to read response from face service",
		})
		return
	}

	// Parse response
	var response GenericResponse
	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to parse response from face service",
		})
		return
	}

	// If faces were found in the service, store them in our database
	if response.Success && response.Data != nil {
		data, ok := response.Data.(map[string]interface{})
		if ok && data["faces"] != nil {
			// Process each face
			if facesRaw, ok := data["faces"].([]interface{}); ok {
				for _, faceRaw := range facesRaw {
					face, ok := faceRaw.(map[string]interface{})
					if ok {
						embeddingID, _ := face["embedding_id"].(string)
						createdAtStr, _ := face["created_at"].(string)

						// Check if this face already exists in our database
						var existingFace models.StudentFace
						result := db.Where("embedding_id = ?", embeddingID).First(&existingFace)

						// Only add if not already in database
						if result.Error != nil {
							// Parse created_at if available
							var createdAt time.Time
							if createdAtStr != "" {
								createdAt, _ = time.Parse(time.RFC3339, createdAtStr)
							} else {
								createdAt = time.Now()
							}

							// Create a new record (without embedding since we don't have it)
							studentFace := models.StudentFace{
								StudentID:   studentID,
								EmbeddingID: embeddingID,
								CreatedAt:   createdAt,
							}

							// Save to database
							db.Create(&studentFace)
						}
					}
				}
			}
		}
	}

	// Return the original response from the face service
	c.JSON(resp.StatusCode, response)
}

// DeleteFace menghapus data wajah
func (h *FaceRecognitionHandler) DeleteFace(c *gin.Context) {
	var req FaceDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Delete from our database first
	db := database.GetDB()
	db.Where("student_id = ? AND embedding_id = ?", req.StudentID, req.EmbeddingID).Delete(&models.StudentFace{})

	// Create request body
	reqBody, err := json.Marshal(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to process request",
		})
		return
	}

	// Create DELETE request
	client := &http.Client{}
	request, err := http.NewRequest(
		http.MethodDelete,
		fmt.Sprintf("%s/student/face", FaceServiceURL),
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"message": "Failed to create request",
		})
		return
	}
	request.Header.Set("Content-Type", "application/json")

	// Execute request
	resp, err := client.Do(request)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "error",
			"message": "Face recognition service unavailable",
		})
		return
	}
	defer resp.Body.Close()

	// Read response
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to read response from face service",
		})
		return
	}

	// Parse response
	var response GenericResponse
	if err := json.Unmarshal(body, &response); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to parse response from face service",
		})
		return
	}

	// Return response
	c.JSON(resp.StatusCode, response)
}
