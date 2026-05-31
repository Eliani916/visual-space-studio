import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import FotograferLayoutClient from "./FotograferLayoutClient";

export default async function FotograferLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // If not authenticated or not a photographer, redirect to login
  if (!session || session.user.role !== "FOTOGRAFER") {
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
    <FotograferLayoutClient user={userData}>
      {children}
    </FotograferLayoutClient>
  );
}
