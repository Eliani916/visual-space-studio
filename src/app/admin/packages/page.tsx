import PackageList from "@/features/package/components/PackageList";

export const metadata = {
  title: "Manajemen Paket | Photobooth Admin",
};

export default function AdminPackagesPage() {
  return (
    <div className="container mx-auto p-8">
      <PackageList />
    </div>
  );
}
