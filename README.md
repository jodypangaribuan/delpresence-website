<div align="center">
  <img src="public/images/logo2.png" alt="DelPresence Logo" width="250" />
  <h1>DelPresence</h1>
</div>

<div align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <img alt="Status" src="https://img.shields.io/badge/Status-Active%20Development-yellow?style=flat-square" />
  <img alt="Platform" src="https://img.shields.io/badge/Platform-Web%20%7C%20Mobile-lightgrey?style=flat-square" />
</div>

<br />

<div align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js&logoColor=white" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js%2025-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" />
  <img alt="Flutter" src="https://img.shields.io/badge/Flutter%203-02569B?style=flat-square&logo=flutter&logoColor=white" />
  <img alt="Go" src="https://img.shields.io/badge/Go%201.23-00ADD8?style=flat-square&logo=go&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL%2015-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" />
</div>

<br />

<p align="center">
  <strong>An integrated cloud-based platform for digital and real-time attendance management at Del Institute of Technology (IT Del).</strong>
</p>

<br />

<p align="center">
  <img src="mobile-app/assets/images/delpresence-mockup.png" alt="DelPresence Mockup" width="800"/>
</p>

## Executive Summary

**DelPresence** is a digital attendance system (Final Project for Group 4 at IT Del) that combines a Mobile App (Flutter) and a Web App (Next.js). This platform utilizes **QR Code** and **Face Recognition** for attendance tracking, replacing manual paper-based processes that are time-consuming and prone to fraud.

## Key Features

- **📱 Mobile App (Flutter)**: 
  - **Fast Attendance**: Perform attendance via QR Code (`qr_code_scanner_plus`) & Face Recognition (`flutter_face_api`).
  - **Face Registration**: Securely register student faces for precise biometric verification.
  - **Academic Info**: View active class schedules, ongoing attendance sessions, and detailed attendance history.
  - **Unified Account**: Single sign-on authentication synchronized directly with the campus API.
- **🖥️ Web App (Next.js)**: 
  - **Admin Panel**: Centralized management for all academic data (faculties, programs, buildings, rooms, academic years, courses, student groups) and personnel (lecturers, assistants, students, staff).
  - **Lecturer Panel**: Manage course sessions, open/close/cancel attendance, generate session QR Codes, manually mark attendance, and view real-time statistics.
  - **Assistant Panel**: Manage attendance sessions and generate QR Codes on behalf of assigned lecturers.
  - **Reporting**: Easily download detailed attendance reports in spreadsheet format.
- **🔗 System Integration & Security**:
  - **Campus API Sync**: Direct synchronization of academic and personnel data from IT Del's integrated Campus API.
  - **Secure Authentication**: Multi-role robust JWT authentication (Admin, Lecturer, Assistant, Student) with Role-Based Access Control (RBAC).
  - **Scalable Infrastructure**: Containerized application using Docker, orchestrated locally with Docker Compose, and deployed safely on GCP via Nginx Reverse Proxy.

---

## Tech Stack & Core Systems

| Category | Technology |
| --- | --- |
| **Frontend Web** | Next.js 16 (App Router), Tailwind CSS, shadcn/ui, TypeScript |
| **Backend API** | Go 1.23, Gin Framework, PostgreSQL, GORM, JWT Auth |
| **Mobile App** | Flutter (Dart ≥3.0) + `flutter_face_api` + `qr_code_scanner` |
| **Infrastructure/Deployment**| Docker, Docker Compose, Nginx (Reverse Proxy), GCP |

---

## Project Structure

This project adopts a structured monorepo-style setup containing the web application, mobile application, and backend services:

```text
delpresence-website/
├── backend/               # Backend API built with Go and Gin framework
├── src/                   # Web Application Main Source Code (Next.js & React)
├── mobile-app/            # Mobile Application built with Flutter
│   ├── android/           # Application configuration directory for the Android platform
│   ├── ios/               # Application configuration directory for the iOS platform
│   ├── assets/            # Static application assets (images, icons, fonts, etc.)
│   ├── lib/               # Main Flutter application source code
│   │   ├── constants/     # App-wide constants (themes, colors, text styles)
│   │   ├── providers/     # State management providers (Theme, Navigation)
│   │   ├── routes/        # App routing configurations
│   │   ├── screens/       # UI Screens (Home, Explore, Search, Profile, Messages, etc.)
│   │   ├── services/      # External services APIs (Firebase, Supabase, Notifications)
│   │   ├── widgets/       # Global and reusable UI components (Bottom Navigation, Custom Buttons)
│   │   └── main.dart      # Application entry point
│   └── pubspec.yaml       # Flutter package configuration & dependencies file
├── application-desc.md    # Detailed functional and non-functional project description
└── README.md              # Main project guide & documentation file
```

---

## How to Run the Application

The DelPresence application in this repository is divided into 3 main component directories (Frontend Web at root, Backend API in `backend/`, and Mobile in `mobile-app/`).

### System Prerequisites
Ensure your operating system has the following installed:
- [Node.js](https://nodejs.org/) (version 25 or above)
- [Go](https://golang.org/) (version 1.23 or above)
- [Flutter SDK](https://flutter.dev/) (version 3.0+)
- [PostgreSQL](https://www.postgresql.org/) (version 15 or above)
- [Docker & Docker Compose](https://www.docker.com/) (Optional for quick setup)

---

### 1. Running Manually (Development Mode)

#### A. Running the Frontend Web (Next.js)
1. Open a terminal in the root folder of this project.
2. Copy the *environment variable* template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the *development server* with Turbopack:
   ```bash
   npm run dev
   ```
5. Access the Frontend Panel in your browser: `http://localhost:3000`

#### B. Running the Backend API (Go)
1. Open a new terminal and navigate to the *backend* folder:
   ```bash
   cd backend
   ```
2. Copy the *environment variable* template for database connection & API credentials:
   ```bash
   cp .env.example .env
   ```
   *(Ensure the PostgreSQL application is running and the credentials are correct in this `.env` file)*
3. Download package dependencies:
   ```bash
   go mod download
   ```
4. Start the backend server:
   ```bash
   go run cmd/server/main.go
   ```

#### C. Running the Mobile App (Flutter)
1. Open a new terminal and navigate to the mobile directory:
   ```bash
   cd mobile-app
   ```
2. Get Dart dependencies:
   ```bash
   flutter pub get
   ```
3. Run the application on an emulator or a connected device:
   ```bash
   flutter run
   ```

---

### 2. Running with Docker (Easiest)

The Next.js web project and proxy gateway are also equipped with a `Dockerfile` and `docker-compose.yml` for *production* phase and simplifying application orchestration.

1. Open a terminal in the root folder of the project.
2. Set up the `.env` file credentials (if you haven't already).
3. Run the Docker Compose command below to *build & run* in the background (detached mode):
   ```bash
   docker-compose up -d --build
   ```
4. The Frontend and Nginx Reverse Proxy containers will be initialized.
   - You can access the application on port `80` via browser (`http://localhost`).
5. Additional Docker commands:
   - View container logs: `docker-compose logs -f`
   - Stop and remove docker environment: `docker-compose down`

*(Note: For the Go backend, you can use a similar configuration file located at `./backend/docker-compose.yml` if available).*

---

## Development Team (Final Project Group 4)

This platform was developed by the Del Institute of Technology Development Team:
- **Jody Edriano Pangaribuan** - Project Manager / Fullstack Developer
- **Marshanda Kasih Simangunsong** - Member
- **Anno Deritman Siregar** - Member
- **Jessica Anastasya Purba** - Member
- **Prapanca Ronaldo Panjaitan** - Member
- **Kezia M S Siahaan** - Member

<br />

> **License**: © 2026 Del Institute of Technology | Developed by Group 4, Final Project 2. All rights reserved.
