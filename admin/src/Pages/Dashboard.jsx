import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Stethoscope,
  Building2,
  Pill,
  CalendarCheck,
  Newspaper,
  ArrowUpRight,
} from "lucide-react";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

// Each stat maps a count endpoint to a card. `pick` reads the number out of
// whatever shape the API returns (count / total / data).
const STATS = [
  { key: "users", label: "Total Users", endpoint: "/get-user-count", icon: Users, to: "/dashboard/users", color: "bg-blue-50 text-blue-600" },
  { key: "doctors", label: "Doctors", endpoint: "/get-doctor-count", icon: Stethoscope, to: "/dashboard/doctor", color: "bg-purple-50 text-purple-600" },
  { key: "clinics", label: "Clinics", endpoint: "/get-clinic-count", icon: Building2, to: "/dashboard/all-clinic", color: "bg-green-50 text-green-600" },
  { key: "services", label: "Treatments", endpoint: "/get-service-count", icon: Pill, to: "/dashboard/treatments", color: "bg-amber-50 text-amber-600" },
  { key: "bookings", label: "Bookings", endpoint: "/get-booking-count", icon: CalendarCheck, to: "/dashboard/sessions", color: "bg-rose-50 text-rose-600" },
  { key: "blogs", label: "Blogs", endpoint: "/get-blogs-count", icon: Newspaper, to: "/dashboard/all-blogs", color: "bg-cyan-50 text-cyan-600" },
];

const readCount = (data) => {
  if (typeof data === "number") return data;
  return data?.count ?? data?.total ?? data?.data ?? 0;
};

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all counts in parallel; a failed one just shows "—".
    Promise.all(
      STATS.map((s) =>
        api
          .get(s.endpoint)
          .then((res) => [s.key, readCount(res.data)])
          .catch(() => [s.key, null])
      )
    )
      .then((entries) => setCounts(Object.fromEntries(entries)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your clinic at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((s) => {
          const Icon = s.icon;
          const value = counts[s.key];
          return (
            <Link key={s.key} to={s.to}>
              <Card className="group p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-500">{s.label}</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {loading ? "…" : value ?? "—"}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
