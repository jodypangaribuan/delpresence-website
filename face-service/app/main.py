from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

# Import routes
from app.routes import face_registration, face_verification

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DelPresence Face Recognition API",
    description="API untuk pendaftaran dan verifikasi wajah menggunakan DeepFace",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production to be more restrictive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(face_registration.router, prefix="/api", tags=["Face Registration"])
app.include_router(face_verification.router, prefix="/api", tags=["Face Verification"])

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint untuk memastikan API berjalan dengan baik
    """
    return {"status": "healthy", "service": "face-recognition-api"}

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Face Recognition API starting up")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Face Recognition API shutting down")

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 