# Photobooth Studio Management System Implementation Plan

Aplikasi ini adalah sistem manajemen photobooth berskala *enterprise* dengan tiga *role* utama (Admin/Kasir, Fotografer, Pelanggan), mencakup fitur booking, antrean realtime, manajemen galeri, pembayaran, serta laporan.

## 1. Architecture & Technology Stack
- **Framework Utama:** Next.js (App Router) dengan TypeScript (Strict Mode)
- **UI & Styling:** Tailwind CSS + shadcn/ui + Lucide Icons
- **Backend:** Next.js Server Actions & Route Handlers
- **Database:** MySQL + Prisma ORM
- **Authentication:** Auth.js (NextAuth) dengan JWT & Role-based Access Control (RBAC)
- **Realtime:** Socket.io (custom server terpisah untuk websocket) atau Pusher
- **State Management:** Zustand (global UI state) + React Context (jika diperlukan)
- **Form & Validation:** React Hook Form + Zod
- **File Storage:** Local Storage Node.js (`/public/uploads` atau `/storage` terpisah)
- **Containerization:** Docker & Docker Compose (MySQL, Next.js App, WebSocket Server)

## 2. Directory Structure (Clean Architecture)
Akan menggunakan pola Repository dan Service layer untuk kemudahan *maintenance* dan *testing*.

```text
src/
├── app/                  # Next.js App Router (Pages, Layouts, Route Handlers)
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── shared/           # Shared components (Navbar, Footer, etc.)
│   └── forms/            # Form components
├── features/             # Feature-based module (Clean Architecture pattern)
│   ├── auth/
│   ├── booking/
│   ├── gallery/
│   ├── payment/
│   └── queue/
├── lib/                  # Library configurations (Prisma, Socket.io client, utils)
├── services/             # Business Logic Layer
├── repositories/         # Database Access Layer (Prisma queries)
├── hooks/                # Custom React hooks
├── types/                # TypeScript Interfaces & Types
├── validations/          # Zod Schemas / DTOs
├── constants/            # Application constants (Enums, Configs)
├── utils/                # Helper functions
├── store/                # Zustand stores
└── middleware.ts         # Next.js Middleware (Auth & Role checking)
```

## 3. Database ERD & Prisma Schema Design
Berikut adalah ringkasan skema database yang akan dibangun menggunakan Prisma:

- **User & Role:** `User` (email, password, dll) berelasi dengan `Role` (ADMIN, FOTOGRAFER, PELANGGAN).
- **Packages:** `Package` (nama, harga, jumlah_cetak, deskripsi, is_active).
- **Bookings:** `Booking` (user_id, package_id, date, time, status [pending, confirmed, on_progress, completed, expired, cancelled], total_price, dll).
- **Payments:** `Payment` (booking_id, method [transfer, cash], proof_url, status [pending, DP, lunas, gagal], amount).
- **Queues:** `Queue` (booking_id, status [waiting, in_progress, finished], check_in_time).
- **Galleries:** `Gallery` (booking_id, folder_path, is_watermarked).
- **Gallery Images:** `GalleryImage` (gallery_id, file_path, file_name, uploaded_by).
- **Print Selections:** `PrintSelection` (gallery_image_id, is_printed).
- **System Settings:** `SystemSetting` (key, value) misal untuk on/off booking.
- **Activity Logs:** `ActivityLog` (user_id, action, description).

*Semua tabel akan menggunakan `created_at`, `updated_at`, dan `deleted_at` (Soft Delete).*

## 4. Docker & Containerization Setup
Kami akan menyediakan file konfigurasi untuk Containerization:
1. `Dockerfile`: Untuk mem-build Next.js app secara standalone dan optimal untuk *production*.
2. `docker-compose.yml`: Mengorkestrasi *services*:
   - `app`: Container Next.js
   - `db`: Container MySQL 8.x
   - `socket`: Container (jika kita memutuskan menggunakan custom Node.js websocket server untuk antrean real-time)

## 5. Step-by-Step Setup Project
Kami akan membagi eksekusi ke dalam fase-fase berikut:

1. **Fase 1: Inisialisasi & Setup Infrastruktur**
   - Inisialisasi project Next.js App Router dengan TypeScript.
   - Setup Tailwind CSS & shadcn/ui.
   - Setup Docker Compose untuk MySQL dan integrasi Prisma.
   - Pembuatan dan *migration* Prisma schema sesuai spesifikasi.
2. **Fase 2: Core Backend & Authentication**
   - Implementasi Repository pattern & Service layer.
   - Setup NextAuth / Custom JWT untuk Authentication & Role Authorization.
   - Setup Middleware untuk memproteksi *routes*.
3. **Fase 3: Fitur Utama (Admin & Pelanggan)**
   - CRUD Package (Paket Foto).
   - Sistem Booking Online (dengan *rules* H-7 DP / dekat hari H Cash).
   - Manajemen Pembayaran & Upload bukti transfer.
4. **Fase 4: Realtime Queue & Fotografer Dashboard**
   - Setup Socket.io atau Pusher untuk antrean *realtime*.
   - Fitur check-in pelanggan.
   - Dashboard Fotografer (menampilkan antrean secara realtime).
5. **Fase 5: Galeri & File Storage**
   - Upload Image Management (Local Storage, folder rapi per booking).
   - Fitur bulk upload dengan drag & drop.
   - Logika watermark otomatis jika belum lunas.
   - Pemilihan foto untuk cetak.
6. **Fase 6: Finalisasi & Polishing**
   - Laporan transaksi (PDF/Excel).
   - Seeder dummy data.
   - Dokumentasi API / Code conventions.

> [!IMPORTANT]
> **User Review Required**
> Mohon konfirmasi mengenai beberapa hal berikut sebelum kita mulai menulis kode:

## Open Questions
1. **Lokasi Project:** Saat ini di direktori `d:\APSI` sudah ada folder `foto-studio` berisi project Vite. Apakah Anda ingin project baru ini dibuat dalam folder terpisah (contoh: `d:\APSI\photobooth-app`), atau menimpa folder `foto-studio` yang sudah ada?
2. **Realtime System:** Untuk fitur antrean *realtime*, apakah Anda lebih memilih **Socket.io** (perlu custom node server terpisah karena App Router Next.js kurang cocok untuk WebSocket persistent connection) atau menggunakan layanan seperti **Pusher** (lebih mudah diintegrasikan dengan Next.js App Router)?
3. **Penyimpanan File:** Karena akan menggunakan Local Storage untuk foto (terutama galeri foto HQ), kami sarankan memetakan direktori penyimpanan di luar container (melalui *Docker volume bind mount*). Apakah ini sesuai harapan?
