# DelPresence

<p align="center">
  <img src="assets/images/logo.png" alt="DelPresence Logo" width="200"/>
</p>

<p align="center">
  <b>Smart Attendance System for Del Institute of Technology</b>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributors">Contributors</a>
</p>

---

## 🚀 Introduction

**DelPresence** adalah aplikasi presensi modern berbasis mobile untuk lingkungan kampus. Dikembangkan dengan Flutter dan Go, aplikasi ini menawarkan solusi efisien untuk manajemen kehadiran mahasiswa dan staf.

Dengan pendekatan berbasis **Clean Architecture**, DelPresence tidak hanya menawarkan performa yang baik tapi juga kode yang bersih dan mudah dipelihara.

## ✨ Features

### 📱 Mobile App

- **Login & Register System** - Sistem otentikasi aman untuk mahasiswa dan staf
- **QR Code Presence** - Presensi cepat dengan pemindaian QR code
- **Schedule Management** - Manajemen jadwal mata kuliah dan kegiatan
- **Profile Management** - Pengaturan profil dan preferensi pengguna
- **History & Analytics** - Riwayat kehadiran dan analitik

### 🖥️ API Backend

- **Secure Authentication** - JWT-based authentication
- **RESTful APIs** - Endpoint yang terstruktur untuk semua fitur
- **Database Integration** - Penyimpanan data yang teroptimasi

## 🏗️ Architecture

DelPresence menerapkan **Clean Architecture** untuk pemisahan concern yang jelas:

<p align="center">
  <img src="https://miro.medium.com/max/720/1*wOmAHDN_zKZJns9YDjtrMw.jpeg" width="400" alt="Clean Architecture Diagram"/>
</p>

### Struktur Direktori

```
lib/
├── core/                     # Komponen inti aplikasi
│   ├── constants/            # Konstanta aplikasi (warna, ukuran, teks)
│   ├── config/               # Konfigurasi aplikasi
│   ├── services/             # Layanan tingkat aplikasi
│   ├── theme/                # Tema aplikasi
│   ├── utils/                # Utilitas umum
│   └── widgets/              # Widget yang dapat digunakan kembali
│       ├── form/             # Widget form yang dapat digunakan kembali
│       └── ...
│
├── features/                 # Fitur aplikasi
│   ├── auth/                 # Fitur otentikasi
│   │   ├── data/             # Layer data (repositories, data sources)
│   │   ├── domain/           # Layer domain (entities, usecases)
│   │   └── presentation/     # Layer presentasi (blocs, screens, widgets)
│   │
│   ├── home/                 # Fitur home
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   │
│   └── splash/               # Fitur splash screen
│       └── presentation/
│
└── main.dart                 # Entry point aplikasi
```

## 🛠️ Tech Stack

### Frontend

- **Flutter** - Framework UI cross-platform
- **Bloc** - State management
- **GetIt** - Dependency injection
- **Dio** - HTTP client

### Backend

- **Go** - Bahasa pemrograman server-side
- **Gin** - Web framework
- **GORM** - ORM untuk database
- **JWT** - Authentication

## 📦 Installation

### Prerequisites

- Flutter SDK (latest stable)
- Go 1.16+
- Git

### Mobile App Setup

```bash
# Clone repository
git clone https://github.com/yourusername/delpresence.git

# Change directory
cd delpresence

# Install dependencies
flutter pub get

# Run the app
flutter run
```

### API Setup

```bash
# Change to API directory
cd delpresence-api

# Install dependencies
go mod download

# Run the server
go run cmd/api/main.go
```

## 💡 Usage

### Authentication

<p align="center">
  <img src="https://via.placeholder.com/250x500" alt="Login Screen" width="250"/>
  <img src="https://via.placeholder.com/250x500" alt="Register Screen" width="250"/>
</p>

1. **Registrasi** - Daftar sebagai mahasiswa atau staff
2. **Login** - Masuk dengan NIM/NIP dan password

### Main Features

<p align="center">
  <img src="https://via.placeholder.com/250x500" alt="Home Screen" width="250"/>
  <img src="https://via.placeholder.com/250x500" alt="Scan QR" width="250"/>
</p>

1. **Dashboard** - Akses cepat ke semua fitur
2. **Scan QR** - Lakukan presensi dengan memindai QR code
3. **History** - Lihat riwayat kehadiran

## 👨‍💻 Contributors

<p align="center">
  <a href="https://github.com/yourusername">
    <img src="https://via.placeholder.com/70x70" alt="Profile 1" style="border-radius:50%"/>
  </a>
  <a href="https://github.com/your-teammate">
    <img src="https://via.placeholder.com/70x70" alt="Profile 2" style="border-radius:50%"/>
  </a>
</p>

---

<p align="center">
  Made with :> for Del Institute of Technology
</p>
