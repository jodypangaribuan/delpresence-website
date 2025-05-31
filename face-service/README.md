# DelPresence Face Recognition Service

Service ini menyediakan API untuk pendaftaran dan verifikasi wajah menggunakan DeepFace, terintegrasi dengan aplikasi DelPresence.

## Fitur

- Pendaftaran wajah mahasiswa
- Verifikasi wajah untuk absensi
- Daftar wajah terdaftar per mahasiswa
- Penghapusan data wajah

## Teknologi

- FastAPI - Framework API
- DeepFace - Library pengenalan wajah
- OpenCV - Pengolahan gambar
- Docker - Containerization

## Cara Menjalankan

### Prasyarat

- Docker dan Docker Compose terinstal
- Docker Network "delpresence-network" sudah dibuat (jika belum, jalankan `docker network create delpresence-network`)

### Menjalankan Layanan

1. Masuk ke direktori face-service:

```bash
cd face-service
```

2. Build dan jalankan service:

```bash
docker-compose up -d
```

3. Cek status service:

```bash
docker-compose ps
```

4. Lihat logs jika terjadi masalah:

```bash
docker-compose logs -f
```

5. Tes API dengan mengakses Swagger UI di:

```
http://localhost:8088/docs
```

### Integrasi dengan Backend

Pastikan backend Go terhubung ke network Docker yang sama:

```yaml
# Pada docker-compose.yml backend
networks:
  - delpresence-network
```

Dan gunakan hostname `face-recognition-api` untuk mengakses API dari backend Go.

## Endpoint API

### Pendaftaran Wajah

```
POST /api/student/face-registration
```

Request body:
```json
{
  "student_id": 123,
  "image": "base64_encoded_image_data"
}
```

### Verifikasi Wajah

```
POST /api/attendance/face-verification
```

Request body:
```json
{
  "student_id": 123,
  "image": "base64_encoded_image_data"
}
```

### Daftar Wajah Terdaftar

```
GET /api/student/{student_id}/registered-faces
```

### Hapus Data Wajah

```
DELETE /api/student/face
```

Request body:
```json
{
  "student_id": 123,
  "embedding_id": "uuid_embedding_id"
}
```

## Integrasi dengan Backend Go

Service ini didesain untuk bekerja secara independen dan berkomunikasi dengan backend Go melalui HTTP API. Backend Go dapat memanggil endpoint face-service ini untuk melakukan pendaftaran dan verifikasi wajah.

## Integrasi dengan Mobile App

Mobile app Flutter dapat berkomunikasi dengan backend Go yang sudah terintegrasi dengan face service. Kode integrasi sudah disediakan di:

- `/mobile-app/lib/features/face/data/services/face_service.dart`

## Keamanan

- Data wajah disimpan sebagai embedding vektor, bukan gambar mentah
- Gambar diproses di memori dan tidak disimpan secara permanen
- Autentikasi dapat ditambahkan ke endpoint API (belum diimplementasi)

## Penyimpanan Data

Data embedding wajah disimpan di direktori `/app/face_db`, yang dipetakan ke volume Docker `face_data` untuk persistensi. 