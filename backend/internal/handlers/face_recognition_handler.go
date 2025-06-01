package handlers

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/awserr"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/rekognition"
	"github.com/delpresence/backend/internal/database"
	"github.com/delpresence/backend/internal/models"
	"github.com/delpresence/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// FaceRecognitionHandler handles all face recognition related routes
type FaceRecognitionHandler struct {
	rekClient *rekognition.Rekognition
	awsRegion string
}

// NewFaceRecognitionHandler creates a new face recognition handler
func NewFaceRecognitionHandler() *FaceRecognitionHandler {
	// Initialize AWS session
	awsRegion := utils.GetEnv("AWS_REGION", "us-east-1")
	sess, err := session.NewSession(&aws.Config{
		Region: aws.String(awsRegion),
	})

	if err != nil {
		log.Printf("Error creating AWS session: %v", err)
		return &FaceRecognitionHandler{
			rekClient: nil,
			awsRegion: awsRegion,
		}
	}

	// Create Rekognition client
	rekClient := rekognition.New(sess)

	return &FaceRecognitionHandler{
		rekClient: rekClient,
		awsRegion: awsRegion,
	}
}

// RegisterFaceRecognitionRoutes registers all face recognition routes
func (h *FaceRecognitionHandler) RegisterRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		student := api.Group("/student")
		{
			student.POST("/face-registration", h.RegisterFace)
			student.GET("/:id/registered-faces", h.GetRegisteredFaces)
			student.DELETE("/face", h.DeleteFace)
		}

		attendance := api.Group("/attendance")
		{
			attendance.POST("/face-verification", h.VerifyFace)
		}
	}
}

type RegisterFaceRequest struct {
	StudentID int    `json:"student_id" binding:"required"`
	Image     string `json:"image" binding:"required"` // base64 encoded image
}

type VerifyFaceRequest struct {
	StudentID int    `json:"student_id" binding:"required"`
	Image     string `json:"image" binding:"required"` // base64 encoded image
}

type DeleteFaceRequest struct {
	StudentID   int    `json:"student_id" binding:"required"`
	EmbeddingID string `json:"embedding_id" binding:"required"`
}

// RegisterFace handles face registration
func (h *FaceRecognitionHandler) RegisterFace(c *gin.Context) {
	if h.rekClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "AWS Rekognition client not initialized",
		})
		return
	}

	// Parse request body
	var req RegisterFaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format: " + err.Error(),
		})
		return
	}

	// Validate student ID
	var student models.Student
	if err := database.GetDB().First(&student, "id = ?", req.StudentID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Student not found",
		})
		return
	}

	// Decode base64 image
	imageBytes, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid image format",
		})
		return
	}

	// Generate embedding ID using UUID
	embeddingID := uuid.New().String()

	// Call AWS Rekognition to detect faces and ensure the image has exactly one face
	detectInput := &rekognition.DetectFacesInput{
		Image: &rekognition.Image{
			Bytes: imageBytes,
		},
		Attributes: []*string{aws.String("ALL")},
	}

	detectResult, err := h.rekClient.DetectFaces(detectInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to detect faces: " + err.Error(),
		})
		return
	}

	if len(detectResult.FaceDetails) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No face detected in the image",
		})
		return
	}

	if len(detectResult.FaceDetails) > 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Multiple faces detected in the image",
		})
		return
	}

	// Get face details for quality check
	faceDetail := detectResult.FaceDetails[0]

	// Check face quality (e.g., brightness, pose, etc.)
	if *faceDetail.Quality.Brightness < 50 || *faceDetail.Quality.Sharpness < 50 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Face image quality is too low. Please ensure good lighting and a clear image.",
		})
		return
	}

	// Check face pose
	if *faceDetail.Pose.Yaw < -30 || *faceDetail.Pose.Yaw > 30 ||
		*faceDetail.Pose.Pitch < -30 || *faceDetail.Pose.Pitch > 30 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Face is not properly aligned. Please look directly at the camera.",
		})
		return
	}

	// Check if student already has faces registered
	var count int64
	database.GetDB().Model(&models.StudentFace{}).Where("student_id = ?", req.StudentID).Count(&count)

	// Limit the number of registered faces per student
	if count >= 3 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Maximum number of faces already registered (3). Please delete an existing face before adding a new one.",
		})
		return
	}

	// Convert to embedding using AWS Rekognition's IndexFaces
	indexInput := &rekognition.IndexFacesInput{
		CollectionId: aws.String("student-faces"),
		Image: &rekognition.Image{
			Bytes: imageBytes,
		},
		ExternalImageId: aws.String(fmt.Sprintf("student-%d-%s", req.StudentID, embeddingID)),
		DetectionAttributes: []*string{
			aws.String("ALL"),
		},
		MaxFaces: aws.Int64(1),
	}

	// Create the collection if it doesn't exist
	if err := h.ensureCollectionExists("student-faces"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to ensure collection exists: " + err.Error(),
		})
		return
	}

	indexResult, err := h.rekClient.IndexFaces(indexInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to index face: " + err.Error(),
		})
		return
	}

	if len(indexResult.FaceRecords) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "No face could be indexed",
		})
		return
	}

	// Get the face ID from AWS Rekognition
	faceID := *indexResult.FaceRecords[0].Face.FaceId

	// Store the face embedding ID and metadata in the database
	// We don't store the actual embedding values since AWS Rekognition manages them
	studentFace := models.StudentFace{
		StudentID:   req.StudentID,
		EmbeddingID: faceID, // Use AWS Rekognition's face ID
		// We leave Embedding empty as AWS manages it
	}

	if err := database.GetDB().Create(&studentFace).Error; err != nil {
		// Clean up the indexed face in AWS if database storage fails
		h.deleteFaceFromCollection(faceID, "student-faces")

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to store face registration: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Face registered successfully",
		"data": gin.H{
			"student_id":   req.StudentID,
			"embedding_id": faceID,
		},
	})
}

// VerifyFace handles face verification for attendance
func (h *FaceRecognitionHandler) VerifyFace(c *gin.Context) {
	if h.rekClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "AWS Rekognition client not initialized",
		})
		return
	}

	// Parse request body
	var req VerifyFaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format: " + err.Error(),
		})
		return
	}

	// Decode base64 image
	imageBytes, err := base64.StdEncoding.DecodeString(req.Image)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid image format",
		})
		return
	}

	// Verify using SearchFacesByImage against the collection
	searchInput := &rekognition.SearchFacesByImageInput{
		CollectionId: aws.String("student-faces"),
		Image: &rekognition.Image{
			Bytes: imageBytes,
		},
		MaxFaces:           aws.Int64(5),      // Return multiple possible matches
		FaceMatchThreshold: aws.Float64(80.0), // Set a threshold for matches (0-100)
	}

	searchResult, err := h.rekClient.SearchFacesByImage(searchInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to search faces: " + err.Error(),
		})
		return
	}

	// No faces found in the image
	if len(searchResult.FaceMatches) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "No matching face found",
		})
		return
	}

	// Get the best match
	bestMatch := searchResult.FaceMatches[0]
	faceID := *bestMatch.Face.FaceId
	confidence := *bestMatch.Similarity

	// Look up which student this face belongs to
	var studentFace models.StudentFace
	if err := database.GetDB().Where("embedding_id = ?", faceID).First(&studentFace).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve student information",
		})
		return
	}

	// Check if the identified face belongs to the expected student
	if studentFace.StudentID != req.StudentID {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "Face verification failed: face belongs to a different student",
		})
		return
	}

	// Success - face verified for the correct student
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Face verified successfully",
		"data": gin.H{
			"student_id": studentFace.StudentID,
			"confidence": confidence,
		},
	})
}

// GetRegisteredFaces returns all registered faces for a student
func (h *FaceRecognitionHandler) GetRegisteredFaces(c *gin.Context) {
	// Parse student ID from URL
	studentIDStr := c.Param("id")
	studentID, err := strconv.Atoi(studentIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid student ID",
		})
		return
	}

	// Verify student exists
	var student models.Student
	if err := database.GetDB().First(&student, "id = ?", studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Student not found",
		})
		return
	}

	// Get all faces for this student
	var faces []models.StudentFace
	if err := database.GetDB().Where("student_id = ?", studentID).Find(&faces).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve student faces",
		})
		return
	}

	// Format response
	var faceData []map[string]interface{}
	for _, face := range faces {
		faceData = append(faceData, map[string]interface{}{
			"id":           face.ID,
			"student_id":   face.StudentID,
			"embedding_id": face.EmbeddingID,
			"created_at":   face.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    faceData,
	})
}

// DeleteFace removes a registered face
func (h *FaceRecognitionHandler) DeleteFace(c *gin.Context) {
	if h.rekClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "AWS Rekognition client not initialized",
		})
		return
	}

	// Parse request body
	var req DeleteFaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
		})
		return
	}

	// Find the face in the database
	var face models.StudentFace
	if err := database.GetDB().Where("student_id = ? AND embedding_id = ?", req.StudentID, req.EmbeddingID).First(&face).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Face record not found",
		})
		return
	}

	// Delete from AWS Rekognition
	err := h.deleteFaceFromCollection(face.EmbeddingID, "student-faces")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete face from AWS Rekognition: " + err.Error(),
		})
		return
	}

	// Delete from database
	if err := database.GetDB().Delete(&face).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete face record: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Face deleted successfully",
	})
}

// Helper methods

// ensureCollectionExists makes sure the specified collection exists in AWS Rekognition
func (h *FaceRecognitionHandler) ensureCollectionExists(collectionID string) error {
	// Check if collection exists
	describeInput := &rekognition.DescribeCollectionInput{
		CollectionId: aws.String(collectionID),
	}

	_, err := h.rekClient.DescribeCollection(describeInput)
	if err != nil {
		if aerr, ok := err.(awserr.Error); ok {
			if aerr.Code() == rekognition.ErrCodeResourceNotFoundException {
				// Collection doesn't exist, create it
				createInput := &rekognition.CreateCollectionInput{
					CollectionId: aws.String(collectionID),
				}
				_, err = h.rekClient.CreateCollection(createInput)
				if err != nil {
					return fmt.Errorf("failed to create collection: %w", err)
				}
				log.Printf("Created new collection: %s", collectionID)
				return nil
			}
		}
		return fmt.Errorf("error checking collection: %w", err)
	}

	// Collection exists
	return nil
}

// deleteFaceFromCollection removes a face from an AWS Rekognition collection
func (h *FaceRecognitionHandler) deleteFaceFromCollection(faceID, collectionID string) error {
	input := &rekognition.DeleteFacesInput{
		CollectionId: aws.String(collectionID),
		FaceIds:      []*string{aws.String(faceID)},
	}

	_, err := h.rekClient.DeleteFaces(input)
	if err != nil {
		return err
	}

	return nil
}
