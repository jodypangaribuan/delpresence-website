# DelPresence

**Platform Proyek**  
- Mobile App (Android & iOS) — Flutter  
- Web App (Responsive, Next.js App Router)

**Versi Saat Ini**  
1.0.0

**Status Proyek**  
Dalam Pengembangan Aktif (Final Project / Tugas Akhir)

**Tanggal Pembaruan Terakhir**  
21 Februari 2026

**Executive Summary**  
DelPresence adalah platform terintegrasi berbasis cloud untuk manajemen presensi perkuliahan di Institut Teknologi Del (IT Del). Menggabungkan mobile app dan web app, sistem ini memungkinkan pencatatan kehadiran secara digital melalui QR Code dan face recognition, menggantikan proses manual yang rentan error, lambat, dan sulit direkap secara real-time.

---

## Latar Belakang Proyek
Proses pencatatan kehadiran perkuliahan di lingkungan kampus masih banyak yang dilakukan secara manual menggunakan tanda tangan di kertas atau absensi konvensional. Hal ini menimbulkan berbagai masalah seperti kesulitan rekapitulasi, potensi kecurangan (titip absen), data yang tidak akurat, serta memakan waktu bagi dosen dan staf administrasi. Proyek DelPresence dikembangkan sebagai Tugas Akhir (Final Project 2) oleh Group 4 di Institut Teknologi Del untuk mendigitalisasi seluruh proses presensi perkuliahan menjadi lebih efisien, akurat, dan dapat diakses secara real-time oleh seluruh civitas akademika.

## Permasalahan Bisnis yang Diatasi
- Proses absensi manual menggunakan kertas → rentan kecurangan (titip absen) dan human error
- Rekapitulasi kehadiran memakan waktu lama dan rawan kesalahan input
- Tidak ada visibilitas real-time untuk dosen dan manajemen mengenai data kehadiran
- Mahasiswa tidak memiliki akses langsung terhadap riwayat kehadiran mereka sendiri
- Data kehadiran tersebar dan sulit diintegrasikan dengan sistem akademik kampus
- Pengelolaan jadwal, mata kuliah, dan penugasan dosen/asisten masih dilakukan secara manual

## Tujuan Bisnis & Objectives (SMART)
- Mendigitalisasi 100% proses presensi perkuliahan di IT Del
- Mengurangi waktu rekapitulasi kehadiran dari hitungan hari menjadi real-time (< 1 menit)
- Mencapai akurasi data kehadiran hingga 99% melalui QR Code dan face recognition
- Meminimalkan kecurangan absensi (titip absen) menjadi mendekati 0%
- Menyediakan akses data kehadiran real-time untuk seluruh civitas akademika

## Target Audience & User Persona
- **Admin** — Mengelola seluruh data akademik (fakultas, prodi, gedung, ruangan, tahun akademik, mata kuliah, kelompok mahasiswa, jadwal, penugasan dosen/asisten)
- **Dosen** — Mengelola sesi presensi, melihat jadwal & mata kuliah, menghasilkan QR Code, menandai kehadiran mahasiswa, mengunduh laporan kehadiran
- **Asisten Dosen** — Mengelola sesi presensi atas nama dosen, melihat jadwal yang ditugaskan, menghasilkan QR Code kehadiran
- **Mahasiswa** — Melakukan presensi via QR Code / face recognition, melihat jadwal & mata kuliah, melihat riwayat kehadiran

## Stakeholders
- Sponsor: Institut Teknologi Del
- Product Owner: -
- End User: Civitas akademika IT Del (dosen, asisten dosen, mahasiswa, admin)
- Technical Stakeholder: Group 4 — Final Project 2
- External: Sistem akademik kampus IT Del (campus API)

## Ruang Lingkup Proyek (Scope)

### In Scope
- Mobile App (Android & iOS) full feature — presensi QR Code, face recognition, jadwal, riwayat
- Web App responsive untuk admin & dosen — manajemen data akademik, presensi, laporan
- Backend REST API untuk seluruh operasi CRUD
- Autentikasi multi-role (Admin, Dosen, Asisten Dosen, Mahasiswa)
- Integrasi dengan sistem akademik kampus IT Del (campus API)
- QR Code generation & scanning untuk presensi
- Export laporan kehadiran (Excel/spreadsheet)
- Bahasa Indonesia

### Out of Scope
- Desktop native application
- Integrasi dengan Learning Management System (LMS)
- Fitur AI/ML selain face recognition (analytics prediktif, dll)
- Multi-bahasa (saat ini hanya Bahasa Indonesia)
- Payment atau fitur keuangan
- Notifikasi push (belum diimplementasikan)
- White-label version

## Fitur Utama

### Fitur Mobile App (Flutter)
- Autentikasi mahasiswa via campus API
- Presensi melalui scan QR Code (qr_code_scanner_plus)
- Presensi melalui face recognition (flutter_face_api)
- Registrasi wajah mahasiswa untuk face recognition
- Melihat jadwal perkuliahan aktif
- Melihat riwayat kehadiran
- Melihat sesi presensi aktif
- Halaman pengaturan akun
- Splash screen & bottom navigation

### Fitur Web App (Next.js)
- **Admin Panel:**
  - Manajemen dosen (view, search, sync dari campus API)
  - Manajemen mahasiswa (view, sync dari campus API)
  - Manajemen pegawai/karyawan (view, sync dari campus API)
  - Manajemen fakultas (CRUD)
  - Manajemen program studi (CRUD)
  - Manajemen gedung (CRUD)
  - Manajemen ruangan (CRUD)
  - Manajemen tahun akademik (CRUD)
  - Manajemen mata kuliah (CRUD)
  - Manajemen kelompok mahasiswa (CRUD + batch member management)
  - Manajemen jadwal perkuliahan (CRUD)
  - Manajemen penugasan dosen ke mata kuliah (CRUD)
  - Manajemen penugasan asisten dosen ke mata kuliah (CRUD)
  - Dashboard admin dengan overview statistik
- **Dosen Panel:**
  - Melihat mata kuliah yang ditugaskan
  - Melihat jadwal perkuliahan
  - Membuat & mengelola sesi presensi (buka, tutup, batalkan)
  - Generate QR Code untuk sesi presensi
  - Menandai kehadiran mahasiswa secara manual
  - Melihat statistik kehadiran per jadwal
  - Download laporan kehadiran (spreadsheet)
  - Mengelola penugasan asisten dosen
- **Asisten Dosen Panel:**
  - Melihat jadwal yang ditugaskan
  - Membuat & mengelola sesi presensi (sama seperti dosen)
  - Generate QR Code & menandai kehadiran
  - Download laporan kehadiran
- **Fitur Umum Web:**
  - Login page dengan autentikasi campus & admin
  - Role-Based Access Control (RBAC) — 4 role berbeda
  - Dashboard per role (Admin, Dosen, Asisten Dosen)
  - Landing page responsif dengan info aplikasi
  - Protected route & redirect otomatis
  - Loading state & transition antar halaman

### Fitur Cross-Platform
- Autentikasi terpusat via campus API & admin login
- JWT token-based authentication dengan refresh token
- Session management (sessionStorage + localStorage + cookie)
- Sinkronisasi data dari sistem akademik kampus (campus API)
- QR Code sebagai bridge antara web (generate) dan mobile (scan)

## Persyaratan Fungsional (Functional Requirements)
- Semua endpoint API harus dilindungi dengan JWT middleware & role-based access
- Autentikasi mendukung 2 flow: campus login (mahasiswa, dosen, asisten) dan admin login
- Response time API target < 500ms
- QR Code harus unik per sesi presensi dan expired setelah sesi ditutup
- Face recognition harus mampu memverifikasi identitas mahasiswa secara akurat
- Data sync dari campus API harus idempotent (tidak duplikat)

## Persyaratan Non-Fungsional (NFR)
- **Performance**: Load time halaman web < 3 detik
- **Scalability**: Mampu menangani seluruh civitas akademika IT Del
- **Security**: JWT authentication, CORS protection, role-based middleware, password hashing (bcrypt)
- **Reliability**: Graceful error handling, token refresh mechanism
- **Usability**: UI modern dan intuitif, responsive design
- **Maintainability**: Clean code structure dengan pemisahan handler/service/repository
- **Portability**: Web mendukung semua browser modern, mobile mendukung Android & iOS

## Tech Stack (Lengkap)

| Layer              | Technology                                       | Versi / Keterangan                            |
|--------------------|--------------------------------------------------|-----------------------------------------------|
| **Mobile**         | Flutter + Dart                                   | SDK ≥3.0.0 <4.0.0                             |
| **Mobile State**   | Provider + Flutter BLoC                          | State management                               |
| **Mobile Camera**  | camera + flutter_face_api                        | Face recognition & registrasi wajah            |
| **Mobile QR**      | qr_code_scanner_plus + qr_flutter               | Scan & generate QR Code                        |
| **Mobile Storage** | shared_preferences + flutter_secure_storage      | Local & secure storage                         |
| **Web Frontend**   | Next.js 16 (App Router) + Tailwind CSS + shadcn/ui | TypeScript, Turbopack                        |
| **Web UI**         | Radix UI + Lucide React + Framer Motion          | Component library + icons + animasi            |
| **Web Charts**     | Recharts + ApexCharts                            | Visualisasi data & grafik                      |
| **Web Forms**      | React Hook Form + Zod                            | Form validation                                |
| **Web Tables**     | TanStack React Table                             | Data table management                          |
| **Backend**        | Go (Golang) + Gin Framework                      | Go 1.23, toolchain go1.24.2                    |
| **Database**       | PostgreSQL + GORM                                | ORM-based query                                |
| **Authentication** | JWT (dgrijalva/jwt-go) + bcrypt                  | Token-based auth + password hashing            |
| **Campus API**     | Custom campus auth integration                   | Sync dosen, mahasiswa, pegawai dari IT Del     |
| **File Export**    | tealeg/xlsx                                      | Export laporan kehadiran ke spreadsheet         |
| **Containerization** | Docker + Docker Compose                       | Multi-stage build, Node 20 Alpine              |
| **Reverse Proxy**  | Nginx                                            | Stable Alpine                                  |
| **Cloud**          | Google Cloud Platform (GCP)                      | VM instance di 34.70.12.251                    |
| **E2E Testing**    | Cypress                                          | Browser testing                                |
| **Linting**        | ESLint + TypeScript strict                       | Code quality                                   |

## Arsitektur Sistem
- **Backend**: Handler → Service → Repository pattern (clean architecture)
- **Frontend Web**: Next.js App Router (Server Components + Client Components)
- **Mobile**: Feature-based modular architecture (features/core split)
- **API**: RESTful API dengan Gin framework, JSON request/response
- **Auth**: JWT middleware + role-based middleware per route group
- **Deploy**: Docker multi-stage build → Nginx reverse proxy → GCP VM

## Integrasi Pihak Ketiga
- **Campus API IT Del**: Sinkronisasi data dosen, mahasiswa, dan pegawai dari sistem akademik kampus
- **Campus Auth**: Autentikasi mahasiswa, dosen, dan asisten dosen melalui credential kampus
- **Regula Face SDK**: Face recognition untuk verifikasi identitas mahasiswa (flutter_face_api)

## Keamanan & Compliance
- JWT token-based authentication dengan access token + refresh token
- Token expiry 12 jam (configurable)
- Password hashing menggunakan bcrypt
- CORS configuration dengan allowed origins
- Role-based middleware enforcement pada setiap route group
- Session storage + cookie untuk manajemen sesi di web
- Secure storage pada mobile (flutter_secure_storage)
- Docker non-root user untuk production container

## Project Management & Methodology
- -

## Git Workflow
- -

## Testing Strategy
- **E2E Testing**: Cypress untuk testing flow login dan fitur web
- **Manual Testing**: Pengujian langsung oleh tim pengembang
- **Unit Testing**: -
- **Load Testing**: -

## Deployment & Infrastructure
- **Environment**: Development (localhost) → Production (GCP VM)
- **Frontend Deploy**: Docker multi-stage build (dependencies → build → runner)
- **Backend Deploy**: Go binary di GCP VM (port 8080)
- **Reverse Proxy**: Nginx Alpine (port 80 → Next.js port 3000)
- **Container Orchestration**: Docker Compose
- **Health Check**: wget spider di container Next.js

## Monitoring, Logging & Alerting
- Console logging pada backend (Go standard log)
- Console logging pada frontend (browser console + AuthContext logs)
- -

## Backup & Disaster Recovery
- -

## Risks & Mitigation

| Risk                                    | Probability | Impact   | Mitigation                                     |
|-----------------------------------------|-------------|----------|-------------------------------------------------|
| Campus API down / tidak accessible      | Medium      | High     | Graceful error handling + fallback admin login   |
| Face recognition akurasi rendah         | Medium      | Medium   | Fallback ke QR Code attendance                  |
| QR code dishare ke mahasiswa lain       | Medium      | Medium   | QR expiry + session-bound + face verification    |
| Server GCP downtime                     | Low         | High     | Docker auto-restart + health check               |
| Data tidak sinkron dengan campus API    | Low         | Medium   | Manual sync endpoint + idempotent operations     |

## Success Metrics / KPIs
- Persentase mata kuliah yang menggunakan presensi digital > 80%
- Akurasi data kehadiran > 99%
- Waktu rekapitulasi kehadiran < 1 menit (real-time)
- Tingkat kecurangan absensi (titip absen) mendekati 0%
- -

## Roadmap & Future Enhancements
**Phase 2 (Jika dilanjutkan)**  
- Push notification untuk reminder presensi  
- Geofencing untuk validasi lokasi presensi  
- Analytics dashboard dengan trend kehadiran  
- Multi-bahasa (Bahasa Indonesia + English)

**Phase 3 (Masa Depan)**  
- Integrasi dengan LMS  
- AI-based attendance analytics  
- Offline-first mobile dengan auto sync  
- Export ke format PDF

## Tim Pengembang & RACI
- Project Manager: Jody Edriano Pangaribuan  
- Anggota: Marshanda Kasih Simangunsong  
- Anggota: Anno Deritman Siregar  
- Anggota: Jessica Anastasya Purba  
- Anggota: Prapanca Ronaldo Panjaitan  
- Anggota: Kezia M S Siahaan  
- Total: 6 orang (Group 4, Final Project 2 — Institut Teknologi Del)

## Jadwal Proyek (Milestone Utama)
- -

## Dokumentasi Lengkap
- API Routes: Didefinisikan di `backend/cmd/server/main.go` (100+ endpoint)  
- Frontend Routes: Next.js App Router (`src/app/`)  
- Mobile Features: `mobile-app/lib/features/`  
- Environment Config: `.env.example`  
- Deployment: `Dockerfile`, `docker-compose.yml`, `deploy.sh`

## Glossary
- **RBAC**: Role-Based Access Control  
- **JWT**: JSON Web Token  
- **QR Code**: Quick Response Code  
- **GORM**: Go Object-Relational Mapping  
- **SSR**: Server-Side Rendering  
- **GCP**: Google Cloud Platform  
- **CRUD**: Create, Read, Update, Delete  
- **ORM**: Object-Relational Mapping  

## Changelog
- v1.0.0 – 21 Feb 2026: Initial release documentation

## Lisensi
© 2026 Institut Teknologi Del | Developed by Group 4, Final Project 2. All rights reserved.

---

**Dibuat oleh**: Group 4 — Final Project 2, Institut Teknologi Del  
**Approved by**: -  

---

**Catatan**: Bagian yang diisi dengan "-" menandakan informasi yang belum tersedia atau belum dikonfirmasi dari analisis codebase. Silakan dilengkapi sesuai kebutuhan.
