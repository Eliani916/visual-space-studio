import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CustomerLayoutClient from "./CustomerLayoutClient";

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PELANGGAN") {
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
    <CustomerLayoutClient user={userData}>
      {children}
    </CustomerLayoutClient>
  );
}
