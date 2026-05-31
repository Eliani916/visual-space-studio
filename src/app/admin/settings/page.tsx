import SettingsForm from "@/features/booking/components/SettingsForm";
import { getSettings } from "@/features/booking/actions/settings.actions";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Sistem | Photobooth Admin",
};

export default async function AdminSettingsPage() {
  const settingsRes = await getSettings();
  const initialData = settingsRes.success && settingsRes.data ? settingsRes.data : {
    openingHour: "09:00",
    closingHour: "21:00",
    dpMinDaysAhead: 7,
    dpDeadlineHours: 24,
    fullPaymentDeadlineHours: 24
  };

  return (
    <div className="container mx-auto p-8">
      <SettingsForm initialData={initialData} />
    </div>
  );
}
