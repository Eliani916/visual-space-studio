import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoader } from "@/components/ui/global-loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | Visual Space",
    default: "Visual Space - Self-Photobooth Premium Realtime & Estetik",
  },
  description: "Studio self-photobooth premium mandiri dengan reservasi realtime, konfirmasi otomatis, gerbang pembayaran instan QRIS/Transfer, dan unduh foto resolusi tinggi instan.",
  keywords: [
    "self-photobooth",
    "photobooth jakarta",
    "studio foto mandiri",
    "self-photo studio",
    "visual space studio",
    "photobooth estetik",
    "booking photobooth online"
  ],
  authors: [{ name: "Visual Space Studio" }],
  metadataBase: new URL("https://visual-space-nine.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://visual-space-nine.vercel.app",
    title: "Visual Space - Self-Photobooth Premium Realtime & Estetik",
    description: "Studio self-photobooth premium mandiri dengan reservasi realtime, konfirmasi otomatis, gerbang pembayaran instan QRIS/Transfer, dan unduh foto resolusi tinggi instan.",
    siteName: "Visual Space",
    images: [
      {
        url: "/image/paket/studio.png",
        width: 1200,
        height: 630,
        alt: "Visual Space Studio Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Visual Space - Self-Photobooth Premium Realtime & Estetik",
    description: "Studio self-photobooth premium mandiri dengan reservasi realtime, konfirmasi otomatis, gerbang pembayaran instan QRIS/Transfer, dan unduh foto resolusi tinggi instan.",
    images: ["/image/paket/studio.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <GlobalLoader />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
