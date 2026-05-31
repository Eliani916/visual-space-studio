import ProfileForm from "@/features/auth/components/ProfileForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profil Saya | Visual Space Fotografer",
};

export default async function PhotographerProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "FOTOGRAFER") {
    redirect("/login");
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      <ProfileForm />
    </div>
  );
}
