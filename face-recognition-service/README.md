# Face Recognition Service

A simple face recognition service for DelPresence application using a pre-trained model.

## Features

- Face registration for students
- Face verification for authentication
- Retrieve registered faces for a student
- Delete registered faces

## Technology Stack

- Python 3.9
- Flask (Web framework)
- face_recognition library (based on dlib's face recognition)
- PostgreSQL (Database)
- Docker (Containerization)

## API Endpoints

### Register a Face

**Endpoint:** `POST /api/faces/register`

**Request Body:**
```json
{
  "student_id": 12345,
  "image": "base64_encoded_image_data"
}
```

### Verify a Face

**Endpoint:** `POST /api/faces/verify`

**Request Body:**
```json
{
  "image": "base64_encoded_image_data"
}
```

### Get Student Faces

**Endpoint:** `GET /api/faces/student/{student_id}`

### Delete a Face

**Endpoint:** `DELETE /api/faces/{face_id}`

## Setup Instructions

1. Make sure Docker and Docker Compose are installed on your system

2. Clone the repository:
   ```
   git clone https://github.com/your-organization/delpresence-website.git
   cd delpresence-website/face-recognition-service
   ```

3. Build and start the service:
   ```
   docker-compose up -d
   ```

4. The service will be available at http://localhost:5000

## Integration with Main Application

This service should be connected to the same network as your main DelPresence application. Make sure your main application's docker-compose.yml creates a network named `delpresence-network`.

If you need to modify the database connection details or other settings, you can edit the environment variables in the docker-compose.yml file.

## Troubleshooting

If you encounter any issues with database connections, ensure:

1. The database is running and accessible
2. The database connection parameters in docker-compose.yml are correct
3. The application is connected to the same Docker network as the database

For face recognition issues:
1. Ensure images are clear and well-lit
2. The face should be visible and not obscured
3. Only one face should be present in the image 