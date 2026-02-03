import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

import { RefreshCw, Plus, CalendarIcon, Eye, Edit, Trash2, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSessionBookings } from "@/hooks/sessions";
import { statusOptions } from "@/constant/Urls";
import Loading from "@/components/ui/loading";

const AllSessions = () => {
  const { sessionDetails, loading, error, fetchSessionDetails } = useSessionBookings({ id: null });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clinicFilter, setClinicFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [dateRange, setDateRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const uniqueClinics = useMemo(() => {
    const clinics = sessionDetails.map((s) => s.session_booking_for_clinic?.clinic_name);
    return [...new Set(clinics.filter(Boolean))];
  }, [sessionDetails]);

  // ────────────────────────────────────────────────
  // Filters
  // ────────────────────────────────────────────────

  const filteredSessions = useMemo(() => {
    let result = [...sessionDetails];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => {
        return (
          s.patient_details?.name?.toLowerCase().includes(term) ||
          s.bookingNumber?.toLowerCase().includes(term) ||
          s.treatment_id?.service_name?.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.session_status === statusFilter);
    }

    if (clinicFilter !== "all") {
      result = result.filter((s) => s.session_booking_for_clinic?.clinic_name === clinicFilter);
    }

    if (dateRange === "today") {
      result = result.filter((s) =>
        s.SessionDates?.some((d) => {
          const sd = new Date(d.date);
          return sd.toDateString() === new Date().toDateString();
        })
      );
    } else if (dateRange === "upcoming") {
      result = result.filter((s) =>
        s.SessionDates?.some((d) => new Date(d.date) > new Date())
      );
    }

    if (dateFilter) {
      const target = dateFilter.toDateString();
      result = result.filter((s) =>
        s.SessionDates?.some((d) => new Date(d.date).toDateString() === target)
      );
    }

    return result;
  }, [sessionDetails, searchTerm, statusFilter, clinicFilter, dateRange, dateFilter]);

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status) => {
    const map = {
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
      Confirmed: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
      "Payment Not Completed": "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
      Cancelled: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      Rescheduled: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
      "Partially Completed": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    };
    return map[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const handleView = (session) => {
    window.location.href = `/dashboard/admin/sessions/${session._id}`;
  };

  const handleStatusChange = (session) => {
    setSelectedSession(session);
    setNewStatus(session.session_status || "Pending");
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!selectedSession) return;

    try {
      const res = await fetch("https://api.drrajneeshkant.in/admin-session-change-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          bookingId: selectedSession.bookingId || selectedSession._id,
          sessionNumber: selectedSession.sessionNumber,
          newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Status updated successfully");
        fetchSessionDetails();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating status");
      console.error(err);
    } finally {
      setStatusModalOpen(false);
      setSelectedSession(null);
    }
  };

  const confirmDelete = async () => {
    if (!selectedSession) return;

    const payload = {
      bookingId: selectedSession.bookingId || selectedSession._id,
      sessionNumber: selectedSession.sessionNumber,
    };

    try {
      const res = await axios.post(
        "https://api.drrajneeshkant.in/api/v1/admin-session-delete",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (res.data.success) {
        alert("Session deleted successfully");
        fetchSessionDetails();
      } else {
        alert(res.data.message || "Failed to delete");
      }
    } catch (err) {
      alert("Error deleting session");
      console.error(err);
    } finally {
      setDeleteModalOpen(false);
      setSelectedSession(null);
    }
  };

  if (loading) return <Loading message="Loading session bookings..." />;
  if (error) return <div className="text-red-600 dark:text-red-400 p-6">Error: {error.message}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 lg:p-8 transition-colors">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            All Session Bookings
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Total: <strong>{filteredSessions.length}</strong> / {sessionDetails.length}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={fetchSessionDetails}
            variant="outline"
            className="gap-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>

          <Button className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4" />
            Book New Session
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Input
          placeholder="Search patient / booking / service..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-500"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="border-gray-300 dark:border-gray-700">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={clinicFilter} onValueChange={setClinicFilter}>
          <SelectTrigger className="border-gray-300 dark:border-gray-700">
            <SelectValue placeholder="Clinic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            {uniqueClinics.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="border-gray-300 dark:border-gray-700">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal border-gray-300 dark:border-gray-700",
                !dateFilter && "text-gray-500 dark:text-gray-400"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Pick date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear filters */}
      {(searchTerm || statusFilter !== "all" || clinicFilter !== "all" || dateFilter || dateRange !== "all") && (
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setClinicFilter("all");
              setDateFilter(null);
              setDateRange("all");
            }}
            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Filter className="mr-2 h-4 w-4" />
            Clear filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
        <Table>
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableHead className="text-gray-700 dark:text-gray-300">Booking #</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Patient</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Service</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Doctor / Clinic</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Next Session</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Progress</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">Amount</TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-gray-500 dark:text-gray-400">
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedSessions.map((session) => (
                <TableRow
                  key={session._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                >
                  <TableCell className="font-mono text-gray-700 dark:text-gray-300">
                    {session.bookingNumber}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {session.patient_details?.name || "—"}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {session.patient_details?.phone || "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-gray-800 dark:text-gray-200">
                    {session.treatment_id?.service_name || "—"}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {session.no_of_session_book} sessions
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-gray-800 dark:text-gray-200">
                      {session.session_booking_for_doctor?.doctor_name || "—"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {session.session_booking_for_clinic?.clinic_name || "—"}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {session.nextSession ? (
                      <>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {format(new Date(session.nextSession.date), "MMM dd, yyyy")}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {session.nextSession.time}
                          {new Date(session.nextSession.date).toDateString() === new Date().toDateString() && (
                            <Badge className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              Today
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">No upcoming</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge className={cn("px-3 py-1", getStatusColor(session.session_status))}>
                      {session.session_status || "Unknown"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {session.completedSessionsCount || 0} / {session.no_of_session_book}
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-400 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (session.completedSessionsCount / session.no_of_session_book) * 100 || 0
                          )}%`,
                        }}
                      />
                    </div>
                  </TableCell>

                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                    ₹{(session.totalAmount || 0).toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right space-x-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() => handleView(session)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      onClick={() => handleStatusChange(session)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      onClick={() => handleDelete(session)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center md:justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={currentPage === page}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Status Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Session Status</DialogTitle>
            <DialogDescription>
              Booking: {selectedSession?.bookingNumber || "—"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Session Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete booking{" "}
              <strong>{selectedSession?.bookingNumber || "—"}</strong>?<br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllSessions;