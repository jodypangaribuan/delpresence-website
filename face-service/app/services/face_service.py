import os
import uuid
import json
import numpy as np
import logging
from typing import Dict, List, Union, Optional
from pathlib import Path
import base64
import cv2
from io import BytesIO
import tempfile
from datetime import datetime
from deepface import DeepFace
from app.utils.helpers import (
    base64_to_image, 
    ensure_directory_exists, 
    save_embedding_to_file,
    load_embedding_from_file
)

# Setup logging
logger = logging.getLogger(__name__)

# Define constants
FACE_DB_DIR = os.environ.get('FACE_DB_DIR', '/app/face_db')
TEMP_DIR = os.environ.get('TEMP_DIR', '/tmp/face_uploads')
DETECTION_MODEL = os.environ.get('DETECTION_MODEL', 'retinaface')
RECOGNITION_MODEL = os.environ.get('RECOGNITION_MODEL', 'ArcFace')
CONFIDENCE_THRESHOLD = float(os.environ.get('CONFIDENCE_THRESHOLD', 0.6))

# Ensure directories exist
ensure_directory_exists(FACE_DB_DIR)
ensure_directory_exists(TEMP_DIR)

class FaceService:
    """
    Service untuk pengelolaan dan verifikasi data wajah menggunakan DeepFace
    """
    
    @staticmethod
    def register_face(student_id: int, base64_image: str) -> Dict:
        """
        Mendaftarkan wajah mahasiswa dengan ID tertentu
        """
        try:
            # Decode base64 image
            img = base64_to_image(base64_image)
            if img is None:
                logger.error(f"Failed to decode base64 image for student {student_id}")
                return {"success": False, "message": "Invalid image format"}
            
            # Detect face
            try:
                face_obj = DeepFace.extract_faces(
                    img_path=img,
                    detector_backend=DETECTION_MODEL,
                    enforce_detection=True
                )
                
                if len(face_obj) == 0:
                    logger.error(f"No face detected for student {student_id}")
                    return {"success": False, "message": "No face detected"}
                
                if len(face_obj) > 1:
                    logger.warning(f"Multiple faces detected for student {student_id}")
                    return {"success": False, "message": "Multiple faces detected, please provide an image with only one face"}
                
                # Get face region and quality score
                face_data = face_obj[0]
                confidence = face_data.get("confidence", 0)
                
                if confidence < CONFIDENCE_THRESHOLD:
                    logger.warning(f"Low confidence face detection ({confidence}) for student {student_id}")
                    return {"success": False, "message": "Low quality face image. Please use better lighting and a clear frontal face position"}
                
                # Generate embedding with DeepFace
                embedding_result = DeepFace.represent(
                    img_path=img,
                    model_name=RECOGNITION_MODEL,
                    detector_backend=DETECTION_MODEL,
                    enforce_detection=True
                )
                
                if not embedding_result or len(embedding_result) == 0:
                    logger.error(f"Failed to generate embedding for student {student_id}")
                    return {"success": False, "message": "Failed to generate face embedding"}
                
                # Get embedding vector from result
                embedding_vector = embedding_result[0]["embedding"]
                
                # Generate a unique ID for this embedding
                embedding_id = str(uuid.uuid4())
                
                # Save embedding to student file (still needed for verification within the service)
                student_dir = os.path.join(FACE_DB_DIR, str(student_id))
                ensure_directory_exists(student_dir)
                
                # Save embedding file
                embedding_file = os.path.join(student_dir, f"{embedding_id}.json")
                save_embedding_to_file(embedding_file, {
                    "id": embedding_id,
                    "student_id": student_id,
                    "model": RECOGNITION_MODEL,
                    "detector": DETECTION_MODEL,
                    "embedding": embedding_vector,
                    "created_at": str(datetime.now().isoformat())
                })
                
                return {
                    "success": True,
                    "message": "Face registered successfully",
                    "data": {
                        "student_id": student_id,
                        "embedding_id": embedding_id,
                        "embedding": embedding_vector,
                        "confidence": confidence
                    }
                }
                
            except Exception as e:
                logger.error(f"Error detecting face: {str(e)}")
                return {"success": False, "message": f"Face detection error: {str(e)}"}
        
        except Exception as e:
            logger.error(f"Error in register_face: {str(e)}")
            return {"success": False, "message": f"Error processing face registration: {str(e)}"}
    
    @staticmethod
    def verify_face(student_id: int, base64_image: str) -> Dict:
        """
        Verifikasi wajah untuk mahasiswa dengan ID tertentu
        """
        try:
            # Decode base64 image
            img = base64_to_image(base64_image)
            if img is None:
                logger.error(f"Failed to decode base64 image for verification of student {student_id}")
                return {"success": False, "message": "Invalid image format"}
            
            # Check if student has registered faces
            student_dir = os.path.join(FACE_DB_DIR, str(student_id))
            if not os.path.exists(student_dir):
                logger.error(f"Student {student_id} has no registered faces")
                return {"success": False, "message": "No registered faces for this student"}
            
            # Get all embedding files
            embedding_files = [f for f in os.listdir(student_dir) if f.endswith('.json')]
            if not embedding_files:
                logger.error(f"No embedding files found for student {student_id}")
                return {"success": False, "message": "No face embeddings found for this student"}
            
            # Save input image temporarily
            with tempfile.NamedTemporaryFile(suffix='.jpg', dir=TEMP_DIR, delete=False) as temp_file:
                temp_path = temp_file.name
                cv2.imwrite(temp_path, img)
            
            try:
                # Verify against registered faces
                best_match = None
                highest_similarity = -1
                
                for embedding_file in embedding_files:
                    embedding_path = os.path.join(student_dir, embedding_file)
                    
                    # Try verification with DeepFace
                    try:
                        verification_result = DeepFace.verify(
                            img1_path=temp_path,
                            img2_path=embedding_path,
                            model_name=RECOGNITION_MODEL,
                            detector_backend=DETECTION_MODEL,
                            distance_metric="cosine"
                        )
                        
                        # Check verification result
                        if verification_result["verified"]:
                            similarity = 1 - verification_result["distance"]  # Convert distance to similarity
                            if similarity > highest_similarity:
                                highest_similarity = similarity
                                best_match = {
                                    "embedding_id": os.path.splitext(embedding_file)[0],
                                    "similarity": similarity,
                                    "verified": True
                                }
                    
                    except Exception as e:
                        logger.warning(f"Verification error with {embedding_file}: {str(e)}")
                        continue
                
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
                # Return verification result
                if best_match and highest_similarity > CONFIDENCE_THRESHOLD:
                    # Load the embedding data to include in the response
                    embedding_path = os.path.join(student_dir, f"{best_match['embedding_id']}.json")
                    embedding_data = load_embedding_from_file(embedding_path)
                    embedding_vector = None
                    if embedding_data and "embedding" in embedding_data:
                        embedding_vector = embedding_data["embedding"]
                    
                    return {
                        "success": True,
                        "message": "Face verification successful",
                        "data": {
                            "student_id": student_id,
                            "verified": True,
                            "similarity": highest_similarity,
                            "embedding_id": best_match["embedding_id"],
                            "embedding": embedding_vector  # Include embedding in the response
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": "Face verification failed",
                        "data": {
                            "student_id": student_id,
                            "verified": False,
                            "similarity": highest_similarity if highest_similarity > -1 else 0
                        }
                    }
            
            finally:
                # Ensure cleanup of temp file
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except:
                        pass
        
        except Exception as e:
            logger.error(f"Error in verify_face: {str(e)}")
            return {"success": False, "message": f"Error processing face verification: {str(e)}"}
    
    @staticmethod
    def get_registered_faces(student_id: int) -> Dict:
        """
        Mendapatkan daftar wajah yang terdaftar untuk mahasiswa tertentu
        """
        try:
            student_dir = os.path.join(FACE_DB_DIR, str(student_id))
            
            if not os.path.exists(student_dir):
                return {
                    "success": True,
                    "message": "No registered faces found",
                    "data": {
                        "student_id": student_id,
                        "face_count": 0,
                        "faces": []
                    }
                }
            
            embedding_files = [f for f in os.listdir(student_dir) if f.endswith('.json')]
            faces = []
            
            for embedding_file in embedding_files:
                file_path = os.path.join(student_dir, embedding_file)
                try:
                    with open(file_path, 'r') as file:
                        data = json.load(file)
                        faces.append({
                            "embedding_id": data.get("id", os.path.splitext(embedding_file)[0]),
                            "created_at": data.get("created_at", "unknown")
                        })
                except Exception as e:
                    logger.error(f"Error reading embedding file {file_path}: {str(e)}")
            
            return {
                "success": True,
                "message": f"Found {len(faces)} registered faces",
                "data": {
                    "student_id": student_id,
                    "face_count": len(faces),
                    "faces": faces
                }
            }
        
        except Exception as e:
            logger.error(f"Error in get_registered_faces: {str(e)}")
            return {"success": False, "message": f"Error retrieving registered faces: {str(e)}"}
    
    @staticmethod
    def delete_face(student_id: int, embedding_id: str) -> Dict:
        """
        Menghapus data wajah tertentu untuk mahasiswa
        """
        try:
            # Check if student directory exists
            student_dir = os.path.join(FACE_DB_DIR, str(student_id))
            if not os.path.exists(student_dir):
                return {
                    "success": False,
                    "message": f"No registered faces found for student {student_id}"
                }
            
            # Check if embedding file exists
            embedding_file = os.path.join(student_dir, f"{embedding_id}.json")
            if not os.path.exists(embedding_file):
                return {
                    "success": False,
                    "message": f"Embedding not found for student {student_id}"
                }
            
            # Delete the embedding file
            os.remove(embedding_file)
            
            # Check if the student directory is empty and clean up if needed
            remaining_files = [f for f in os.listdir(student_dir) if f.endswith('.json')]
            if not remaining_files:
                os.rmdir(student_dir)
                logger.info(f"Removed empty directory for student {student_id}")
            
            return {
                "success": True,
                "message": f"Successfully deleted face data",
                "data": {
                    "student_id": student_id,
                    "embedding_id": embedding_id
                }
            }
        
        except Exception as e:
            logger.error(f"Error in delete_face: {str(e)}")
            return {"success": False, "message": f"Error deleting face data: {str(e)}"} 