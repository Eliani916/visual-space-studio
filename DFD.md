# Data Flow Diagram (DFD) - Visual Space Studio

Dokumen ini menjelaskan alur aliran data (Data Flow) di dalam Sistem Informasi Visual Space Studio, yang dijabarkan dari DFD Level 0 (Konteks Diagram) hingga DFD Level 2.

---

## 1. DFD Level 0 (Context Diagram)

Diagram Konteks menunjukkan interaksi sistem secara keseluruhan dengan entitas eksternal.

```mermaid
flowchart TD
    %% Entitas Eksternal
    C[Pelanggan]:::entity
    A[Admin]:::entity
    F[Fotografer]:::entity
    M[Midtrans Gateway]:::entity

    %% Sistem Utama
    S((0. Sistem Informasi \nVisual Space Studio)):::process

    %% Aliran Data
    C -- "Data Akun, \nData Pesanan, \nPembayaran Tunai/Transfer, \nUlasan" --> S
    S -- "Invoice, \nStatus Pesanan, \nLink Galeri Foto" --> C

    F -- "Status Ketersediaan, \nFile Foto (Galeri)" --> S
    S -- "Jadwal Pemotretan, \nData Detail Pesanan" --> F

    A -- "Data Master (Paket/Studio), \nManajemen Pengguna, \nKonfirmasi Manual" --> S
    S -- "Laporan Pendapatan, \nLaporan Pemesanan" --> A

    S -- "Permintaan Transaksi Snap" --> M
    M -- "Token Pembayaran, \nWebhook Status Bayar" --> S

    classDef entity fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a,font-weight:bold;
    classDef process fill:#e0e7ff,stroke:#4f46e5,stroke-width:3px,color:#1e1b4b,shape:circle,font-weight:bold;
```

---

## 2. DFD Level 1

Pada DFD Level 1, sistem utama (0) dipecah menjadi beberapa proses utama, yang berinteraksi dengan **Data Store** (Basis Data).

```mermaid
flowchart TD
    %% Entitas Eksternal
    E1[Pelanggan]:::entity
    E2[Admin]:::entity
    E3[Fotografer]:::entity
    E4[Midtrans]:::entity

    %% Data Stores
    D1[(D1. Users)]:::datastore
    D2[(D2. Packages & Studios)]:::datastore
    D3[(D3. Bookings)]:::datastore
    D4[(D4. Payments)]:::datastore
    D5[(D5. Galleries)]:::datastore

    %% Processes
    P1((1.0 Manajemen \nAkun & Profil)):::process
    P2((2.0 Layanan \nPemesanan)):::process
    P3((3.0 Pembayaran & \nValidasi)):::process
    P4((4.0 Sesi Foto & \nPengelolaan Galeri)):::process
    P5((5.0 Pelaporan & \nData Master)):::process

    %% Data Flow - Akun
    E1 -- Data Register/Login --> P1
    E2 -- Data Pegawai --> P1
    E3 -- Update Ketersediaan --> P1
    P1 <--> D1

    %% Data Flow - Pemesanan
    E1 -- Data Jadwal & Paket --> P2
    P2 -- Daftar Paket & Jadwal --> E1
    P2 <--> D1
    P2 <--> D2
    P2 --> D3
    P2 -- Jadwal Penugasan --> E3

    %% Data Flow - Pembayaran
    P3 -- Data Tagihan --> E1
    E1 -- Aksi Bayar --> P3
    P3 -- Request Bayar --> E4
    E4 -- Callback Status --> P3
    P3 <--> D4
    P3 --> D3

    %% Data Flow - Sesi Foto
    E3 -- Upload Foto --> P4
    P4 -- Status Proses --> E1
    P4 -- Akses Download Foto --> E1
    P4 <--> D3
    P4 <--> D5

    %% Data Flow - Laporan & Master
    E2 -- Input Paket/Studio --> P5
    P5 -- Laporan Keuangan/Booking --> E2
    P5 <--> D2
    P5 <--> D3
    P5 <--> D4

    classDef entity fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a,font-weight:bold;
    classDef process fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b,shape:circle,font-weight:bold;
    classDef datastore fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f,font-weight:bold;
```

---

## 3. DFD Level 2 (Dekomposisi Proses 2.0 - Layanan Pemesanan)

Ini adalah perincian atau dekomposisi dari proses **2.0 Layanan Pemesanan**, menunjukkan lebih detail bagaimana sistem menangani alur *booking*.

```mermaid
flowchart TD
    %% Entitas
    E1[Pelanggan]:::entity

    %% Data Stores
    D1[(D1. Users)]:::datastore
    D2[(D2. Packages & Studios)]:::datastore
    D3[(D3. Bookings)]:::datastore

    %% Sub-Processes
    P21((2.1 Cek \nKetersediaan Waktu)):::process
    P22((2.2 Penentuan \nFotografer)):::process
    P23((2.3 Perhitungan \nTotal Biaya)):::process
    P24((2.4 Pembuatan \nFaktur Booking)):::process

    %% Aliran
    E1 -- Pilih Paket & Tanggal --> P21
    P21 <--> D2
    P21 <--> D3
    P21 -- Slot Tersedia --> P22
    
    P22 <--> D1
    P22 -- Fotografer Terpilih --> P23

    E1 -- Input Promo (Jika ada) --> P23
    P23 -- Rincian Harga --> P24
    
    P24 --> D3
    P24 -- Status PENDING --> E1

    classDef entity fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a,font-weight:bold;
    classDef process fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b,shape:circle,font-weight:bold;
    classDef datastore fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f,font-weight:bold;
```

---

## 4. DFD Level 2 (Dekomposisi Proses 3.0 - Pembayaran & Validasi)

Ini adalah perincian dari proses **3.0 Pembayaran**, memperlihatkan bagaimana Gateway Midtrans terintegrasi.

```mermaid
flowchart TD
    %% Entitas
    E1[Pelanggan]:::entity
    E2[Admin]:::entity
    E4[Midtrans]:::entity

    %% Data Stores
    D3[(D3. Bookings)]:::datastore
    D4[(D4. Payments)]:::datastore

    %% Sub-Processes
    P31((3.1 Buat Data \nPembayaran)):::process
    P32((3.2 Integrasi \nGateway Snap)):::process
    P33((3.3 Validasi / \nWebhook Status)):::process

    %% Aliran
    D3 -- Ambil Total Harga --> P31
    P31 --> D4
    P31 -- Kirim Data Order --> P32

    P32 -- Req Transaksi --> E4
    E4 -- Token URL --> P32
    P32 -- Tampilkan Snap UI --> E1
    
    E1 -- Melakukan Bayar --> E4
    
    E4 -- Webhook Sukses/Gagal --> P33
    E2 -- Konfirmasi Manual (Cash) --> P33
    
    P33 --> D4
    P33 -- Ubah Status Menjadi CONFIRMED --> D3

    classDef entity fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#0f172a,font-weight:bold;
    classDef process fill:#e0e7ff,stroke:#4f46e5,stroke-width:2px,color:#1e1b4b,shape:circle,font-weight:bold;
    classDef datastore fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f,font-weight:bold;
```
