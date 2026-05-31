import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // If not authenticated or not an admin, redirect to login
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      images: {
        take: 1,
        select: { url: true }
      }
    }
  });

  const userData = {
    ...session.user,
    image: dbUser?.images?.[0]?.url || null
  };

  return (
    <AdminLayoutClient user={userData}>
      {children}
    </AdminLayoutClient>
  );
}
