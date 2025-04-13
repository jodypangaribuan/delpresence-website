# DelPresence Backend

Backend services for the DelPresence application.

## Overview

The DelPresence backend is a Go API service that provides functionality for attendance tracking, user management, and integration with the IT Del campus information system.

## Features

- User authentication and authorization
- Lecturer data synchronization from campus API
- Attendance tracking and management
- Role-based access control

## Setup and Installation

### Prerequisites

- Go 1.23 or higher
- PostgreSQL database
- Docker and Docker Compose (optional)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=delpresence
JWT_SECRET=your_secret_key
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
CAMPUS_API_USERNAME=your_campus_api_username
CAMPUS_API_PASSWORD=your_campus_api_password
```

### Running with Docker

```bash
docker-compose up -d
```

### Running Locally

1. Install dependencies:
```bash
go mod download
```

2. Run the server:
```bash
go run cmd/server/main.go
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with username and password
- `POST /api/auth/refresh` - Refresh authentication token

### Campus API Integration

The backend includes a service for authenticating with the campus API (CIS) and managing tokens.

#### Token Management

- `GET /api/admin/campus/token` - Get a valid token from the campus API (admin only)
- `POST /api/admin/campus/token/refresh` - Force refresh the campus API token (admin only)

### Lecturers

- `GET /api/admin/lecturers` - Get all lecturers (admin only)
- `GET /api/admin/lecturers/:id` - Get lecturer by ID (admin only)
- `POST /api/admin/lecturers/sync` - Sync lecturers from campus API (admin only)

### Campus API Integration Architecture

The application uses a dedicated `CampusAuthService` to handle authentication with the campus API. This service:

1. Manages a single token for all campus API requests
2. Automatically refreshes tokens when they expire
3. Provides token caching to minimize authentication requests
4. Is used by other services (like `LecturerService`) to make authenticated requests to the campus API

#### How It Works

1. When a service needs to access the campus API, it requests a token from the `CampusAuthService`
2. The `CampusAuthService` checks if it has a valid cached token:
   - If yes, it returns the cached token
   - If no, it authenticates with the campus API and returns a new token
3. The service uses the token to make requests to the campus API
4. If the token expires, the service can request a refresh from the `CampusAuthService`

## Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b my-feature-branch`
3. Make changes and commit: `git commit -m "Add new feature"`
4. Push to the branch: `git push origin my-feature-branch`
5. Create a pull request 