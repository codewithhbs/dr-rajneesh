import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useSessionBookings } from '@/hooks/sessions';
import { statusOptions } from '@/constant/Urls';
import Loading from '@/components/ui/loading';
const AllSessions = () => {
  const { sessionDetails, loading, error, fetchSessionDetails } = useSessionBookings({ id: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clinicFilter, setClinicFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [newStatus, setNewStatus] = useState('')
  const uniqueClinics = useMemo(() => {
    const clinics = sessionDetails.map(session => session.session_booking_for_clinic.clinic_name);
    return [...new Set(clinics)];
  }, []);

  console.log('Unique statusFilter:', statusFilter);
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
    console.log('Initial sessionDetails:', sessionDetails);

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();

      filtered = filtered.filter(session => {
        const nameMatch = session.patient_details?.name?.toLowerCase().includes(lowerSearch);
        const bookingMatch = session.bookingNumber?.toLowerCase().includes(lowerSearch);
        const serviceMatch = session.treatment_id?.service_name?.toLowerCase().includes(lowerSearch);

        return nameMatch || bookingMatch || (!!session.treatment_id && serviceMatch);
      });

      console.log('After searchTerm filter:', filtered);
    }


    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
      console.log('After statusFilter:', filtered);
    }

    if (clinicFilter !== 'all') {
      filtered = filtered.filter(session => session.clinic_id === clinicFilter);
      console.log('After clinicFilter:', filtered);
    }

    if (dateRange === 'today') {
      filtered = filtered.filter(session =>
        session.SessionDates?.some(sessionDate => isToday(sessionDate.date))
      );
      console.log('After dateRange "today":', filtered);
    } else if (dateRange === 'upcoming') {
      filtered = filtered.filter(session =>
        session.SessionDates?.some(sessionDate => isUpcoming(sessionDate.date))
      );
      console.log('After dateRange "upcoming":', filtered);
    }

    if (dateFilter) {
      filtered = filtered.filter(session =>
        session.SessionDates?.some(sessionDate => {
          const sessionDateObj = new Date(sessionDate.date);
          return sessionDateObj.toDateString() === dateFilter.toDateString();
        })
      );
      console.log('After specific dateFilter:', filtered);
    }

    return filtered;
  }, [sessionDetails, searchTerm, statusFilter, clinicFilter, dateRange, dateFilter]);


  // Pagination logic
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-green-100 text-green-800',
      'Payment Not Completed': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-800',
      'Completed': 'bg-blue-100 text-blue-800',
      'Rescheduled': 'bg-purple-100 text-purple-800',
      'Partially Completed': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Action handlers
  const handleStatusChange = (session) => {
    setSelectedSession(session);
    setNewStatus(session.session_status);
    setStatusModalOpen(true);
  };

  const handleDelete = (session) => {
    setSelectedSession(session);
    setDeleteModalOpen(true);
  };

  const handleView = (session) => {
    window.location.href = `/dashboard/admin/sessions/${session._id}`;
  };

  const confirmStatusChange = () => {
    // Here you would make API call to update status
    console.log('Updating status for session:', selectedSession._id, 'to:', newStatus);
    setStatusModalOpen(false);
    setSelectedSession(null);
  };

  const confirmDelete = () => {
    // Here you would make API call to delete session
    console.log('Deleting session:', selectedSession._id);
    setDeleteModalOpen(false);
    setSelectedSession(null);
  };



  if (loading) return <Loading message='Loading sessions Bookings' />
  if (error) return <div className="text-red-500">Error loading sessions: {error.message}</div>;

  return (
    <div className="container bg-white mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">All Sessions Bookings</h1>
          <p className="text-muted-foreground">
            Manage all your healthcare sessions • {filteredSessions.length} of {sessionDetails.length} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchSessionDetails()} variant="outline">
            Refresh
          </Button>
          <Button variant="destructive">
            Book New Session
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        {/* Search */}
        <div className="col-span-2">
          <Input
            type="text"
            placeholder="Search by patient, service, or booking number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clinic Filter */}
        <Select value={clinicFilter} onValueChange={setClinicFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Clinic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clinics</SelectItem>
            {uniqueClinics.map(clinic => (
              <SelectItem key={clinic} value={clinic}>{clinic}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Filter */}
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            <SelectItem value="today">Today's Sessions</SelectItem>
            <SelectItem value="upcoming">Upcoming Sessions</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !dateFilter && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
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

      {/* Clear Filters */}
      {(searchTerm || statusFilter !== 'all' || clinicFilter !== 'all' || dateFilter || dateRange !== 'all') && (
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setClinicFilter('all');
              setDateFilter(null);
              setDateRange('all');
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableCaption>Session bookings management table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Booking #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Doctor/Clinic</TableHead>
              <TableHead>Next Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSessions.map((session) => (
              <TableRow key={session._id}>
                <TableCell className="font-mono text-sm">
                  {session.bookingNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{session.patient_details.name}</div>
                    <div className="text-sm text-muted-foreground">{session.patient_details?.email}</div>
                    <div className="text-sm text-muted-foreground">{session.patient_details?.phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{session?.treatment_id?.service_name || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">
                    {session.no_of_session_book} sessions
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{session.session_booking_for_doctor.doctor_name}</div>
                    <div className="text-sm text-muted-foreground truncate max-w-32">
                      {session.session_booking_for_clinic.clinic_name}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {session.nextSession ? (
                    <div>
                      <div className="font-medium">
                        {format(new Date(session.nextSession.date), "MMM dd, yyyy")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {session.nextSession.time}
                        {isToday(session.nextSession.date) && (
                          <Badge variant="secondary" className="ml-2">Today</Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No upcoming session</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(session.session_status)}>
                    {session.session_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {session.completedSessionsCount}/{session.no_of_session_book} completed
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(session.completedSessionsCount / session.no_of_session_book) * 100}%` }}
                    ></div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  ₹{session.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(session)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(session)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(session)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
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

  )
}

export default AllSessions