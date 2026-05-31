import QueueManager from "@/features/queue/components/QueueManager";

export const metadata = {
  title: "Manajemen Antrean | Photobooth Admin",
};

export default function AdminQueuesPage() {
  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <QueueManager />
    </div>
  );
}
