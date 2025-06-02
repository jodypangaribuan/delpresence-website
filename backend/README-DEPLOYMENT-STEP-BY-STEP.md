# Panduan Deployment Step-by-Step

Berikut adalah panduan langkah demi langkah untuk melakukan deployment API delpresence.site:

## 1. Persiapan Server

1. Pastikan server Anda sudah dipersiapkan dengan:
   - Docker terbaru (yang mendukung `docker compose` tanpa tanda hubung)
   - Port 80 dan 443 terbuka

2. Clone repository:
   ```bash
   git clone https://github.com/jodypangaribuan/delpresence-website.git
   cd delpresence-website/backend
   ```

## 2. Pengaturan DNS

1. Pastikan domain `api.delpresence.site` sudah diarahkan ke IP VM Anda (34.70.12.251)
2. Tunggu propagasi DNS (bisa memerlukan waktu beberapa menit hingga 48 jam)
3. Cek dengan perintah: `dig api.delpresence.site` atau `nslookup api.delpresence.site`

## 3. Konfigurasi Dasar

1. Buat file `.env`:
   ```bash
   touch .env
   ```

2. Isi file `.env` dengan:
   ```
   DB_PASSWORD=password_aman_anda
   JWT_SECRET=secret_key_yang_sangat_aman
   CORS_ALLOWED_ORIGINS=https://delpresence.site
   ```

3. Edit file `init-letsencrypt.sh` dan ubah alamat email:
   ```bash
   nano init-letsencrypt.sh
   # Ubah: email="your-email@example.com" menjadi email Anda yang valid
   ```

4. Pastikan file memiliki izin eksekusi:
   ```bash
   chmod +x init-letsencrypt.sh
   ```

## 4. Deployment Bertahap

### Tahap 1: Jalankan Layanan Dasar (HTTP)

1. Jalankan layanan tanpa SSL terlebih dahulu:
   ```bash
   docker compose up -d
   ```

2. Cek status layanan:
   ```bash
   docker compose ps
   ```

3. Pastikan API dapat diakses melalui HTTP:
   ```bash
   curl http://api.delpresence.site/api/students/by-user-id/1
   ```

### Tahap 2: Aktifkan SSL

1. Hentikan layanan:
   ```bash
   docker compose down
   ```

2. Jalankan skrip untuk mendapatkan sertifikat:
   ```bash
   ./init-letsencrypt.sh
   ```

3. Jika berhasil, edit file Nginx untuk mengaktifkan HTTPS:
   ```bash
   nano nginx/conf/api.conf
   # Uncomment bagian server SSL (hapus tanda # di awal baris)
   ```

4. Jalankan kembali layanan:
   ```bash
   docker compose up -d
   ```

5. Verifikasi HTTPS sudah aktif:
   ```bash
   curl https://api.delpresence.site/api/students/by-user-id/1
   ```

## Troubleshooting

### 1. Masalah SSL/Certbot

Jika muncul error `certbot: error: argument -m/--email: expected one argument`:
- Pastikan email sudah diisi di file `init-letsencrypt.sh`

Jika Nginx tidak dapat memuat sertifikat:
- Jalankan terlebih dahulu dengan konfigurasi HTTP saja
- Pastikan domain sudah benar mengarah ke server
- Cek apakah port 80 dan 443 sudah terbuka

### 2. Log dan Debugging

Untuk melihat log:
```bash
# Log Nginx
docker compose logs nginx

# Log API
docker compose logs api

# Log Certbot
docker compose logs certbot
```

### 3. Pengujian

Uji API dengan:
```bash
# Cek HTTP (awalnya)
curl -v http://api.delpresence.site/api/students/by-user-id/1

# Cek HTTPS (setelah SSL diaktifkan)
curl -v https://api.delpresence.site/api/students/by-user-id/1
```

## Langkah Opsional

### 1. Backup dan Restore

Backup database:
```bash
docker compose exec db pg_dump -U postgres delpresence > backup_$(date +%Y%m%d).sql
```

Restore database:
```bash
cat backup_file.sql | docker compose exec -T db psql -U postgres -d delpresence
```

### 2. Update Aplikasi

Untuk update aplikasi:
```bash
git pull
docker compose down
docker compose up -d --build
``` 