"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar, Clock, MapPin, Phone, Mail,
  IndianRupee, AlertCircle, Printer, Building2,
  Stethoscope, Loader2, ExternalLink, CreditCard,
  Info, Timer, Package, CheckCircle, XCircle,
  ChevronRight, Star, Activity, TrendingUp,
  Shield, Hash, User
} from "lucide-react";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddOn {
  addOnId: string;
  title: string;
  price: number;
  _id: string;
  addedAt: string;
  id: string;
}

interface SessionDate {
  sessionNumber: number;
  date: string;
  time: string;
  status: string;
  _id: string;
  rescheduleHistory: unknown[];
  id: string;
}

interface TreatmentInfo {
  _id: string;
  service_name: string;
  service_small_desc: string;
  service_desc: string;
  service_status: string;
  service_session_allowed_limit: number;
  service_per_session_price: number;
  service_per_session_discount_price: number;
  service_per_session_discount_percentage: number;
  service_tag: string;
  service_slug: string;
}

interface PaymentDetails {
  subtotal?: number | string;
  addOnsTotal?: number;
  tax?: number | string;
  creditCardFee?: number | string;
  total?: number | string;
}

interface PaymentId {
  payment_details?: PaymentDetails;  // legacy field name
  paymentDetails?: PaymentDetails;   // actual API field name
  paymentMethod: string;
  razorpay_payment_id?: string;
  status?: string;
  amount?: number;
}

interface BookingData {
  patient_details: {
    name: string;
    email: string;
    phone: string;
    aadhar?: string;
  };
  cancellation: {
    refundEligible: boolean;
  };
  _id: string;
  treatment_id: TreatmentInfo | null;
  no_of_session_book: number;
  SessionDates: SessionDate[];
  session_booking_for_clinic: {
    clinic_name: string;
    clinic_contact_details: {
      email: string;
      phone_numbers: string[];
      clinic_address: string;
    };
    clinic_timings: {
      open_time: string;
      close_time: string;
      off_day: string;
    };
    clinic_images: { url: string; _id: string }[];
    clinic_map: string;
    any_special_note?: string;
    clinic_ratings?: number;
  };
  session_booking_for_doctor: {
    doctor_name: string;
    _id: string;
  };
  session_status: string;
  addOnsTotal: number;
  addOns: AddOn[];
  payment_id: PaymentId;
  totalAmount: number;
  amountPerSession: number;
  bookingNumber: string;
  nextSession?: SessionDate;
  progressPercentage: number;
  completedSessionsCount: number;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateShort(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/** Safely read payment details from either camelCase or snake_case key */
function getPaymentDetails(p: PaymentId): PaymentDetails {
  return p.paymentDetails || p.payment_details || {};
}

function formatCurrency(val?: number | string): string {
  if (val === undefined || val === null || val === "") return "—";
  const n = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed": return { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" };
    case "completed": return { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" };
    case "cancelled": return { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" };
    case "pending": return { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" };
    default: return { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, href, color = "text-slate-500" }: {
  icon: React.ElementType; label: string; value: string; href?: string; color?: string;
}) {
  const content = (
    <div className="flex items-start gap-3 py-3 group">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 group-hover:bg-slate-200 transition-colors`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800 break-words">{value || "—"}</p>
      </div>
    </div>
  );
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">{content}</a>;
  return content;
}

function SectionTitle({ icon: Icon, title, accent = "from-slate-800 to-slate-600" }: {
  icon: React.ElementType; title: string; accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingDetails({ slug }: { slug: string }) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `https://api.drrajneeshkant.in/api/v1/booking/my-bookings/${slug}`
      );
      if (res.data.success) {
        setBooking(res.data.data);
      } else {
        setError("Failed to load booking details");
      }
    } catch (err) {
      console.error("Failed to fetch booking details:", err);
      setError("Unable to load booking details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent || !booking) return;

    const pw = window.open("", "", "width=900,height=800");
    if (!pw) { alert("Please allow popups to print the receipt."); return; }

    const pd = getPaymentDetails(booking.payment_id);

    pw.document.write(`
      <html><head>
        <title>Receipt - ${booking.bookingNumber}</title>
        <meta charset="utf-8">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Courier New',monospace; font-size:13px; line-height:1.6; color:#000; padding:30px 40px; background:#fff; }
          .header { text-align:center; border-bottom:2px solid #000; padding-bottom:16px; margin-bottom:24px; }
          .header h1 { font-size:22px; font-weight:bold; letter-spacing:1px; }
          .header p { font-size:12px; margin-top:6px; color:#555; }
          .section { margin-bottom:22px; }
          .section-title { font-size:14px; font-weight:bold; border-bottom:1px solid #333; padding-bottom:4px; margin-bottom:10px; color:#1e40af; }
          .row { display:flex; justify-content:space-between; padding:4px 0; font-size:13px; }
          .session-item { background:#f5f5f5; padding:12px; margin:8px 0; border-left:4px solid #2563eb; }
          .addon-item { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dotted #999; }
          .total-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
          .grand-total { font-size:17px; font-weight:bold; border-top:2px solid #000; padding-top:10px; margin-top:8px; color:#166534; }
          .footer { text-align:center; margin-top:40px; padding-top:16px; border-top:1px dashed #666; font-size:11px; color:#666; }
          .non-refundable { color:#dc2626; font-weight:bold; margin-top:12px; }
        </style>
      </head>
      <body onload="window.print();window.close()">
        <div class="header">
          <h1>APPOINTMENT RECEIPT</h1>
          <p>Booking #: ${booking.bookingNumber}</p>
          <p>Booked on: ${formatDate(booking.createdAt)}</p>
          <p>Status: ${booking.session_status}</p>
        </div>
        <div class="section">
          <div class="section-title">Patient Information</div>
          <div class="row"><span>Name:</span><span>${booking.patient_details.name}</span></div>
          <div class="row"><span>Email:</span><span>${booking.patient_details.email}</span></div>
          <div class="row"><span>Phone:</span><span>${booking.patient_details.phone}</span></div>
          ${booking.patient_details.aadhar ? `<div class="row"><span>Aadhar:</span><span>${booking.patient_details.aadhar}</span></div>` : ""}
        </div>
        ${booking.treatment_id ? `
        <div class="section">
          <div class="section-title">Treatment</div>
          <div class="row"><span>Service:</span><span>${booking.treatment_id.service_name}</span></div>
          <div class="row"><span>Sessions Booked:</span><span>${booking.no_of_session_book}</span></div>
          <div class="row"><span>Per Session:</span><span>₹${booking.amountPerSession.toLocaleString()}</span></div>
        </div>` : ""}
        <div class="section">
          <div class="section-title">Appointment</div>
          <div class="row"><span>Doctor:</span><span>${booking.session_booking_for_doctor.doctor_name}</span></div>
          <div class="row"><span>Clinic:</span><span>${booking.session_booking_for_clinic.clinic_name}</span></div>
          <div class="row"><span>Address:</span><span>${booking.session_booking_for_clinic.clinic_contact_details.clinic_address}</span></div>
          <div class="row"><span>Contact:</span><span>${booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0] || ""}</span></div>
        </div>
        <div class="section">
          <div class="section-title">Session Schedule</div>
          ${booking.SessionDates.map(s => `
            <div class="session-item">
              <strong>Session ${s.sessionNumber}</strong> — ${s.status}<br>
              📅 ${formatDate(s.date)} &nbsp; 🕐 ${s.time}
            </div>`).join("")}
        </div>
        ${booking.addOns?.length ? `
        <div class="section">
          <div class="section-title">Additional Services</div>
          ${booking.addOns.map(a => `<div class="addon-item"><span>${a.title}</span><strong>₹${a.price.toLocaleString()}</strong></div>`).join("")}
          <div class="row" style="margin-top:8px"><span>Add-ons Total:</span><strong>₹${booking.addOnsTotal.toLocaleString()}</strong></div>
        </div>` : ""}
        <div class="section">
          <div class="section-title">Payment</div>
          <div class="total-row"><span>Total Amount:</span><span>₹${booking.totalAmount.toLocaleString()}</span></div>
          ${pd.tax !== undefined ? `<div class="total-row"><span>Tax:</span><span>${formatCurrency(pd.tax)}</span></div>` : ""}
          ${booking.addOnsTotal > 0 ? `<div class="total-row"><span>Add-ons:</span><span>₹${booking.addOnsTotal.toLocaleString()}</span></div>` : ""}
          <div class="total-row grand-total"><span>Grand Total:</span><span>${formatCurrency(pd.total ?? booking.totalAmount)}</span></div>
          <div style="margin-top:10px;font-size:12px;text-align:center;color:#666">
            Method: ${booking.payment_id.paymentMethod.replace(/_/g, " ").toUpperCase()}
          </div>
          ${booking.payment_id.razorpay_payment_id ? `<div style="margin-top:4px;font-size:11px;text-align:center;color:#999">Transaction ID: ${booking.payment_id.razorpay_payment_id}</div>` : ""}
        </div>
        <div class="footer">
          <p>Thank you for choosing our services!</p>
          <p style="margin-top:8px">For queries, contact the clinic.</p>
          ${!booking.cancellation.refundEligible ? `<p class="non-refundable">⚠️ This booking is non-refundable</p>` : ""}
        </div>
      </body></html>
    `);
    pw.document.close();
    pw.focus();
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-slate-500 font-medium">Loading booking details…</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Booking Not Found</h2>
          <p className="text-slate-500">{error || "Unable to load booking details."}</p>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusColor(booking.session_status);
  const paymentDetails = getPaymentDetails(booking.payment_id);
  const totalPaid = paymentDetails.total ?? booking.totalAmount;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        .bd-root { font-family: 'Outfit', sans-serif; }
        .bd-root .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .slide-up { animation: slideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
        .slide-up-1 { animation-delay: 0.05s; opacity:0; }
        .slide-up-2 { animation-delay: 0.12s; opacity:0; }
        .slide-up-3 { animation-delay: 0.20s; opacity:0; }
        .slide-up-4 { animation-delay: 0.28s; opacity:0; }
        .slide-up-5 { animation-delay: 0.36s; opacity:0; }
        .glass { background:rgba(255,255,255,0.88); backdrop-filter:blur(20px); border:1px solid rgba(255,255,255,0.95); }
        .session-card { transition: all 0.2s ease; }
        .session-card:hover { transform: translateX(4px); }
        .action-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .action-btn:hover { transform: translateY(-2px); }
        .action-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="bd-root min-h-screen" style={{ background: "linear-gradient(135deg, #f0fdf9 0%, #f8fafc 50%, #eff6ff 100%)" }}>

        {/* Decorative background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-teal-200/25 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-24 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-56 h-56 bg-blue-200/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-8 max-w-6xl">

          {/* ── Hero Header ─────────────────────────────────────────────── */}
          <div className="glass rounded-3xl p-6 mb-6 shadow-xl slide-up slide-up-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-200 flex-shrink-0">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Booking Details</p>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                    {booking.session_booking_for_clinic.clinic_name}
                  </h1>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Booked on {formatDateShort(booking.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Booking number */}
                <span className="mono text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-xl tracking-wider">
                  {booking.bookingNumber}
                </span>
                {/* Status badge */}
                <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl ${statusStyle.bg} ${statusStyle.text}`}>
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  {booking.session_status}
                </span>
                {/* Non-refundable */}
                {!booking.cancellation.refundEligible && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-100 text-red-600 px-3 py-1.5 rounded-xl">
                    <XCircle className="w-3.5 h-3.5" /> Non-Refundable
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Main Grid ───────────────────────────────────────────────── */}
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">

            {/* ────── LEFT SIDEBAR ────── */}
            <div className="space-y-4">

              {/* Patient Card */}
              <div className="glass rounded-3xl overflow-hidden shadow-lg slide-up slide-up-2">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 ring-4 ring-white/30 shadow-lg">
                      <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                        {booking.patient_details.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-teal-100 text-xs font-semibold uppercase tracking-wider">Patient</p>
                      <p className="text-white text-lg font-bold leading-tight">{booking.patient_details.name}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 divide-y divide-slate-100">
                  <InfoRow icon={Mail} label="Email" value={booking.patient_details.email} color="text-teal-600" />
                  <InfoRow icon={Phone} label="Phone" value={booking.patient_details.phone} color="text-emerald-600" />
                  {booking.patient_details.aadhar && (
                    <InfoRow icon={Hash} label="Aadhar" value={booking.patient_details.aadhar} color="text-slate-500" />
                  )}
                </div>
              </div>

              {/* Progress Card */}
              <div className="glass rounded-3xl p-5 shadow-lg slide-up slide-up-2">
                <SectionTitle icon={TrendingUp} title="Session Progress" accent="from-emerald-500 to-teal-600" />
                <div className="text-center mb-4">
                  <div className="relative inline-flex items-center justify-center mb-2">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#progressGrad)" strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - booking.progressPercentage / 100)}`}
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                      <defs>
                        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-slate-800">{booking.progressPercentage}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    <span className="text-teal-600 font-bold">{booking.completedSessionsCount}</span> of{" "}
                    <span className="font-bold">{booking.no_of_session_book}</span> sessions done
                  </p>
                </div>
              </div>

              {/* Treatment Card */}
              {booking.treatment_id && (
                <div className="glass rounded-3xl p-5 shadow-lg slide-up slide-up-3">
                  <SectionTitle icon={Stethoscope} title="Treatment" accent="from-violet-500 to-purple-600" />
                  <h3 className="font-bold text-slate-800 text-base leading-snug mb-1">
                    {booking.treatment_id.service_name}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                    {booking.treatment_id.service_small_desc}
                  </p>
                  <div className="flex items-center justify-between bg-violet-50 rounded-2xl px-4 py-3 border border-violet-100">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Per Session</span>
                    <div className="flex items-center gap-2">
                      {booking.treatment_id.service_per_session_discount_percentage > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{booking.treatment_id.service_per_session_price.toLocaleString()}
                        </span>
                      )}
                      <span className="text-lg font-extrabold text-violet-700">
                        ₹{booking.treatment_id.service_per_session_discount_price.toLocaleString()}
                      </span>
                      {booking.treatment_id.service_per_session_discount_percentage > 0 && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 font-bold rounded-full px-2 py-0.5">
                          -{booking.treatment_id.service_per_session_discount_percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  {booking.treatment_id.service_tag && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {booking.treatment_id.service_tag.split(",").map((tag, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-medium">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 slide-up slide-up-3">
                {/* {booking.treatment_id && (
                  <Link href={`/pages/reschedule-booking/${booking.treatment_id.service_slug}/${booking._id}`}>
                    <button className="action-btn w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm shadow-lg shadow-orange-200 mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <Timer className="w-5 h-5" />
                        Reschedule Booking
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </Link>
                )} */}
                {/* <button
                  onClick={handlePrint}
                  className="action-btn w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold text-sm shadow-lg shadow-teal-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-5 h-5" />
                    Print Receipt
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button> */}
                <a
                  href={booking.session_booking_for_clinic.clinic_map}
                  target="_blank" rel="noopener noreferrer"
                  className="action-btn flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:border-teal-300 hover:text-teal-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-5 h-5" />
                    Get Directions
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* ────── RIGHT COLUMN ────── */}
            <div className="space-y-5">

              {/* Clinic & Doctor Card */}
              <div className="glass rounded-3xl p-6 shadow-lg slide-up slide-up-2">
                <SectionTitle icon={Building2} title="Appointment Details" accent="from-teal-500 to-cyan-600" />

                {/* Doctor banner */}
                <div className="flex items-center gap-4 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-teal-500 uppercase tracking-wider mb-0.5">Consulting Doctor</p>
                    <p className="text-xl font-extrabold text-slate-900">
                      {booking.session_booking_for_doctor.doctor_name}
                    </p>
                  </div>
                </div>

                {/* Clinic info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h3 className="text-lg font-bold text-slate-900">
                    {booking.session_booking_for_clinic.clinic_name}
                  </h3>
                  {booking.session_booking_for_clinic.clinic_ratings && (
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-amber-700 text-sm">
                        {booking.session_booking_for_clinic.clinic_ratings}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50 rounded-2xl overflow-hidden mb-4">
                  <div className="p-4 space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {booking.session_booking_for_clinic.clinic_contact_details.clinic_address}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <p className="text-sm text-slate-700">
                          {booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0] || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <p className="text-sm text-slate-700 break-all">
                          {booking.session_booking_for_clinic.clinic_contact_details.email}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hours</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <p className="text-sm text-slate-700">
                          {booking.session_booking_for_clinic.clinic_timings.open_time} – {booking.session_booking_for_clinic.clinic_timings.close_time}
                          <span className="text-slate-400 ml-1.5 text-xs">
                            · Closed {booking.session_booking_for_clinic.clinic_timings.off_day}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinic images */}
                {booking.session_booking_for_clinic.clinic_images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {booking.session_booking_for_clinic.clinic_images.slice(0, 2).map((img) => (
                      <img
                        key={img._id} src={img.url} alt="Clinic"
                        className="rounded-2xl w-full h-40 object-cover border border-slate-100 shadow-sm"
                      />
                    ))}
                  </div>
                )}

                {/* Special note */}
                {booking.session_booking_for_clinic.any_special_note && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900 text-sm mb-1">Important Note</p>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {booking.session_booking_for_clinic.any_special_note}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              {booking.addOns && booking.addOns.length > 0 && (
                <div className="glass rounded-3xl p-6 shadow-lg slide-up slide-up-3">
                  <SectionTitle icon={Package} title="Additional Services" accent="from-amber-500 to-orange-500" />
                  <div className="space-y-3">
                    {booking.addOns.map((addon) => (
                      <div key={addon._id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{addon.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Added {formatDateShort(addon.addedAt)}</p>
                        </div>
                        <p className="text-base font-extrabold text-amber-700">₹{addon.price.toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center bg-amber-100 rounded-2xl px-4 py-3 border border-amber-200">
                      <span className="font-bold text-amber-900 text-sm">Add-ons Total</span>
                      <span className="text-lg font-extrabold text-amber-700">₹{booking.addOnsTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Schedule */}
              <div className="glass rounded-3xl p-6 shadow-lg slide-up slide-up-4">
                <div className="flex items-center justify-between mb-5">
                  <SectionTitle icon={Calendar} title="Session Schedule" accent="from-blue-500 to-indigo-600" />
                  <span className="text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1">
                    {booking.no_of_session_book} session{booking.no_of_session_book > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {booking.SessionDates.map((session) => {
                    const sc = getStatusColor(session.status);
                    return (
                      <div
                        key={session._id}
                        className={`session-card flex items-start gap-4 p-4 rounded-2xl border-l-4 ${
                          session.status === "Pending"
                            ? "bg-amber-50 border-l-amber-400"
                            : session.status === "Completed"
                            ? "bg-emerald-50 border-l-emerald-400"
                            : "bg-slate-50 border-l-slate-300"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-extrabold text-sm ${
                          session.status === "Completed" ? "bg-emerald-500 text-white" :
                          session.status === "Pending" ? "bg-amber-400 text-white" :
                          "bg-slate-200 text-slate-600"
                        }`}>
                          {session.sessionNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-slate-800">Session {session.sessionNumber}</span>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                              {session.status}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 text-sm text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              {formatDate(session.date)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-teal-500" />
                              {session.time}
                            </span>
                          </div>
                          {session.rescheduleHistory.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">
                              Rescheduled {session.rescheduleHistory.length} time{session.rescheduleHistory.length > 1 ? "s" : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next session highlight */}
                {booking.nextSession && (
                  <div className="mt-4 flex items-center gap-4 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-4 shadow-lg shadow-teal-200">
                    <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-teal-100 text-xs font-bold uppercase tracking-wider mb-0.5">Next Appointment</p>
                      <p className="text-white font-bold text-sm">
                        {formatDate(booking.nextSession.date)} · {booking.nextSession.time}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="glass rounded-3xl p-6 shadow-lg slide-up slide-up-5">
                <SectionTitle icon={IndianRupee} title="Payment Summary" accent="from-emerald-500 to-teal-600" />

                <div className="space-y-2 mb-4">
                  {/* Subtotal row */}
                  <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl text-sm">
                    <span className="text-slate-600">
                      Subtotal
                      <span className="text-slate-400 text-xs ml-1">
                        ({booking.no_of_session_book} × ₹{booking.amountPerSession.toLocaleString()})
                      </span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {paymentDetails.subtotal !== undefined
                        ? formatCurrency(paymentDetails.subtotal)
                        : `₹${(booking.no_of_session_book * booking.amountPerSession).toLocaleString()}`}
                    </span>
                  </div>

                  {/* Add-ons */}
                  {booking.addOnsTotal > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 bg-amber-50 rounded-xl text-sm">
                      <span className="text-slate-600">Add-ons</span>
                      <span className="font-semibold text-amber-700">₹{booking.addOnsTotal.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Tax */}
                  {paymentDetails.tax !== undefined && (
                    <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl text-sm">
                      <span className="text-slate-600">Tax & Fees</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(paymentDetails.tax)}</span>
                    </div>
                  )}

                  {/* Credit card fee */}
                  {paymentDetails.creditCardFee && paymentDetails.creditCardFee !== "0" && paymentDetails.creditCardFee !== 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 rounded-xl text-sm">
                      <span className="text-slate-600">Card Fee</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(paymentDetails.creditCardFee)}</span>
                    </div>
                  )}
                </div>

                {/* Grand total */}
                <div className="flex justify-between items-center bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl px-5 py-4 shadow-md shadow-emerald-200 mb-4">
                  <span className="text-white font-bold text-base">Total Paid</span>
                  <span className="text-white font-extrabold text-2xl">
                    {formatCurrency(totalPaid)}
                  </span>
                </div>

                {/* Payment method */}
                <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    Payment Method
                  </div>
                  <span className="font-bold text-slate-800 capitalize">
                    {booking.payment_id.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Razorpay ID */}
                {booking.payment_id.razorpay_payment_id && (
                  <div className="mono text-center text-xs text-slate-400 mt-3 bg-slate-50 rounded-xl py-2 px-3">
                    Transaction ID: {booking.payment_id.razorpay_payment_id}
                  </div>
                )}

                {/* Payment status */}
                {booking.payment_id.status && (
                  <div className={`flex items-center justify-center gap-2 mt-3 text-xs font-bold px-3 py-2 rounded-xl ${
                    booking.payment_id.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-50 text-slate-600"
                  }`}>
                    {booking.payment_id.status === "completed"
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Payment Confirmed</>
                      : <><Shield className="w-3.5 h-3.5" /> {booking.payment_id.status}</>}
                  </div>
                )}

                {/* Refund notice */}
                {!booking.cancellation.refundEligible && (
                  <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl px-4 py-2.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    This booking is non-refundable
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Hidden print receipt */}
        <div className="hidden">
          <div ref={receiptRef} />
        </div>
      </div>
    </>
  );
}