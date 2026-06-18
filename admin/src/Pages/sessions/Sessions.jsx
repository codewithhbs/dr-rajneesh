import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, CalendarCheck, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge, { toneForStatus } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";
import { sessionStatusOptions } from "@/constants/config";

const paymentStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date) ? "—" : date.toLocaleDateString("en-IN");
};

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "—";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const DEFAULT_FILTERS = {
  bookingStatus: "all",
  paymentStatus: "all",
  fromDate: "",
  toDate: "",
  search: "",
};

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const navigate = useNavigate();

  // Debounce free-text search before it becomes part of the query
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput.trim() }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        ...(filters.bookingStatus !== "all" && { bookingStatus: filters.bookingStatus }),
        ...(filters.paymentStatus !== "all" && { paymentStatus: filters.paymentStatus }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.search && { search: filters.search }),
      };

      const { data } = await api.get("/full/admin/booking", { params });

      const list = data?.data || [];

      setSessions(list);

      // ✅ FIX HERE
      setTotal(data?.pagination?.total || 0);

    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);
  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setPage(1);
    setFilters(DEFAULT_FILTERS);
  };

  const hasActiveFilters = useMemo(
    () =>
      filters.bookingStatus !== "all" ||
      filters.paymentStatus !== "all" ||
      !!filters.fromDate ||
      !!filters.toDate ||
      !!filters.search,
    [filters]
  );

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader title="Session Bookings" subtitle={`${total} booking${total === 1 ? "" : "s"}`} />

      <Card>
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by patient, phone or booking ID"
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
            </div>

            <div className="sm:w-44">
              <Select
                value={filters.bookingStatus}
                onChange={(e) => updateFilter("bookingStatus", e.target.value)}
                options={[{ value: "all", label: "All statuses" }, ...sessionStatusOptions]}
              />
            </div>

            <div className="sm:w-44">
              <Select
                value={filters.paymentStatus}
                onChange={(e) => updateFilter("paymentStatus", e.target.value)}
                options={[{ value: "all", label: "All payments" }, ...paymentStatusOptions]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <label className="text-xs font-medium text-gray-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => updateFilter("fromDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <label className="text-xs font-medium text-gray-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={filters.toDate}
                min={filters.fromDate || undefined}
                onChange={(e) => updateFilter("toDate", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="whitespace-nowrap">
                <X className="mr-1 h-4 w-4" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : sessions.length === 0 ? (
          <EmptyState icon={CalendarCheck} title="No bookings found" />
        ) : (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Booking</TH>
                  <TH>Patient</TH>
                  <TH>Service</TH>
                  <TH>Clinic</TH>

                  <TH>Appointment</TH>
                  <TH>Payment</TH>
                  <TH>Status</TH>
                  <TH className="text-right">View</TH>
                </TR>
              </THead>
              <tbody>
                {sessions.map((s) => {
                  const includedTitles = s.selectedIncludedServices?.length
                    ? s.selectedIncludedServices
                    : s.service?.included_services || [];

                  return (
                    <TR
                      key={s._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/dashboard/sessions/${s._id}`)}
                    >
                      <TD className="font-medium text-gray-900">
                        #{s.bookingId || s._id?.slice(-6)}
                      </TD>

                      <TD>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{s.patient?.name || "—"}</span>
                          {s.patient?.phone && (
                            <span className="text-xs text-gray-400">{s.patient.phone}</span>
                          )}
                        </div>
                      </TD>

                      <TD>
                        <div className="flex max-w-xs flex-col gap-1.5">
                          <span className="font-medium text-gray-800">
                            {s.service?.title || "—"}
                          </span>
                          {includedTitles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {includedTitles.slice(0, 3).map((inc) => (
                                <span
                                  key={inc._id}
                                  className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700"
                                  title={inc.desc}
                                >
                                  {inc.title}
                                </span>
                              ))}
                              {includedTitles.length > 3 && (
                                <span
                                  className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500"
                                  title={includedTitles
                                    .slice(3)
                                    .map((i) => i.title)
                                    .join(", ")}
                                >
                                  +{includedTitles.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TD>

                      <TD>
                        <div className="flex max-w-xs flex-col gap-1.5">
                          <span className="font-medium text-gray-800">
                            {s.clinic?.clinic_name || "—"}
                          </span>

                          {s.clinic?.clinic_contact_details?.phone_numbers?.[0] && (
                            <span className="text-xs text-gray-500">
                              📞 {s.clinic.clinic_contact_details.phone_numbers[0]}
                            </span>
                          )}

                          {s.clinic?.clinic_contact_details?.clinic_address && (
                            <span
                              className="text-xs text-gray-400 line-clamp-2"
                              title={s.clinic.clinic_contact_details.clinic_address}
                            >
                              📍 {s.clinic.clinic_contact_details.clinic_address}
                            </span>
                          )}
                        </div>
                      </TD>
                      <TD>
                        <div className="flex flex-col">
                          <span>{formatDate(s.appointmentDate)}</span>
                          {s.appointmentTime && (
                            <span className="text-xs text-gray-400">{s.appointmentTime}</span>
                          )}
                        </div>
                      </TD>

                      <TD>
                        <div className="flex flex-col gap-0.5">
                          <Badge tone={toneForStatus(s.paymentStatus)}>
                            {s.paymentStatus || "pending"}
                          </Badge>
                          {s.dueAmount > 0 && (
                            <span className="text-[11px] text-gray-400">
                              Due {formatCurrency(s.dueAmount)}
                            </span>
                          )}
                        </div>
                      </TD>

                      <TD>
                        <Badge tone={toneForStatus(s.bookingStatus)}>
                          {s.bookingStatus || "pending"}
                        </Badge>
                      </TD>

                      <TD className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dashboard/sessions/${s._id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}