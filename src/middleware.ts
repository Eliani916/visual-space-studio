import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Proteksi admin routes
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Proteksi fotografer routes
    if (path.startsWith("/fotografer") && token?.role !== "FOTOGRAFER") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Proteksi pelanggan routes (misal dashboard)
    if (path.startsWith("/dashboard") && token?.role !== "PELANGGAN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/fotografer/:path*", "/dashboard/:path*"],
};
