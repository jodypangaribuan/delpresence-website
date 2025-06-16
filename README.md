# DelPresence

## Panduan Menjalankan Proyek DelPresence

Dokumen ini berisi panduan untuk menjalankan seluruh komponen proyek DelPresence menggunakan Docker.

## Daftar Isi

- [Prasyarat](#prasyarat)
- [Frontend (Next.js)](#frontend-nextjs)
- [Backend (Go)](#backend-go)
- [Aplikasi Mobile (Flutter)](#aplikasi-mobile-flutter)
- [Menjalankan Seluruh Stack](#menjalankan-seluruh-stack)

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Flutter SDK](https://flutter.dev/docs/get-started/install) (untuk pengembangan aplikasi mobile)
- [Git](https://git-scm.com/downloads)

## Frontend (Next.js)

Frontend DelPresence dibuat menggunakan Next.js.

### Menjalankan dengan Docker

1. Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:

```bash
cp env.example .env
```

2. Bangun dan jalankan container NextJS:

```bash
docker-compose up -d
```

3. Aplikasi frontend akan berjalan di `http://localhost:80`

### Pengembangan Lokal (Tanpa Docker)

1. Instal dependensi:

```bash
npm install
```

2. Jalankan server pengembangan:

```bash
npm run dev
```

3. Buka `http://localhost:3000` di browser Anda

## Backend (Go)

Backend DelPresence dibangun menggunakan Go dengan database PostgreSQL.

### Menjalankan dengan Docker

1. Masuk ke direktori backend:

```bash
cd backend
```

2. Siapkan variabel lingkungan (opsional):

```bash
# Konfigurasi database
export DB_PASSWORD=postgres  # default: postgres
export JWT_SECRET=rahasia_kunci_jwt  # default: delpresence_secret_key
export CORS_ALLOWED_ORIGINS=http://localhost,https://delpresence.example.com  # sesuaikan dengan domain frontend Anda
```

3. Bangun dan jalankan container:

```bash
docker-compose up -d
```

4. API backend akan berjalan di `http://localhost:8080`

### Pengembangan Lokal (Tanpa Docker)

1. Masuk ke direktori backend:

```bash
cd backend
```

2. Pastikan PostgreSQL berjalan di mesin lokal Anda

3. Sesuaikan konfigurasi di dalam kode atau variabel lingkungan

4. Jalankan server:

```bash
go run ./cmd/server/main.go
```

## Aplikasi Mobile (Flutter)

Aplikasi mobile DelPresence dibuat menggunakan Flutter.

### Menjalankan Aplikasi Mobile

1. Masuk ke direktori aplikasi mobile:

```bash
cd mobile-app
```

2. Ambil dependensi Flutter:

```bash
flutter pub get
```

3. Jalankan aplikasi di emulator atau perangkat fisik:

```bash
flutter run
```

### Build APK

Untuk membuat file APK yang dapat diinstal:

```bash
flutter build apk --release
```

File APK akan tersedia di `build/app/outputs/flutter-apk/app-release.apk`

## Menjalankan Seluruh Stack

Untuk menjalankan seluruh stack aplikasi (frontend dan backend) sekaligus:

1. Di root direktori proyek:

```bash
# Jalankan backend
cd backend && docker-compose up -d && cd ..

# Jalankan frontend
docker-compose up -d
```

2. Dengan cara ini, Anda dapat mengakses:

   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:8080`

3. Untuk aplikasi mobile, Anda perlu menjalankannya secara terpisah seperti yang dijelaskan di bagian [Aplikasi Mobile](#aplikasi-mobile-flutter).

---

© DelPresence 2025.
