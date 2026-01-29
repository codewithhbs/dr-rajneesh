import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";

import { RefreshCw, Plus } from "lucide-react";
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
  PaginationEllipsis,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, Eye, Edit, Trash2, Filter } from "lucide-react";
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
  const { sessionDetails, loading, error, fetchSessionDetails } =
    useSessionBookings({ id: null });

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
    const clinics = sessionDetails.map(
      (session) => session.session_booking_for_clinic.clinic_name
    );
    return [...new Set(clinics)];
  }, []);

  console.log("Unique statusFilter:", statusFilter);
  // Helper function to check if session is today
  const isToday = (date) => {
    const today = new Date();
    const sessionDate = new Date(date);
    return sessionDate.toDateString() === today.toDateString();
  };

  // Helper function to check if session is upcoming
  const isUpcoming = (date) => {
    const today = new Date();
    const sessionDate = new Date(date);
    return sessionDate > today;
  };

  const filteredSessions = useMemo(() => {
    let filtered = sessionDetails;
    console.log("Initial sessionDetails:", sessionDetails);

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();

      filtered = filtered.filter((session) => {
        const nameMatch = session.patient_details?.name
          ?.toLowerCase()
          .includes(lowerSearch);
        const bookingMatch = session.bookingNumber
          ?.toLowerCase()
          .includes(lowerSearch);
        const serviceMatch = session.treatment_id?.service_name
          ?.toLowerCase()
          .includes(lowerSearch);

        return (
          nameMatch || bookingMatch || (!!session.treatment_id && serviceMatch)
        );
      });

      console.log("After searchTerm filter:", filtered);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((session) => session.status === statusFilter);
      console.log("After statusFilter:", filtered);
    }

    if (clinicFilter !== "all") {
      filtered = filtered.filter(
        (session) => session.clinic_id === clinicFilter
      );
      console.log("After clinicFilter:", filtered);
    }

    if (dateRange === "today") {
      filtered = filtered.filter((session) =>
        session.SessionDates?.some((sessionDate) => isToday(sessionDate.date))
      );
      console.log('After dateRange "today":', filtered);
    } else if (dateRange === "upcoming") {
      filtered = filtered.filter((session) =>
        session.SessionDates?.some((sessionDate) =>
          isUpcoming(sessionDate.date)
        )
      );
      console.log('After dateRange "upcoming":', filtered);
    }

    if (dateFilter) {
      filtered = filtered.filter((session) =>
        session.SessionDates?.some((sessionDate) => {
          const sessionDateObj = new Date(sessionDate.date);
          return sessionDateObj.toDateString() === dateFilter.toDateString();
        })
      );
      console.log("After specific dateFilter:", filtered);
    }

    return filtered;
  }, [
    sessionDetails,
    searchTerm,
    statusFilter,
    clinicFilter,
    dateRange,
    dateFilter,
  ]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Confirmed: "bg-green-100 text-green-800",
      "Payment Not Completed": "bg-red-100 text-red-800",
      Cancelled: "bg-gray-100 text-gray-800",
      Completed: "bg-blue-100 text-blue-800",
      Rescheduled: "bg-purple-100 text-purple-800",
      "Partially Completed": "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

    // Action handlers
    const handleStatusChange = (session) => {
    
      setSelectedSession(session);
      setNewStatus(session.session_status);
      setStatusModalOpen(true);
    };

    const handleDelete = (session) => {
          console.log("Session clicked for delete:", session); 
      setSelectedSession(session);
      setDeleteModalOpen(true);
    };

    const handleView = (session) => {
      window.location.href = `/dashboard/admin/sessions/${session._id}`;
    };

// Update session status
const confirmStatusChange = async () => {
  if (!selectedSession) return;

  try {
    const response = await fetch("https://api.dikshantias.in/admin-session-change-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({
        bookingId: selectedSession.bookingId || selectedSession._id,
        sessionNumber: selectedSession.sessionNumber,
        newStatus: newStatus,
      }),
    });

    const data = await response.json();

    if (data.success) toast.success("Session status updated successfully!");
    else toast.error(data.message || "Failed to update session status");
  } catch (error) {
    toast.error("Error updating session status");
    console.error(error);
  } finally {
    setStatusModalOpen(false);
    setSelectedSession(null);
  }
};

// Delete session
const confirmDelete = async () => {
  if (!selectedSession) return;

  const payload = {
    bookingId: selectedSession.bookingId || selectedSession._id,
    sessionNumber: selectedSession.sessionNumber,
  };

  console.log("Deleting session payload:", payload);

  if (!payload.bookingId || !payload.sessionNumber) {
    alert("Cannot delete session: bookingId or sessionNumber missing");
    return;
  }

  try {
    const token = localStorage.getItem("admin"); // JWT token
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await axios.post(
      "https://api.dikshantias.in/api/v1/admin-session-delete",
      payload,
      { headers }
    );

    if (response.data.success) {
      console.log("Session deleted successfully!");
      // Optionally refetch updated sessions
    } else {
      console.error(response.data.message || "Failed to delete session");
    }
  } catch (error) {
    console.error(
      "Delete session error:",
      error.response?.data?.message || error.message
    );
  } finally {
    setDeleteModalOpen(false);
    setSelectedSession(null);
  }
};


  if (loading) return <Loading message="Loading sessions Bookings" />;
  if (error)
    return (
      <div className="text-red-500">
        Error loading sessions: {error.message}
      </div>
    );

  return (
  <div className="container mx-auto p-6 bg-white rounded-xl shadow-lg">
  {/* Header */}
<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 
                bg-gradient-to-r from-blue-800 to-sky-700 text-white p-6 rounded-lg border-b border-white/30 shadow-md">
  <div>
    <h1 className="text-3xl font-bold">All Sessions Bookings</h1>
    <p className="text-sm mt-1">
      Manage all healthcare sessions •{" "}
      <span className="font-semibold">{filteredSessions.length}</span> of{" "}
      <span className="font-semibold">{sessionDetails.length}</span> total
    </p>
  </div>

<div className="flex gap-3 flex-wrap">

  {/* Refresh Button */}
  <Button
    onClick={fetchSessionDetails}
    type="button"
    className="inline-flex items-center gap-2 text-white bg-[#050708] hover:bg-[#050708]/80 focus:ring-4 focus:outline-none focus:ring-[#050708]/50  font-semibold rounded-lg text-sm px-5 py-2.5 transition"
  >
    <RefreshCw className="h-4 w-4" />
    <span>Refresh</span>
  </Button>

  {/* Book New Session Button */}
  <Button
    type="button"
    className="inline-flex items-center gap-2 text-white bg-[#FF9119] hover:bg-[#FF9119]/80 focus:ring-4 focus:outline-none focus:ring-[#FF9119]/50 font-medium rounded-lg text-sm px-5 py-2.5 transition"
  >
    <Plus className="h-4 w-4" />
    <span>Book New Session</span>
  </Button>

</div>
</div>



  {/* Filters */}
<div className="bg-white p-4 md:p-5 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
  <Input
    type="text"
    placeholder="Search"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="col-span-1 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
  />

  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition">
      <SelectValue placeholder="Status" />
    </SelectTrigger>
    <SelectContent> 
      <SelectItem value="all">All Statuses</SelectItem>
      {statusOptions.map((status) => (
        <SelectItem key={status} value={status}>
          {status}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={clinicFilter} onValueChange={setClinicFilter}>
    <SelectTrigger className="border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition">
      <SelectValue placeholder="Clinic" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Clinics</SelectItem>
      {uniqueClinics.map((clinic) => (
        <SelectItem key={clinic} value={clinic}>
          {clinic}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  <Select value={dateRange} onValueChange={setDateRange}>
    <SelectTrigger className="border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition">
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
        className="flex items-center justify-start gap-2 border border-gray-300 rounded-lg px-3 py-2 hover:border-blue-500 transition"
      >
        <CalendarIcon className="h-4 w-4 text-gray-600" />
        {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0">
      <Calendar mode="single" selected={dateFilter} onSelect={setDateFilter} />
    </PopoverContent>
  </Popover>
</div>


  {/* Clear Filters */}
  {(searchTerm ||
    statusFilter !== "all" ||
    clinicFilter !== "all" ||
    dateFilter ||
    dateRange !== "all") && (
    <div className="mb-4">
      <Button
        variant="ghost"
        onClick={() => {
          setSearchTerm("");
          setStatusFilter("all");
          setClinicFilter("all");
          setDateFilter(null);
          setDateRange("all");
        }}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition"
      >
        <Filter className="h-4 w-4" /> Clear All Filters
      </Button>
    </div>
  )}

  {/* Table */}
  <div className="rounded-lg border border-gray-200 shadow-md">
    <Table className="min-w-full table-auto">
      <TableCaption className="text-left text-gray-500 py-2">
        Session bookings management
      </TableCaption>
      <TableHeader className="bg-gradient-to-r from-blue-800 to-sky-700 sticky top-0 z-10 shadow-sm">
        <TableRow>
          <TableHead className="rounded-tl-lg text-left p-4 text-white">Booking #</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Patient</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Service</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Doctor/Clinic</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Next Session</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Status</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Progress</TableHead>
          <TableHead className="text-white text-left p-4 font-semibold">Amount</TableHead>
          <TableHead className="rounded-tr-lg text-white text-left p-4 font-semibold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedSessions.map((session) => (
          <TableRow 
            key={session._id}
            className="hover:bg-gray-50 transition-colors border-b last:border-b-0"
          >
            <TableCell className="font-mono text-gray-700">{session.bookingNumber}</TableCell>
            <TableCell className="break-words">
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">{session.patient_details.name}</span>
                <span className="text-gray-500 text-sm">{session.patient_details?.email}</span>
                <span className="text-gray-500 text-sm">{session.patient_details?.phone}</span>
              </div>
            </TableCell>
            <TableCell className="break-words">
              <div className="font-medium text-gray-800">{session?.treatment_id?.service_name || "N/A"}</div>
              <div className="text-gray-400 text-sm">{session.no_of_session_book} sessions</div>
            </TableCell>
            <TableCell className="break-words">
              <div className="flex flex-col">
                <span className="font-medium text-gray-800">{session.session_booking_for_doctor.doctor_name}</span>
                <span className="text-gray-400 text-sm truncate max-w-xs">{session.session_booking_for_clinic.clinic_name}</span>
              </div>
            </TableCell>
            <TableCell className="break-words">
              {session.nextSession ? (
                <div>
                  <div className="font-medium text-gray-800">{format(new Date(session.nextSession.date), "MMM dd, yyyy")}</div>
                  <div className="text-gray-500 text-sm">
                    {session.nextSession.time}{" "}
                    {isToday(session.nextSession.date) && (
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-600">
                        Today
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-gray-400">No upcoming session</span>
              )}
            </TableCell>
            <TableCell>
              <Badge className={`${getStatusColor(session.session_status)} px-3 py-1 rounded-lg font-medium text-sm`}>
                {session.session_status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-gray-600 text-sm mb-1">{session.completedSessionsCount}/{session.no_of_session_book} completed</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(session.completedSessionsCount / session.no_of_session_book) * 100}%` }}
                />
              </div>
            </TableCell>
            <TableCell className="font-medium text-gray-900">₹{session.totalAmount.toLocaleString()}</TableCell>
            <TableCell className="flex gap-2">
                {/* View Button */}
                <Button
                  size="sm"
                  className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition"
                  onClick={() => handleView(session)}
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {/* Edit Button */}
                <Button
                  size="sm"
                  className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm transition"
                  onClick={() => handleStatusChange(session)}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                {/* Delete Button */}
                <Button
                  size="sm"
                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
                  onClick={() => handleDelete(session)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>

          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* Pagination */}
{totalPages > 1 && (
  <div className="mt-6 flex justify-end">
    <Pagination>
      <PaginationContent className="space-x-2">
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className={`px-3 py-1 rounded-md text-white bg-gradient-to-r from-blue-800 to-sky-700 ${
              currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:opacity-90"
            }`}
          />
        </PaginationItem>
        {[...Array(totalPages)].map((_, i) => (
          <PaginationItem key={i + 1}>
            <PaginationLink
              onClick={() => setCurrentPage(i + 1)}
              isActive={currentPage === i + 1}
              className={`px-3 py-1 rounded-md text-white ${
                currentPage === i + 1
                  ? "bg-gradient-to-r from-blue-800 to-sky-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className={`px-3 py-1 rounded-md text-white bg-gradient-to-r from-blue-800 to-sky-700 ${
              currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:opacity-90"
            }`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  </div>
)}

  {/* Status Change Modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Session Status</DialogTitle>
            <DialogDescription>
              Update the status for booking {selectedSession?.bookingNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete booking {selectedSession?.bookingNumber}? This action cannot be undone.
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
