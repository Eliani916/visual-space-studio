# 📸 Visual Space - Modern Self-Photo Studio & Photobooth Web App

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**Visual Space** adalah platform manajemen studio foto mandiri (self-photo studio) modern yang dirancang untuk mempermudah proses booking paket foto, pembayaran instan melalui Payment Gateway, manajemen antrean studio secara real-time, cetak foto pilihan pelanggan, dan galeri digital.

---

## ✨ Fitur Utama

- 🔐 **Multi-role Authentication**: Akun khusus untuk Admin, Fotografer, dan Pelanggan dengan hak akses terproteksi (via Next-Auth & Next.js Middleware).
- 📅 **Sistem Booking & Paket**: Manajemen pilihan paket foto studio (seperti jumlah cetak, durasi, dll.) serta jadwal booking yang fleksibel.
- 💳 **Integrasi Payment Gateway**: Pembayaran otomatis dan aman menggunakan **Midtrans Client** (Bank Transfer, E-wallet, dll.).
- ⏳ **Antrean Real-time**: Sistem antrean interaktif menggunakan **Pusher Websocket** untuk memantau status antrean secara langsung (check-in, in-progress, finished).
- 🖼️ **Galeri Foto Pelanggan**: Fotografer mengunggah foto langsung ke galeri pelanggan, di mana pelanggan dapat menandai foto yang ingin dicetak (Print Selection).
- 🌓 **Tema Gelap & Terang**: Tampilan premium yang ramah mata dengan dukungan Dark/Light mode menggunakan Tailwind CSS v4 & Shadcn UI.

---

## 📁 Struktur Folder & Fungsinya

Berikut adalah peta struktur direktori proyek **Visual Space**:

```text
📁 visual-space
├── 📁 prisma                      # Konfigurasi database & data seeding
│   ├── 📄 schema.prisma           # Skema database MySQL menggunakan Prisma ORM
│   └── 📄 seed.js                 # Script untuk mengisi data awal (seeding) ke database
├── 📁 public                      # Aset statis aplikasi (gambar, ikon, font)
│   └── 📁 uploads                 # Folder penyimpanan foto hasil studio yang diunggah
├── 📁 src                         # Source code utama aplikasi
│   ├── 📁 app                     # Struktur routing berbasis App Router (Next.js)
│   │   ├── 📁 admin               # Dashboard khusus Admin (kelola paket, user, transaksi)
│   │   ├── 📁 api                 # Endpoint API (booking, payment, pusher, authentication)
│   │   ├── 📁 booking             # Fitur & alur booking sesi foto bagi pelanggan
│   │   ├── 📁 dashboard           # Dashboard pelanggan untuk melihat riwayat & galeri foto
│   │   ├── 📁 fotografer          # Halaman fotografer untuk mengunggah & memproses foto studio
│   │   ├── 📁 login               # Halaman autentikasi login pengguna
│   │   ├── 📁 register            # Halaman pendaftaran akun pelanggan baru
│   │   ├── 📄 globals.css         # Styling global menggunakan Tailwind CSS v4
│   │   ├── 📄 layout.tsx          # Tata letak (layout) utama aplikasi
│   │   └── 📄 page.tsx            # Halaman beranda utama (Landing Page)
│   ├── 📁 components              # Komponen antarmuka pengguna (UI Components)
│   │   ├── 📁 ui                  # Komponen UI modular dari Shadcn UI (Buttons, Inputs, dll.)
│   │   └── 📄 theme-provider.tsx     # Provider tema gelap/terang (Dark Mode)
│   ├── 📁 features                # Modul logika bisnis terisolasi untuk struktur modular
│   │   ├── 📁 auth                # Komponen dan logika autentikasi
│   │   ├── 📁 booking             # Logika formulir booking & penjadwalan
│   │   ├── 📁 gallery             # Logika penampilan foto & pemilihan foto cetak
│   │   ├── 📁 package             # Logika pengelolaan opsi paket studio
│   │   └── 📁 queue               # Logika antrean real-time
│   ├── 📁 lib                     # Inisialisasi & konfigurasi library pihak ketiga
│   │   ├── 📄 auth.ts             # Konfigurasi Next-Auth (provider, token & session)
│   │   ├── 📄 prisma.ts           # Koneksi tunggal (Singleton) ke Prisma Client
│   │   ├── 📄 pusher.ts           # Konfigurasi Pusher Client & Server untuk websocket
│   │   └── 📄 utils.ts            # Fungsi utilitas (seperti Tailwind classes merger 'cn')
│   ├── 📁 repositories            # Layer akses data (data access object / DAO)
│   │   └── 📄 base.repository.ts  # Class dasar untuk abstraksi query database
│   ├── 📁 services                # Layer bisnis logik eksternal
│   │   └── 📄 midtrans.service.ts # Integrasi request transaksi ke API Midtrans
│   ├── 📁 types                   # Deklarasi tipe data TypeScript global
│   ├── 📁 utils                   # Kumpulan helper function umum (formatting uang, tanggal)
│   ├── 📁 validations             # Skema validasi form & input menggunakan library Zod
│   └── 📄 middleware.ts           # Middleware Next.js untuk proteksi route berdasarkan peran (Role)
├── 📄 .env                        # File konfigurasi variabel lingkungan lokal
├── 📄 Dockerfile                  # Instruksi pembuatan image Docker untuk build container Next.js
├── 📄 docker-compose.yml          # Orkestrasi container Docker untuk MySQL & Next.js App
├── 📄 package.json                # Dependensi proyek dan perintah-perintah script (scripts)
└── 📄 tsconfig.json               # Konfigurasi compiler TypeScript
```

---

## 🛠️ Persyaratan Sistem (Prerequisites)

Sebelum memulai instalasi, pastikan perangkat Anda sudah terpasang:
- **Node.js** (Rekomendasi v20.x atau v22.x LTS) & **npm**
- **MySQL Database** (Untuk instalasi lokal non-Docker)
- **Docker & Docker Compose** (Untuk instalasi menggunakan Docker)

---

## 🚀 Panduan Instalasi Lokal (Tanpa Docker)

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi langsung di mesin lokal Anda:

### 1. Kloning Repositori
```bash
git clone https://github.com/username/visual-space.git
cd visual-space
```

### 2. Pasang Dependensi Proyek
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Buat file bernama `.env` di direktori utama dan isi dengan konfigurasi berikut:
```env
# Koneksi Database MySQL Lokal
DATABASE_URL="mysql://root:password_mysql_kamu@localhost:3306/photobooth_db"

# Konfigurasi Next-Auth
NEXTAUTH_SECRET="buat-kunci-rahasia-nextauth-disini-bebas-acak"
NEXTAUTH_URL="http://localhost:3001"

# API Key Midtrans (Dapatkan dari Dashboard Sandbox Midtrans)
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_SERVER_KEY"
MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_CLIENT_KEY"
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_CLIENT_KEY"

# Pusher Channels (Dapatkan dari Dashboard Pusher)
PUSHER_APP_ID="your_pusher_app_id"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```
> [!IMPORTANT]
> Pastikan database MySQL Anda sudah berjalan dan nama database (`photobooth_db`) sesuai dengan yang ada pada `DATABASE_URL`.

### 4. Sinkronisasi Database (Prisma Migrations & Seeding)
Jalankan perintah berikut untuk membuat tabel-tabel di database Anda dan mengisi data awal (roles, default admin, dummy packages):
```bash
# Push skema database Prisma ke MySQL
npx prisma db push

# Isi database dengan data awal (seed)
npx prisma db seed
```

### 5. Jalankan Aplikasi dalam Mode Pengembangan
```bash
npm run dev
```
Buka browser Anda dan akses **[http://localhost:3001](http://localhost:3001)**.

---

## 🐳 Panduan Instalasi Menggunakan Docker

Menggunakan Docker mempermudah Anda menjalankan aplikasi beserta database MySQL secara instan tanpa perlu memasang MySQL secara lokal di komputer.

### 1. Konfigurasi File `.env`
Buat file `.env` di direktori utama. Docker Compose akan mendeteksi file `.env` ini.
```env
# Kunci Rahasia Next-Auth
NEXTAUTH_SECRET="buat-kunci-rahasia-nextauth-disini-bebas-acak"
NEXTAUTH_URL="http://localhost:3000"

# Midtrans & Pusher (Lengkapi dengan API keys Anda)
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_SERVER_KEY"
MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_CLIENT_KEY"
MIDTRANS_IS_PRODUCTION="false"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_CLIENT_KEY"

PUSHER_APP_ID="your_pusher_app_id"
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
PUSHER_SECRET="your_pusher_secret"
NEXT_PUBLIC_PUSHER_CLUSTER="ap1"
```

> [!NOTE]
> Anda tidak perlu mengonfigurasi `DATABASE_URL` di file `.env` untuk Docker, karena Docker Compose (`docker-compose.yml`) telah memetakan `DATABASE_URL` secara otomatis untuk menghubungkan container aplikasi Next.js ke container MySQL dengan host internal `db`.

### 2. Jalankan Docker Compose
Jalankan perintah ini di terminal untuk mengunduh image, membangun container, dan menjalankannya di latar belakang:
```bash
docker compose up --build -d
```
atau (untuk versi Docker Compose lama):
```bash
docker-compose up --build -d
```

### 3. Apa yang Terjadi Secara Otomatis di Docker?
Saat Anda menjalankan perintah di atas:
1. Container MySQL (`photobooth_db`) akan menyala dan dikonfigurasi password root-nya.
2. Container aplikasi Next.js (`photobooth_app`) akan menunggu hingga database MySQL benar-benar siap dan sehat (*healthy*).
3. Setelah siap, docker container akan otomatis menjalankan `npx prisma db push` untuk mensinkronkan tabel, lalu menjalankan `npx prisma db seed` untuk mengisi data awal, dan terakhir meluncurkan server produksi (`npm start`).

### 4. Akses Aplikasi
Aplikasi akan tersedia di **[http://localhost:3000](http://localhost:3000)** (port dipetakan ke 3000 pada file docker-compose).

### 5. Mematikan Container
Untuk mematikan seluruh container dan jaringan docker:
```bash
docker compose down
```

---

## 🔑 Akun Bawaan (Default Credentials)

Setelah proses *seeding* database selesai, Anda dapat masuk ke aplikasi dengan akun bawaan berikut sesuai role yang ingin dicoba:

| Peran (Role) | Email | Password | Kegunaan |
|---|---|---|---|
| **Admin** | `admin@visualspace.com` | `password123` | Mengelola paket, verifikasi pembayaran manual, melacak riwayat transaksi & dashboard utama. |
| **Fotografer** | `foto@visualspace.com` | `password123` | Mengunggah foto hasil jepretan studio ke galeri booking pelanggan. |
| **Pelanggan** | `pelanggan@example.com` | `password123` | Melakukan pemesanan (booking), melihat status antrean, memilih foto untuk dicetak. |

---

## 📦 Skema Model Database (Prisma)

Aplikasi ini memiliki relasi database yang terstruktur:
* **User & Role**: Mengelompokkan pengguna berdasarkan kewenangan akses.
* **Booking**: Menghubungkan Pelanggan (`User`), Paket yang dipilih (`Package`), Antrean Studio (`Queue`), Informasi Pembayaran (`Payment`), serta Galeri (`Gallery`).
* **Gallery & GalleryImage**: Menyimpan daftar foto yang diunggah oleh fotografer terkait kode booking.
* **PrintSelection**: Menyimpan status foto mana saja yang dipilih pelanggan untuk dicetak fisik.
