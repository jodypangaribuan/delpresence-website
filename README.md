# DelPresence Website

DelPresence is a web application for academic management with authentication features.

## Project Structure

This project is divided into two main parts:

1. **Frontend**: A Next.js application with React
2. **Backend**: A Go API server with PostgreSQL database

## Prerequisites

- Node.js 18 or later
- Go 1.21 or later
- PostgreSQL 15 or later
- Docker and Docker Compose (optional)

## Frontend

The frontend is built with Next.js and uses:

- Tailwind CSS for styling
- React components from shadcn/ui
- Client-side authentication

### Running the Frontend

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with:

```
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Frontend Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Authentication Configuration
NEXT_PUBLIC_TOKEN_EXPIRY_HOURS=12

# CORS Configuration
NEXT_PUBLIC_CORS_ALLOWED_ORIGINS=http://localhost:3000

# Development Configuration
NEXT_PUBLIC_DEV_MODE=true
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`.

## Backend

The backend is built with Go and uses:

- Gin web framework
- PostgreSQL database
- JWT authentication

### Running the Backend

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a PostgreSQL database:

```sql
CREATE DATABASE delpresence;
```

3. Configure environment variables in `.env`:

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

4. Install dependencies:

```bash
go mod download
```

5. Run the server:

```bash
go run cmd/server/main.go
```

The backend will run on `http://localhost:8080`.

### Using Docker Compose

You can also run the backend with Docker Compose:

```bash
cd backend
docker-compose up -d
```

This will start both the API server and PostgreSQL database.

## Default Admin User

- Username: `admin`
- Password: `delpresence`

## API Endpoints

### Authentication

- `POST /api/auth/login`: Log in with username and password
- `POST /api/auth/refresh`: Refresh an expired token
- `GET /api/auth/me`: Get current user information (protected)

## Development

- Frontend code is in the `src` directory
- Backend code is in the `backend` directory
- UI components are in `src/components`
- Authentication logic is in `backend/internal/auth`

## License

MIT
