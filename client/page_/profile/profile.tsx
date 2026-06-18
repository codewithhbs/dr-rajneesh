"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { useGetProfile } from "@/hooks/use-getprofile";
import axios from "axios";

const API_BASE_URL = "https://api.drrajneeshkant.in/api/v1/full/user";

/* ----------------------------- Types ----------------------------- */

interface UserProfile {
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  aadhhar?: string; // matches backend key (req.body.aadhhar)
}

interface ClinicContactDetails {
  email: string;
  phone_numbers: string[];
  clinic_address: string;
}

interface Clinic {
  _id: string;
  clinic_name: string;
  clinic_contact_details: ClinicContactDetails;
}

interface Service {
  _id: string;
  title: string;
  price: number;
  discount_price: number;
  tag?: string;
}

interface RevisitHistory {
  visitNo: number;
  visitDate: string;
  notes?: string;
  doctorNotes?: string;
  status: string;
}

interface Booking {
  _id: string;
  bookingId: string;
  clinic: Clinic;
  service: Service;
  appointmentDate: string;
  appointmentTime: string;
  amount: number;
  discountAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  totalVisits: number;
  completedVisits: number;
  cancelledReason?: string;
  revisitHistory: RevisitHistory[];
  createdAt: string;
  updatedAt: string;
}

interface ProfileForm {
  name: string;
  phone: string;
  email: string;
  aadhhar: string;
}

/* --------------------------- Helpers ----------------------------- */

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const maskAadhaar = (val?: string) => {
  if (!val) return "Not added";
  const digits = val.replace(/\s+/g, "");
  if (digits.length < 4) return val;
  return `XXXX XXXX ${digits.slice(-4)}`;
};

const bookingStatusStyle = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "confirmed":
      return "bg-sky-50 text-sky-700 ring-sky-600/20";
    case "cancelled":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
};

const paymentStatusStyle = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "refunded":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";
    case "pending":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "failed":
      return "bg-rose-50 text-rose-700 ring-rose-600/20";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-500/20";
  }
};

const initials = (name?: string) =>
  (name || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/* --------------------------- Component --------------------------- */

const PatientDashboard = () => {
  const cookieToken = Cookies.get("token");
  const {
    data: user,
    loading: userLoading,
    error: userError,
    getProfile: refetch,
  } = useGetProfile() as {
    data: UserProfile | null;
    loading: boolean;
    error: unknown;
    getProfile: () => void | Promise<void>;
  };

  // bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    email: "",
    aadhhar: "",
  });

  /* ----------------------- Bookings fetch ----------------------- */
  const fetchMyBookings = async () => {
    try {
      setBookingsLoading(true);
      setBookingsError(null);
      const res = await axios.get(`${API_BASE_URL}/booking`, {
        headers: { Authorization: `Bearer ${cookieToken}` },
      });
      setBookings(res.data?.data ?? []);
    } catch (error: any) {
      setBookingsError(
        error?.response?.data?.message || "Could not load your bookings."
      );
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (cookieToken) fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookieToken]);

  /* ----------------- Sync form when entering edit ---------------- */
  const startEditing = () => {
    setForm({
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      aadhhar: user?.aadhhar ?? "",
    });
    setSaveError(null);
    setSaveSuccess(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    // light validation
    if (!form.name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSaveError("Enter a valid email address.");
      return;
    }
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      setSaveError("Enter a valid 10-digit phone number.");
      return;
    }
    if (form.aadhhar && form.aadhhar.replace(/\s+/g, "").length !== 12) {
      setSaveError("Aadhaar must be 12 digits.");
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      await axios.put(
        `${API_BASE_URL}/profile`,
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          aadhhar: form.aadhhar.replace(/\s+/g, ""),
        },
        { headers: { Authorization: `Bearer ${cookieToken}` } }
      );

      await refetch();
      setSaveSuccess("Profile updated.");
      setIsEditing(false);
    } catch (error: any) {
      setSaveError(
        error?.response?.data?.message || "Could not update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(
      (b) => b.bookingStatus === "completed"
    ).length;
    const upcoming = bookings.filter(
      (b) => b.bookingStatus === "confirmed"
    ).length;
    const spent = bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
    return { total, completed, upcoming, spent };
  }, [bookings]);

  /* ------------------------------ UI ----------------------------- */

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">My account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your details and track your appointments.
          </p>
        </header>

        {/* ----------------------- Profile card ---------------------- */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-semibold text-white ring-2 ring-white/30">
                {userLoading ? "•••" : initials(user?.name)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-white">
                  {userLoading ? "Loading…" : user?.name || "Your profile"}
                </h2>
                <p className="truncate text-sm text-emerald-50/90">
                  {user?.email || "No email added"}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            {userError && (
              <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Could not load your profile. Please refresh.
              </div>
            )}

            {saveSuccess && !isEditing && (
              <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {saveSuccess}
              </div>
            )}

            {!isEditing ? (
              <>
                <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                  <Field label="Full name" value={user?.name || "Not added"} />
                  <Field label="Phone" value={user?.phone || "Not added"} />
                  <Field label="Email" value={user?.email || "Not added"} />
                  <Field label="Aadhaar" value={maskAadhaar(user?.aadhhar)} />
                </div>
                <div className="mt-6">
                  <button
                    onClick={startEditing}
                    disabled={userLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    Edit profile
                  </button>
                </div>
              </>
            ) : (
              <div>
                {saveError && (
                  <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {saveError}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Input
                    label="Full name"
                    value={form.name}
                    onChange={(v) => handleChange("name", v)}
                    placeholder="Enter your name"
                  />
                  <Input
                    label="Phone"
                    value={form.phone}
                    onChange={(v) => handleChange("phone", v)}
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                  />
                  <Input
                    label="Email"
                    value={form.email}
                    onChange={(v) => handleChange("email", v)}
                    placeholder="you@example.com"
                    type="email"
                  />
                  <Input
                    label="Aadhaar"
                    value={form.aadhhar}
                    onChange={(v) => handleChange("aadhhar", v)}
                    placeholder="12-digit Aadhaar"
                    inputMode="numeric"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* -------------------------- Stats -------------------------- */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total bookings" value={String(stats.total)} />
          <StatCard label="Upcoming" value={String(stats.upcoming)} />
          <StatCard label="Completed" value={String(stats.completed)} />
          <StatCard label="Total paid" value={inr(stats.spent)} />
        </section>

        {/* ------------------------ Bookings ------------------------- */}
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            My bookings
          </h2>

          {bookingsLoading ? (
            <div className="space-y-4">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : bookingsError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center">
              <p className="text-sm text-rose-700">{bookingsError}</p>
              <button
                onClick={fetchMyBookings}
                className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No bookings yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your appointments will show up here once you book a service.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <BookingCard key={b._id} booking={b} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

/* --------------------------- Subviews ---------------------------- */

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
  </div>
);

const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text" | "email";
}) => (
  <label className="block">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </span>
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
    />
  </label>
);

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
      {label}
    </p>
    <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
  </div>
);

const Badge = ({
  text,
  className,
}: {
  text: string;
  className: string;
}) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${className}`}
  >
    {text}
  </span>
);

const BookingCard = ({ booking: b }: { booking: Booking }) => {
  const progress =
    b.totalVisits > 0 ? (b.completedVisits / b.totalVisits) * 100 : 0;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {b.service?.title}
            </h3>
            {b.service?.tag && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                {b.service.tag}
              </span>
            )}
          </div>
          <p className="mt-0.5 font-mono text-xs text-slate-400">
            {b.bookingId}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            text={b.bookingStatus}
            className={bookingStatusStyle(b.bookingStatus)}
          />
          <Badge
            text={b.paymentStatus}
            className={paymentStatusStyle(b.paymentStatus)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Appointment
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {formatDate(b.appointmentDate)} · {b.appointmentTime}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Clinic
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {b.clinic?.clinic_name}
          </p>
          <p className="text-xs text-slate-500">
            {b.clinic?.clinic_contact_details?.clinic_address}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Amount
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {inr(b.amount)}{" "}
            {b.discountAmount > 0 && (
              <span className="text-xs font-normal text-emerald-600">
                ({inr(b.discountAmount)} off)
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500">
            Paid {inr(b.paidAmount)}
            {b.dueAmount > 0 && ` · Due ${inr(b.dueAmount)}`}
          </p>
        </div>

      </div>

      {b.cancelledReason && (
        <div className="border-t border-slate-100 bg-rose-50/50 px-6 py-3">
          <p className="text-xs text-rose-700">
            <span className="font-medium">Cancelled:</span> {b.cancelledReason}
          </p>
        </div>
      )}

      {b.revisitHistory?.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Visit history
          </p>
          <ul className="space-y-2">
            {b.revisitHistory.map((v) => (
              <li
                key={v.visitNo}
                className="flex items-start gap-3 text-sm text-slate-600"
              >
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-emerald-100 text-xs font-medium text-emerald-700">
                  {v.visitNo}
                </span>
                <span>
                  <span className="font-medium text-slate-900">
                    {formatDate(v.visitDate)}
                  </span>{" "}
                  · {v.status}
                  {v.doctorNotes && (
                    <span className="block text-xs text-slate-500">
                      Doctor: {v.doctorNotes}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};

export default PatientDashboard;