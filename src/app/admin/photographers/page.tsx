import PhotographerList from "@/features/auth/components/PhotographerList";

export const metadata = {
  title: "Manajemen Fotografer | Photobooth Admin",
};

export default function AdminPhotographersPage() {
  return (
    <div className="container mx-auto p-8 bg-slate-50 dark:bg-zinc-950/20 min-h-screen">
      <PhotographerList />
    </div>
  );
}
