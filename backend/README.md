# DelPresence Backend

This is the backend API for the DelPresence application, providing authentication and other APIs.

## Prerequisites

- Go 1.21 or later
- PostgreSQL database
- Docker (optional)

## Features

- Clean architecture with repository pattern
- GORM for database operations
- JWT authentication with refresh tokens
- Role-based authorization
- Automatic database migrations
- Docker and Docker Compose support

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=delpresence
JWT_SECRET=delpresence_secret_key
SERVER_PORT=8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE delpresence;
```

2. The application will automatically create the necessary tables and admin user on startup through GORM auto-migration.

## Running the Application

### Local Development

1. Install dependencies:

```bash
go mod download
```

2. Start the server:

```bash
go run cmd/server/main.go
```

The server will run on `http://localhost:8080`.

### Using Docker

1. Build the Docker image:

```bash
docker build -t delpresence-backend .
```

2. Run the container:

```bash
docker run -p 8080:8080 --env-file .env delpresence-backend
```

## Project Structure

```
backend/
├── cmd/                  # Command line applications
│   └── server/           # Main API server
├── internal/             # Internal packages
│   ├── auth/             # Authentication logic
│   ├── database/         # Database connection
│   ├── handlers/         # HTTP handlers
│   ├── middleware/       # HTTP middleware
│   ├── models/           # Data models
│   ├── repositories/     # Database repositories
│   └── utils/            # Utility functions
├── .env                  # Environment variables
├── go.mod                # Go module definition
├── go.sum                # Go module checksums
├── docker-compose.yml    # Docker Compose configuration
└── Dockerfile            # Docker build instructions
```

## API Endpoints

### Public Endpoints

- `POST /api/auth/login`: Log in with username and password
  - Request: `{ "username": "admin", "password": "delpresence" }`
  - Response: `{ "token": "...", "refresh_token": "...", "user": { ... } }`

- `POST /api/auth/refresh`: Refresh an expired token
  - Request: `{ "refresh_token": "..." }`
  - Response: `{ "token": "...", "refresh_token": "...", "user": { ... } }`

### Protected Endpoints

All protected endpoints require an `Authorization` header with a valid JWT token:
`Authorization: Bearer YOUR_TOKEN_HERE`

- `GET /api/auth/me`: Get current user information
  - Response: `{ "id": 1, "username": "admin", "role": "Admin" }`

## Default Admin User

Username: `admin`  
Password: `delpresence` 