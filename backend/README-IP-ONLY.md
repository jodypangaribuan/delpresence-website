# Panduan Deployment Backend API dengan IP dan Port

Dokumen ini berisi panduan cara melakukan deployment backend API menggunakan IP dan port saja, tanpa memerlukan domain.

## Prasyarat

- VPS/VM dengan IP publik
- Docker dan Docker Compose terinstal pada VM
- Port 80 dan 8080 terbuka pada firewall VM

## Langkah-langkah Deployment

### 1. Persiapan Konfigurasi

1. Clone repository:
   ```bash
   git clone https://github.com/jodypangaribuan/delpresence-website.git
   cd delpresence-website/backend
   ```

2. Buat file `.env`:
   ```bash
   touch .env
   ```

3. Isi file `.env` dengan konfigurasi yang diperlukan:
   ```
   DB_PASSWORD=password_postgres_anda
   JWT_SECRET=secret_key_yang_kuat
   CORS_ALLOWED_ORIGINS=*
   ```

### 2. Jalankan Layanan

1. Jalankan seluruh layanan:
   ```bash
   docker compose up -d
   ```

2. Periksa status layanan:
   ```bash
   docker compose ps
   ```

3. Pastikan semua layanan berjalan dengan baik dan tidak ada error:
   ```bash
   docker compose logs -f
   ```

### 3. Akses API

API dapat diakses melalui:

1. API langsung melalui port 8080:
   ```
   http://IP_VM:8080/api/...
   ```
   Contoh: `http://34.70.12.251:8080/api/students/by-user-id/1`

2. Melalui Nginx di port 80:
   ```
   http://IP_VM/api/...
   ```
   Contoh: `http://34.70.12.251/api/students/by-user-id/1`

## Troubleshooting

### Masalah Koneksi

Jika API tidak dapat diakses:

1. Periksa apakah port terbuka pada firewall VM:
   ```bash
   sudo ufw status
   ```

2. Jika port perlu dibuka:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 8080/tcp
   ```

### Masalah Koneksi Database

Jika aplikasi tidak dapat terhubung ke database:

1. Periksa log API:
   ```bash
   docker compose logs api
   ```

2. Pastikan kredensial database di file `.env` sudah benar

## Pemeliharaan

### Backup Database

Lakukan backup database secara berkala:

```bash
docker compose exec db pg_dump -U postgres delpresence > backup_$(date +%Y%m%d).sql
```

### Update Aplikasi

Untuk update aplikasi:

```bash
git pull
docker compose down
docker compose up -d --build
``` 