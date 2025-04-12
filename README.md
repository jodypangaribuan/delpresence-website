# DelPresence - Sistem Kehadiran Digital IT Del

DelPresence adalah platform terintegrasi untuk manajemen presensi perkuliahan yang efisien, cepat dan akurat bagi seluruh civitas akademika Institut Teknologi Del.

## Struktur Proyek

Proyek ini dibangun menggunakan Next.js dengan pendekatan Clean Architecture:

```
src/
├── app/              # Next.js app router
├── components/       # Komponen UI reusable
│   └── ui/           # Komponen UI dasar
├── features/         # Fitur per domain
│   └── home/         # Implementasi fitur homepage 
├── shared/           # Kode yang digunakan di seluruh aplikasi
│   ├── hooks/        # React hooks
│   ├── styles/       # Shared styles
│   ├── types/        # Type definitions
│   └── utils/        # Utility functions dan constants
└── public/           # Asset statis
    └── images/       # Gambar dan media
```

## Fitur

- Homepage responsif dengan animasi interaktif
- Stack component untuk menampilkan gambar dengan efek 3D
- Kompatibilitas dengan device mobile dan desktop
- Integrase penuh dengan backend API (work in progress)

## Teknologi

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Animasi**: Framer Motion
- **Deployment**: Vercel

## Development

### Persyaratan

- Node.js 18+ 
- npm atau yarn

### Instalasi

```bash
# Clone repository
git clone https://github.com/your-username/delpresence-website.git
cd delpresence-website

# Install dependencies
npm install
# atau
yarn install

# Jalankan development server
npm run dev
# atau
yarn dev
```

## Deployment

Aplikasi dapat di-deploy menggunakan Vercel atau platform hosting lainnya yang mendukung Next.js.

```bash
npm run build
# atau
yarn build
```

## Kontribusi

Kontribusi dipersilakan! Silakan buka issue atau submit pull request.

## Lisensi

© 2023 Institut Teknologi Del. All Rights Reserved.
