import AdminPrintList from "./AdminPrintList";

export const metadata = {
  title: "Kelola Cetak Foto | Admin Visual Space",
};

export default function AdminPrintsPage() {
  return (
    <div className="container mx-auto p-8 bg-gray-50 dark:bg-zinc-955/20 min-h-screen">
      <AdminPrintList />
    </div>
  );
}
