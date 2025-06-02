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

## Cara Deploy ke VPS

### Persiapan
1. Pastikan Docker dan Docker Compose sudah terinstall di VPS
2. Clone repository ini ke VPS
3. Pastikan struktur folder berikut sudah ada:
   - `nginx/nginx.conf` - File konfigurasi Nginx
   - `nextjs/` - Folder aplikasi Next.js dengan semua file yang diperlukan

### Deployment

1. Copy file konfigurasi environment:
   ```bash
   cp .env.example .env
   ```

2. Edit file .env dan ganti `your-vps-ip` dengan IP VPS Anda:
   ```
   NEXT_PUBLIC_API_URL=http://your-vps-ip/api
   ```

3. Jalankan script deployment:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. Aplikasi seharusnya sekarang bisa diakses di http://[IP-VPS] tanpa port

### Deployment to GitHub and VM

When pushing to GitHub and deploying to your VM, follow these steps to ensure proper configuration:

1. **For GitHub**: 
   - The default configuration in docker-compose.yml uses a placeholder (`YOUR_VM_IP`).
   - This allows others to clone and set up their own environment.
   - DO NOT commit your actual .env file with your VM IP to GitHub.

2. **For VM Deployment**:
   - On your VM, create a .env file with your actual VM IP:
     ```
     NEXT_PUBLIC_API_URL=http://34.70.12.251/api
     ```
   - This file will be used during deployment but won't be pushed to GitHub.

3. **To update your deployment**:
   ```bash
   # Pull the latest code
   git pull
   
   # Make sure your .env file has the correct VM IP
   
   # Restart the containers
   docker-compose down && docker-compose up -d --build
   ```

### Troubleshooting

Jika aplikasi tidak bisa diakses:

1. Periksa apakah container berjalan:
   ```bash
   docker-compose ps
   ```

2. Periksa logs:
   ```bash
   docker-compose logs nginx
   docker-compose logs nextjs
   ```

3. Pastikan port 80 tidak diblokir oleh firewall:
   ```bash
   sudo ufw status
   ```
   Jika port 80 tidak ada dalam list, tambahkan dengan:
   ```bash
   sudo ufw allow 80/tcp
   ```

4. Pastikan tidak ada layanan lain yang menggunakan port 80:
   ```bash
   sudo netstat -tulpn | grep 80
   ```
