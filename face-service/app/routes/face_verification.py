from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
import logging
from app.services.face_service import FaceService

# Setup logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Request models
class FaceVerificationRequest(BaseModel):
    student_id: int = Field(..., description="ID mahasiswa yang akan diverifikasi wajahnya")
    image: str = Field(..., description="Base64 encoded image string")

# Response models
class VerificationResult(BaseModel):
    student_id: int
    verified: bool
    similarity: float
    embedding_id: Optional[str] = None

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# Routes
@router.post("/attendance/face-verification", response_model=GenericResponse, tags=["Face Verification"])
async def verify_face(request: FaceVerificationRequest):
    """
    Memverifikasi wajah mahasiswa untuk absensi
    """
    logger.info(f"Face verification request for student ID: {request.student_id}")
    
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
    
    result = FaceService.verify_face(request.student_id, request.image)
    
    # Return result regardless of success/failure status for verification
    return GenericResponse(
        success=result["success"],
        message=result["message"],
        data=result.get("data")
    ) 