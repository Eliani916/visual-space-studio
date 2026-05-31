import AdminBookingList from "@/features/booking/components/AdminBookingList";

export const metadata = {
  title: "Daftar Booking | Photobooth Admin",
};

export default function AdminBookingsPage() {
  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <AdminBookingList />
    </div>
  );
}
