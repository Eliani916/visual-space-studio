const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Resolve the base URL dynamically from env or manual .env parsing
const baseUrl = "https://visual-space-nine.vercel.app";

async function main() {
  console.log(`Seeding database using baseUrl: ${baseUrl}`);

  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Administrator System" },
  });

  const fotoRole = await prisma.role.upsert({
    where: { name: "FOTOGRAFER" },
    update: {},
    create: { name: "FOTOGRAFER", description: "Fotografer Studio" },
  });

  const pelangganRole = await prisma.role.upsert({
    where: { name: "PELANGGAN" },
    update: {},
    create: { name: "PELANGGAN", description: "Pelanggan Studio" },
  });

  // 2. Clean Up Tables in correct order (to avoid MySQL FK constraint errors)
  console.log("Cleaning up database tables...");
  await prisma.activityLog.deleteMany({});
  await prisma.printSelection.deleteMany({});
  await prisma.galleryImage.deleteMany({});
  await prisma.gallery.deleteMany({});
  await prisma.image.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.package.deleteMany({});

  // 3. Create Users
  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Seeding users...");
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@visualspace.com",
      password: passwordHash,
      roleId: adminRole.id,
      images: {
        create: [
          { url: `${baseUrl}/image/user/admin.png` }
        ]
      }
    },
  });

  const fotografer = await prisma.user.create({
    data: {
      name: "Fotografer Utama",
      email: "foto@visualspace.com",
      password: passwordHash,
      roleId: fotoRole.id,
      images: {
        create: [
          { url: `${baseUrl}/image/user/photographer.png` }
        ]
      }
    },
  });

  const pelanggan = await prisma.user.create({
    data: {
      name: "Budi Pelanggan",
      email: "pelanggan@example.com",
      password: passwordHash,
      phoneNumber: "08123456789",
      roleId: pelangganRole.id,
      images: {
        create: [
          { url: `${baseUrl}/image/user/pelanggan.png` }
        ]
      }
    },
  });

  const userClara = await prisma.user.create({
    data: {
      name: "Clara Septiana",
      email: "clara@example.com",
      password: passwordHash,
      roleId: pelangganRole.id,
      images: {
        create: [
          { url: `${baseUrl}/image/user/pelanggan.png` }
        ]
      }
    },
  });

  const userReza = await prisma.user.create({
    data: {
      name: "Reza Aditama",
      email: "reza@example.com",
      password: passwordHash,
      roleId: pelangganRole.id,
      images: {
        create: [
          { url: `${baseUrl}/image/user/pelanggan.png` }
        ]
      }
    },
  });

  const userFani = await prisma.user.create({
    data: {
      name: "Fani & Danang",
      email: "fani@example.com",
      password: passwordHash,
      roleId: pelangganRole.id,
      images: {
        create: [
          { url: `${baseUrl}/image/user/pelanggan.png` }
        ]
      }
    },
  });

  // 4. Create Packages
  console.log("Seeding packages...");
  const pkg1 = await prisma.package.create({
    data: {
      name: "Basic Session",
      price: 150000,
      printCount: 2,
      description: "Sesi singkat & praktis untuk personal atau berpasangan.",
      features: "15 Menit Sesi Foto Mandiri\nPilihan 1 Frame Desain Eksklusif\n2 Lembar Cetak Fisik Berwarna\nSemua File Digital via Dashboard\nMaksimal 3 Orang",
      isPopular: false,
      ctaText: "Pilih Paket Basic",
      isActive: true,
      images: {
        create: [
          { url: `${baseUrl}/image/paket/basic.png` }
        ]
      }
    },
  });

  const pkg2 = await prisma.package.create({
    data: {
      name: "Studio Favorite",
      price: 250000,
      printCount: 4,
      description: "Pilihan paling populer dengan durasi lebih panjang untuk grup.",
      features: "30 Menit Sesi Foto Mandiri\nPilihan 3 Frame Desain Bebas\n4 Lembar Cetak Fisik (Berwarna & B/W)\n1 Cetak Frame Kolase Kolosal\nSemua File Digital Resolusi Tinggi\nMaksimal 6 Orang",
      isPopular: true,
      ctaText: "Pesan Terpopuler",
      isActive: true,
      images: {
        create: [
          { url: `${baseUrl}/image/paket/studio.png` }
        ]
      }
    },
  });

  const pkg3 = await prisma.package.create({
    data: {
      name: "Ultimate Party",
      price: 450000,
      printCount: 8,
      description: "Pengalaman studio penuh untuk abadikan keseruan tanpa batas.",
      features: "60 Menit Sesi Foto Mandiri\nAkses Semua Pilihan Frame Desain\n8 Lembar Cetak Fisik + Frame Kayu\nAksesoris Kostum & Properti Lengkap\nFolder Google Drive Dedicated\nKapasitas Maksimal Studio (8-10 Orang)",
      isPopular: false,
      ctaText: "Booking Sesi Ultimate",
      isActive: true,
      images: {
        create: [
          { url: `${baseUrl}/image/paket/ultimate.png` }
        ]
      }
    },
  });

  // 5. Create Default System Settings
  console.log("Seeding system settings...");
  await prisma.systemSetting.upsert({ where: { key: "OPENING_HOUR" }, update: {}, create: { key: "OPENING_HOUR", value: "09:00" } });
  await prisma.systemSetting.upsert({ where: { key: "CLOSING_HOUR" }, update: {}, create: { key: "CLOSING_HOUR", value: "21:00" } });
  await prisma.systemSetting.upsert({ where: { key: "DP_DEADLINE_HOURS" }, update: {}, create: { key: "DP_DEADLINE_HOURS", value: "24" } });
  await prisma.systemSetting.upsert({ where: { key: "FULL_PAYMENT_DEADLINE_HOURS" }, update: {}, create: { key: "FULL_PAYMENT_DEADLINE_HOURS", value: "24" } });
  await prisma.systemSetting.upsert({ where: { key: "DP_MIN_DAYS_AHEAD" }, update: {}, create: { key: "DP_MIN_DAYS_AHEAD", value: "7" } });



  // 7. Seed Completed Bookings with Reviews and proof images for testimonials
  console.log("Seeding bookings and reviews...");
  const reviewDate = new Date();
  
  await prisma.booking.create({
    data: {
      userId: userClara.id,
      packageId: pkg1.id,
      bookingDate: reviewDate,
      bookingTime: "10:00",
      status: "COMPLETED",
      totalPrice: 150000,
      reviewRating: 5,
      reviewComment: "Gokil banget sih! Hasil cetaknya cepet terus file fotonya langsung ada di dashboard dalam hitungan menit. Pilihan frame fotonya juga lucu-lucu banget!",
      images: {
        create: [
          { url: `${baseUrl}/image/booking/proof.png` }
        ]
      }
    },
  });

  await prisma.booking.create({
    data: {
      userId: userReza.id,
      packageId: pkg2.id,
      bookingDate: reviewDate,
      bookingTime: "11:00",
      status: "COMPLETED",
      totalPrice: 250000,
      reviewRating: 5,
      reviewComment: "Sistem booking-nya beneran realtime. Gak perlu ngantre lama di studio karena jadwalnya udah terkunci otomatis pas bayar pake QRIS. Pelayanannya top!",
      images: {
        create: [
          { url: `${baseUrl}/image/booking/proof.png` }
        ]
      }
    },
  });

  await prisma.booking.create({
    data: {
      userId: userFani.id,
      packageId: pkg3.id,
      bookingDate: reviewDate,
      bookingTime: "13:00",
      status: "COMPLETED",
      totalPrice: 450000,
      reviewRating: 5,
      reviewComment: "Sewa untuk acara tunangan kemarin, tamunya pada seneng banget sama frame wedding floral-nya. Kertas cetakannya tebal & warna fotonya tajam banget.",
      images: {
        create: [
          { url: `${baseUrl}/image/booking/proof.png` }
        ]
      }
    },
  });

  // 8. Create Default Landing Page Content
  console.log("Seeding landing page content...");
  
  // Features
  await prisma.landingFeature.deleteMany({});
  await prisma.landingFeature.createMany({
    data: [
      {
        title: "Reservasi Waktu Realtime",
        description: "Pilih tanggal dan slot jam kosong secara presisi di website. Sistem kami secara instan memblokir jadwal terkonfirmasi, menjamin tidak ada tumpukan jadwal.",
        icon: "Calendar",
        order: 0
      },
      {
        title: "Gerbang Pembayaran Instan",
        description: "Terintegrasi aman dengan Midtrans. Lakukan pembayaran uang muka (DP) atau pelunasan instan menggunakan QRIS, e-Wallet, atau Transfer Bank pilihan Anda.",
        icon: "CreditCard",
        order: 1
      },
      {
        title: "Unduh File & Cetak Instan",
        description: "Setelah selesai memotret, file asli dan hasil cetak frame langsung terunggah ke akun Anda. Unduh dan bagikan foto instan kapan saja tanpa ribet.",
        icon: "Download",
        order: 2
      }
    ]
  });

  // Steps
  await prisma.landingStep.deleteMany({});
  await prisma.landingStep.createMany({
    data: [
      {
        stepNumber: 1,
        title: "Pilih Sesi & Jadwal",
        description: "Pilih paket layanan foto yang sesuai, lalu pilih tanggal dan jam kosong langsung di kalender web."
      },
      {
        stepNumber: 2,
        title: "Konfirmasi Pembayaran",
        description: "Lakukan pembayaran deposit (DP) secara otomatis menggunakan metode pembayaran instan pilihan Anda."
      },
      {
        stepNumber: 3,
        title: "Datang & Berfoto",
        description: "Datang ke studio sesuai jadwal, gunakan remote shutter nirkabel untuk berfoto sesuka hati Anda."
      },
      {
        stepNumber: 4,
        title: "Cetak & Unduh Foto",
        description: "Dapatkan kertas cetak fisik premium secara langsung dan unduh semua file digital berkualitas tinggi di dashboard."
      }
    ]
  });

  // FAQs
  await prisma.landingFaq.deleteMany({});
  await prisma.landingFaq.createMany({
    data: [
      {
        question: "Apakah saya bisa menjadwalkan ulang (reschedule) booking?",
        answer: "Ya, Anda dapat melakukan penjadwalkan ulang (reschedule) waktu foto maksimal 24 jam sebelum jadwal yang telah dipilih sebelumnya langsung melalui dashboard pelanggan Anda.",
        order: 0
      },
      {
        question: "Berapa lama file foto digital tersimpan di dashboard?",
        answer: "File foto digital orisinal Anda akan tersimpan dengan aman di server kami dan dapat diunduh melalui dashboard pelanggan selama 30 hari terhitung sejak tanggal sesi foto dilakukan.",
        order: 1
      },
      {
        question: "Apakah pembayaran harus langsung lunas?",
        answer: "Tidak harus langsung lunas. Kami menyediakan opsi pembayaran Down Payment (DP) sebesar 50% via Midtrans untuk mengamankan slot jadwal Anda, atau Anda juga dapat langsung melunasinya.",
        order: 2
      },
      {
        question: "Berapa kapasitas maksimal studio untuk satu sesi?",
        answer: "Studio kami dirancang agar muat secara nyaman untuk sesi kelompok kecil hingga sedang, dengan batas ideal berkisar antara 8 hingga 10 orang sekali masuk.",
        order: 3
      }
    ]
  });

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
