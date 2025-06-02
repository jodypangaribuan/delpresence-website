# Panduan Deployment Backend API delpresence.site

Dokumen ini berisi panduan cara melakukan deployment backend API delpresence.site dengan menggunakan domain api.delpresence.site.

## Prasyarat

- VPS/VM dengan IP publik
- Domain `api.delpresence.site` yang telah dikonfigurasi pada DNS untuk mengarah ke IP publik VM
- Docker dan Docker Compose terinstal pada VM
- Port 80 dan 443 terbuka pada firewall VM

## Langkah-langkah Deployment

### 1. Persiapan Konfigurasi

1. Clone repository ini ke VM Anda:
   ```bash
   git clone [repository-url] delpresence-website
   cd delpresence-website/backend
   ```

2. Buat file `.env` untuk konfigurasi environment variables:
   ```bash
   touch .env
   ```

3. Isi file `.env` dengan konfigurasi yang diperlukan:
   ```
   DB_PASSWORD=password_postgres_anda
   JWT_SECRET=secret_key_yang_kuat
   CORS_ALLOWED_ORIGINS=https://delpresence.site
   ```

4. Pastikan Anda telah mengubah email di `init-letsencrypt.sh`:
   ```bash
   # Buka file dengan editor
   nano init-letsencrypt.sh
   
   # Ubah nilai email untuk notifikasi Let's Encrypt
   email="your-email@example.com"
   ```

### 2. Inisialisasi Sertifikat SSL

1. Jalankan skrip inisialisasi untuk mendapatkan sertifikat SSL:
   ```bash
   ./init-letsencrypt.sh
   ```

   Skrip ini akan:
   - Membuat sertifikat dummy
   - Menjalankan Nginx untuk memverifikasi domain
   - Mendapatkan sertifikat SSL dari Let's Encrypt
   - Memuat ulang konfigurasi Nginx

### 3. Jalankan Layanan

1. Setelah sertifikat SSL berhasil diperoleh, jalankan seluruh layanan:
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

### 4. Verifikasi Deployment

1. Buka browser dan akses `https://api.delpresence.site/api/students/by-user-id/1` untuk memverifikasi API berjalan dengan baik.

2. Jika Anda melihat response JSON, berarti API sudah berhasil di-deploy dengan domain yang dikonfigurasi.

## Troubleshooting

### Masalah SSL

Jika sertifikat SSL tidak berhasil diperoleh:

1. Pastikan domain `api.delpresence.site` sudah dikonfigurasi pada DNS untuk mengarah ke IP publik VM Anda
2. Pastikan port 80 dan 443 terbuka pada firewall VM
3. Periksa log certbot:
   ```bash
   docker compose logs certbot
   ```

### Masalah Koneksi Database

Jika aplikasi tidak dapat terhubung ke database:

1. Periksa log API:
   ```bash
   docker compose logs api
   ```

2. Pastikan kredensial database di file `.env` sudah benar

## Pemeliharaan

### Memperbarui Sertifikat SSL

Sertifikat SSL dari Let's Encrypt berlaku selama 90 hari. Renewal otomatis sudah dikonfigurasi melalui container certbot. Namun, jika Anda perlu memperbarui secara manual:

```bash
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

### Backup Database

Lakukan backup database secara berkala:

```bash
docker compose exec db pg_dump -U postgres delpresence > backup_$(date +%Y%m%d).sql
``` 