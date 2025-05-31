import os
import base64
import json
import numpy as np
import cv2
from io import BytesIO
from datetime import datetime
from typing import Dict, Any, Optional, Union

def ensure_directory_exists(directory_path: str) -> None:
    """
    Memastikan direktori tertentu ada, jika tidak akan dibuat
    """
    if not os.path.exists(directory_path):
        os.makedirs(directory_path, exist_ok=True)

def base64_to_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Mengkonversi string base64 menjadi gambar OpenCV (numpy array)
    """
    try:
        # Extract actual base64 content if format is "data:image/jpeg;base64,..."
        if "base64," in base64_string:
            base64_string = base64_string.split("base64,")[1]
        
        # Decode base64 string to bytes
        img_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(img_bytes, np.uint8)
        
        # Decode numpy array as image
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return img
    except Exception as e:
        print(f"Error converting base64 to image: {str(e)}")
        return None

def image_to_base64(image: np.ndarray, format: str = ".jpg") -> str:
    """
    Mengkonversi gambar OpenCV (numpy array) menjadi string base64
    """
    try:
        # Encode image to specified format
        _, buffer = cv2.imencode(format, image)
        
        # Convert to base64
        base64_string = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/jpeg;base64,{base64_string}"
    except Exception as e:
        print(f"Error converting image to base64: {str(e)}")
        return ""

def save_embedding_to_file(filepath: str, data: Dict[str, Any]) -> bool:
    """
    Menyimpan data embedding ke file JSON
    """
    try:
        # Convert numpy arrays to lists for JSON serialization
        processed_data = data.copy()
        for key, value in processed_data.items():
            if isinstance(value, np.ndarray):
                processed_data[key] = value.tolist()
        
        # Write to file
        with open(filepath, 'w') as file:
            json.dump(processed_data, file)
        
        return True
    except Exception as e:
        print(f"Error saving embedding to file: {str(e)}")
        return False

def load_embedding_from_file(filepath: str) -> Optional[Dict[str, Any]]:
    """
    Membaca data embedding dari file JSON
    """
    try:
        if not os.path.exists(filepath):
            return None
        
        with open(filepath, 'r') as file:
            data = json.load(file)
            
            # Convert embedding list back to numpy array if needed
            if "embedding" in data and isinstance(data["embedding"], list):
                data["embedding"] = np.array(data["embedding"])
            
            return data
    except Exception as e:
        print(f"Error loading embedding from file: {str(e)}")
        return None

def is_valid_face_image(image: np.ndarray) -> bool:
    """
    Memeriksa apakah gambar mengandung wajah yang valid
    """
    # Check if image is not empty
    if image is None or image.size == 0:
        return False
    
    # Check minimum dimensions
    height, width = image.shape[:2]
    if height < 100 or width < 100:
        return False
    
    # Check image is not too dark or too bright
    avg_brightness = np.mean(image)
    if avg_brightness < 30 or avg_brightness > 220:
        return False
    
    return True 