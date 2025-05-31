from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List
import logging
from app.services.face_service import FaceService
from datetime import datetime

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Request models
class FaceRegistrationRequest(BaseModel):
    student_id: int = Field(..., description="ID mahasiswa yang akan didaftarkan wajahnya")
    image: str = Field(..., description="Base64 encoded image string")

class FaceDeleteRequest(BaseModel):
    student_id: int = Field(..., description="ID mahasiswa")
    embedding_id: str = Field(..., description="ID embedding wajah yang akan dihapus")

# Response models
class FaceEmbedding(BaseModel):
    embedding_id: str
    created_at: str

class FaceRegistrationData(BaseModel):
    student_id: int
    embedding_id: str
    confidence: float

class FaceRegisteredList(BaseModel):
    student_id: int
    face_count: int
    faces: List[FaceEmbedding]

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# Routes
@router.post("/student/face-registration", response_model=GenericResponse, tags=["Face Registration"])
async def register_face(request: FaceRegistrationRequest):
    """
    Mendaftarkan wajah mahasiswa dengan ID tertentu
    """
    logger.info(f"Face registration request for student ID: {request.student_id}")
    
    if not request.image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image data is required"
        )
    
    if request.student_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID"
        )
    
    result = FaceService.register_face(request.student_id, request.image)
    
    if not result["success"]:
        logger.warning(f"Face registration failed for student {request.student_id}: {result['message']}")
        return GenericResponse(
            success=False,
            message=result["message"],
            data=None
        )
    
    logger.info(f"Face registration successful for student {request.student_id}")
    return GenericResponse(
        success=True,
        message="Face registered successfully",
        data=result["data"]
    )

@router.get("/student/{student_id}/registered-faces", response_model=GenericResponse, tags=["Face Registration"])
async def get_registered_faces(student_id: int):
    """
    Mendapatkan daftar wajah yang sudah terdaftar untuk mahasiswa tertentu
    """
    if student_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID"
        )
    
    result = FaceService.get_registered_faces(student_id)
    
    return GenericResponse(
        success=result["success"],
        message=result["message"],
        data=result["data"] if "data" in result else None
    )

@router.delete("/student/face", response_model=GenericResponse, tags=["Face Registration"])
async def delete_face(request: FaceDeleteRequest):
    """
    Menghapus data wajah tertentu dari database
    """
    if request.student_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid student ID"
        )
    
    if not request.embedding_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Embedding ID is required"
        )
    
    result = FaceService.delete_face(request.student_id, request.embedding_id)
    
    return GenericResponse(
        success=result["success"],
        message=result["message"],
        data=result["data"] if "data" in result and result["success"] else None
    ) 