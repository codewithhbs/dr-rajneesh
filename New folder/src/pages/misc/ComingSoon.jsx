import { Construction } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

// Used for menu items that are wired into navigation but not built yet
// (medicine bookings, coupons). Keeps every nav link working.
export default function ComingSoon({ title = "Coming Soon" }) {
  return (
    <div>
      <PageHeader title={title} subtitle="This module is on the way." />
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Construction className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title} — Coming Soon</h3>
        <p className="mt-1 max-w-md text-sm text-gray-500">
          We're still building this section. The navigation and routing are ready, so it can be
          dropped in without touching the rest of the app.
        </p>
      </Card>
    </div>
  );
}
