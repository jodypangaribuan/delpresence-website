import os
import cv2
import numpy as np
import face_recognition
import jwt
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from io import BytesIO
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database connection parameters
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'delpresence')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')

def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    return conn

# Helper function to convert base64 to image
def base64_to_image(base64_string):
    # Remove data:image/jpeg;base64, if present
    if 'data:image/' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64 string
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data))
    
    # Convert to RGB (in case it's RGBA)
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Convert to numpy array for face_recognition
    return np.array(image)

# Register a face
@app.route('/api/faces/register', methods=['POST'])
def register_face():
    data = request.json
    
    if not data or 'student_id' not in data or 'image' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    student_id = data['student_id']
    image_base64 = data['image']
    
    try:
        # Convert base64 to image
        image = base64_to_image(image_base64)
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return jsonify({'error': 'No face detected in the image'}), 400
        
        if len(face_locations) > 1:
            return jsonify({'error': 'Multiple faces detected. Please submit an image with only one face'}), 400
        
        # Generate face embedding
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Store face embedding in database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate a unique embedding ID
        embedding_id = f"face_{student_id}_{os.urandom(4).hex()}"
        
        # Convert numpy array to Python list for JSON serialization
        embedding_list = face_encoding.tolist()
        
        # Check if student already has face embeddings
        cursor.execute("SELECT * FROM student_faces WHERE student_id = %s", (student_id,))
        existing_faces = cursor.fetchall()
        
        if existing_faces:
            # Update existing record
            cursor.execute(
                "UPDATE student_faces SET embedding = %s::jsonb, embedding_id = %s WHERE student_id = %s",
                (str(embedding_list).replace("'", '"'), embedding_id, student_id)
            )
        else:
            # Insert new record
            cursor.execute(
                "INSERT INTO student_faces (student_id, embedding_id, embedding) VALUES (%s, %s, %s::jsonb)",
                (student_id, embedding_id, str(embedding_list).replace("'", '"'))
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Face registered successfully'}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Verify a face
@app.route('/api/faces/verify', methods=['POST'])
def verify_face():
    data = request.json
    
    if not data or 'image' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    image_base64 = data['image']
    
    try:
        # Convert base64 to image
        image = base64_to_image(image_base64)
        
        # Detect faces in the image
        face_locations = face_recognition.face_locations(image)
        
        if not face_locations:
            return jsonify({'error': 'No face detected in the image', 'success': False}), 400
        
        if len(face_locations) > 1:
            return jsonify({'error': 'Multiple faces detected. Please submit an image with only one face', 'success': False}), 400
        
        # Generate face embedding for the submitted face
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        
        # Get all face embeddings from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT student_id, embedding FROM student_faces")
        stored_faces = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if not stored_faces:
            return jsonify({'error': 'No registered faces found in the database', 'success': False}), 404
        
        # Compare with stored embeddings
        for student_id, embedding_json in stored_faces:
            # Convert stored embedding from JSON string to numpy array
            stored_encoding = np.array(eval(embedding_json))
            
            # Calculate face distance
            face_distance = face_recognition.face_distance([stored_encoding], face_encoding)[0]
            
            # Check if the faces match (lower distance means better match)
            if face_distance < 0.6:  # Threshold can be adjusted based on testing
                return jsonify({
                    'success': True, 
                    'match': True, 
                    'student_id': student_id, 
                    'confidence': float(1 - face_distance)
                }), 200
        
        # If no match found
        return jsonify({'success': True, 'match': False, 'message': 'No matching face found'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# Get all registered faces for a student
@app.route('/api/faces/student/<int:student_id>', methods=['GET'])
def get_student_faces(student_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, embedding_id, created_at FROM student_faces WHERE student_id = %s", (student_id,))
        faces = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if not faces:
            return jsonify({'success': True, 'faces': []}), 200
        
        face_data = []
        for face_id, embedding_id, created_at in faces:
            face_data.append({
                'id': face_id,
                'embedding_id': embedding_id,
                'created_at': created_at.isoformat() if created_at else None
            })
        
        return jsonify({'success': True, 'faces': face_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete a face
@app.route('/api/faces/<int:face_id>', methods=['DELETE'])
def delete_face(face_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM student_faces WHERE id = %s RETURNING id", (face_id,))
        deleted = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        if not deleted:
            return jsonify({'error': 'Face not found'}), 404
        
        return jsonify({'success': True, 'message': 'Face deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'False').lower() == 'true') 