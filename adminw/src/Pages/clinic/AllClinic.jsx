"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  CalendarIcon,
  Eye,
  Edit,
  Trash2,
  Filter,
  X,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Plus,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const API_URL = "http://localhost:7900/api/v1";

const AllClinic = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteClinicId, setDeleteClinicId] = useState(null);

  const [createFormData, setCreateFormData] = useState({
    clinic_name: "",
    email: "",
    phone_numbers: [""],
    clinic_address: "",
    open_time: "",
    close_time: "",
    off_day: "Sunday",
    start_date: "",
    end_date: "",
    clinic_map: "",
    clinic_stauts: "Published",
    any_special_note: "",
    images: [],
  });

  const [editFormData, setEditFormData] = useState({
    clinic_name: "",
    email: "",
    phone_numbers: [""],
    clinic_address: "",
    open_time: "",
    close_time: "",
    off_day: "Sunday",
    start_date: "",
    end_date: "",
    clinic_map: "",
    clinic_stauts: "Published",
    any_special_note: "",
    images: [],
  });

  // Fetch clinics
  const fetchClinics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/get-all-clinic`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data.clinics);
      } else {
        throw new Error(result.message || "Failed to fetch clinics");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single clinic
  const fetchSingleClinic = async (clinicId) => {
    try {
      const response = await fetch(`${API_URL}/get-clinic/${clinicId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success ? result.data.clinic : null;
    } catch (err) {
      console.error("Error fetching single clinic:", err);
      return null;
    }
  };

  // Create clinic
  const createClinic = async (clinicData) => {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append("clinic_name", clinicData.clinic_name);
      formData.append("email", clinicData.email);
      formData.append(
        "phone_numbers",
        JSON.stringify(clinicData.phone_numbers)
      );
      formData.append("clinic_address", clinicData.clinic_address);
      formData.append("open_time", clinicData.open_time);
      formData.append("close_time", clinicData.close_time);
      formData.append("off_day", clinicData.off_day);
      formData.append("start_date", clinicData.start_date);
      formData.append("end_date", clinicData.end_date);
      formData.append("clinic_map", clinicData.clinic_map);
      formData.append("clinic_stauts", clinicData.clinic_stauts);
      formData.append("any_special_note", clinicData.any_special_note);

      // Add images
      clinicData.images.forEach((image) => {
        formData.append("images", image);
      });

      const response = await fetch(`${API_URL}/create-clinic`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Clinic created successfully");
        fetchClinics();
        return true;
      } else {
        throw new Error(result.message || "Failed to create clinic");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(errorMessage);
      return false;
    }
  };

  // Update clinic
  const updateClinic = async (clinicId, clinicData) => {
    try {
      const formData = new FormData();

      // Add text fields
      formData.append("clinic_name", clinicData.clinic_name);
      formData.append("email", clinicData.email);
      formData.append(
        "phone_numbers",
        JSON.stringify(clinicData.phone_numbers)
      );
      formData.append("clinic_address", clinicData.clinic_address);
      formData.append("open_time", clinicData.open_time);
      formData.append("close_time", clinicData.close_time);
      formData.append("off_day", clinicData.off_day);
      formData.append("start_date", clinicData.start_date);
      formData.append("end_date", clinicData.end_date);
      formData.append("clinic_map", clinicData.clinic_map);
      formData.append("clinic_stauts", clinicData.clinic_stauts);
      formData.append("any_special_note", clinicData.any_special_note);

      // Add images if any
      clinicData.images.forEach((image) => {
        formData.append("image", image);
      });

      const response = await fetch(`${API_URL}/update-clinic/${clinicId}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Clinic updated successfully");
        fetchClinics();
        return true;
      } else {
        throw new Error(result.message || "Failed to update clinic");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(errorMessage);
      return false;
    }
  };

  // Delete clinic
  const deleteClinic = async (clinicId) => {
    try {
      const response = await fetch(`${API_URL}/delete-clinic/${clinicId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData((prevData) =>
          prevData.filter((clinic) => clinic._id !== clinicId)
        );

        toast.success("Clinic deleted successfully");

        return true;
      } else {
        throw new Error(result.message || "Failed to delete clinic");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error(errorMessage);

      return false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  // Filter and pagination logic

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handleViewClinic = async (clinic) => {
    const fullClinic = await fetchSingleClinic(clinic._id);
    setSelectedClinic(fullClinic || clinic);
    setShowViewDialog(true);
  };
  const padTime = (timeStr) => {
    const [h, m] = timeStr.split(":");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  const handleEditClinic = (clinic) => {
    setSelectedClinic(clinic);
    setEditFormData({
      clinic_name: clinic.clinic_name,
      email: clinic.clinic_contact_details.email,
      phone_numbers: clinic.clinic_contact_details.phone_numbers,
      clinic_address: clinic.clinic_contact_details.clinic_address,
      open_time: padTime(clinic.clinic_timings.open_time),
      close_time: padTime(clinic.clinic_timings.close_time),
      off_day: clinic.clinic_timings.off_day,
      start_date: new Date(clinic.BookingAvailabeAt.start_date)
        .toISOString()
        .split("T")[0],
      end_date: new Date(clinic.BookingAvailabeAt.end_date)
        .toISOString()
        .split("T")[0],

      clinic_map: clinic.clinic_map,
      clinic_stauts: clinic.clinic_stauts,
      any_special_note: clinic.any_special_note,
      images: [],
    });
    setShowEditDialog(true);
  };

  const handleCreateClinic = async () => {
    const success = await createClinic(createFormData);
    if (success) {
      setShowCreateDialog(false);
      setCreateFormData({
        clinic_name: "",
        email: "",
        phone_numbers: [""],
        clinic_address: "",
        open_time: "",
        close_time: "",
        off_day: "Sunday",
        start_date: "",
        end_date: "",
        clinic_map: "",
        clinic_stauts: "Published",
        any_special_note: "",
        images: [],
      });
    }
  };

  const handleUpdateClinic = async () => {
    if (!selectedClinic) return;

    const success = await updateClinic(selectedClinic._id, editFormData);
    if (success) {
      setShowEditDialog(false);
      setSelectedClinic(null);
    }
  };

  const handleDeleteClinic = (clinicId) => {
    setDeleteClinicId(clinicId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteClinicId) return;

    const success = await deleteClinic(deleteClinicId);
    if (success) {
      setShowDeleteDialog(false);
      setDeleteClinicId(null);
    }
  };

  // Utility functions
  const getStatusBadge = (status) => {
    const variants = {
      Published: "bg-green-100 text-green-800 border-green-200",
      Draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Archived: "bg-red-100 text-red-800 border-red-200",
    };
    return variants[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const addPhoneNumber = (formData, setFormData) => {
    setFormData({
      ...formData,
      phone_numbers: [...formData.phone_numbers, ""],
    });
  };

  const removePhoneNumber = (index, formData, setFormData) => {
    const newPhoneNumbers = formData.phone_numbers.filter(
      (_, i) => i !== index
    );
    setFormData({
      ...formData,
      phone_numbers: newPhoneNumbers.length > 0 ? newPhoneNumbers : [""],
    });
  };

  const updatePhoneNumber = (index, value, formData, setFormData) => {
    const newPhoneNumbers = [...formData.phone_numbers];
    newPhoneNumbers[index] = value;
    setFormData({
      ...formData,
      phone_numbers: newPhoneNumbers,
    });
  };

  // Statistics
  const stats = useMemo(
    () => ({
      total: data.length,
      published: data.filter((c) => c.clinic_stauts === "Published").length,
      draft: data.filter((c) => c.clinic_stauts === "Draft").length,
      avgRating:
        data.length > 0
          ? (
              data.reduce((sum, c) => sum + c.clinic_ratings, 0) / data.length
            ).toFixed(1)
          : "0",
    }),
    [data]
  );

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-lg">Loading clinics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-lg bg-gradient-to-r from-blue-800 to-sky-700 text-white">
        <div>
          <h1 className="text-3xl font-bold">Clinic Management</h1>
          <p className="mt-1 text-white/80">
            Manage and monitor all clinics in your system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* <Button
            onClick={fetchClinics}
           className="bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 shadow-lg rounded px-5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button> */}
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
        >
            <Plus className="h-4 w-4" />
            <span>Add Clinic</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clinics */}
        <Card className="relative overflow-hidden rounded-2xl shadow-md bg-gradient-to-br from-blue-50 to-sky-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-blue-600">Total Clinics</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-4 bg-white/70 backdrop-blur-md rounded-xl shadow-sm">
                <Building2 className="h-7 w-7 text-blue-600" />
                </div>
            </div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50 pointer-events-none" />
        </Card>

        {/* Published */}
        <Card className="relative overflow-hidden rounded-2xl shadow-md bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-3xl font-bold text-gray-900">{stats.published}</p>
                </div>
                <div className="p-4 bg-white/70 backdrop-blur-md rounded-xl shadow-sm">
                <Eye className="h-7 w-7 text-green-600" />
                </div>
            </div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50 pointer-events-none" />
        </Card>

        {/* Draft */}
        <Card className="relative overflow-hidden rounded-2xl shadow-md bg-gradient-to-br from-yellow-50 to-amber-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-yellow-600">Draft</p>
                <p className="text-3xl font-bold text-gray-900">{stats.draft}</p>
                </div>
                <div className="p-4 bg-white/70 backdrop-blur-md rounded-xl shadow-sm">
                <Edit className="h-7 w-7 text-yellow-600" />
                </div>
            </div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50 pointer-events-none" />
        </Card>

        {/* Avg Rating */}
        <Card className="relative overflow-hidden rounded-2xl shadow-md bg-gradient-to-br from-purple-50 to-pink-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
                <div>
                <p className="text-sm font-medium text-purple-600">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.avgRating}</p>
                </div>
                <div className="p-4 bg-white/70 backdrop-blur-md rounded-xl shadow-sm">
                <Star className="h-7 w-7 text-purple-600" />
                </div>
            </div>
            </CardContent>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50 pointer-events-none" />
        </Card>
        </div>



      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800 flex items-center">
              <X className="h-4 w-4 mr-2" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">entries</span>
        </div>

        {/* <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of{" "}
          {data.length} entries
        </div> */}
      </div>

      {/* Clinics Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
           <TableHeader className="bg-gradient-to-r from-blue-800 to-sky-700">
                <TableRow>
                    <TableHead className="w-[300px] text-white font-semibold">Clinic</TableHead>
                    <TableHead className="text-white font-semibold">Contact</TableHead>
                    <TableHead className="text-white font-semibold">Timings</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold">Rating</TableHead>
                    <TableHead className="text-white font-semibold">Created</TableHead>
                    <TableHead className="w-[120px] text-white font-semibold">Actions</TableHead>
                </TableRow>
                </TableHeader>

            <TableBody>
              {currentData.map((clinic) => (
                <TableRow key={clinic._id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {clinic.clinic_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {clinic.clinic_contact_details.clinic_address.substring(
                            0,
                            50
                          )}
                          ...
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="truncate max-w-[150px]">
                          {clinic.clinic_contact_details.email}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        <span>
                          {clinic.clinic_contact_details.phone_numbers[0]}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        <span>
                          {clinic.clinic_timings.open_time} -{" "}
                          {clinic.clinic_timings.close_time}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Off: {clinic.clinic_timings.off_day}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusBadge(clinic.clinic_stauts)}
                    >
                      {clinic.clinic_stauts}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="font-medium">
                        {clinic.clinic_ratings}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {format(new Date(clinic.createdAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">

                       {/* View Button */}
                        <Button
                                        size="sm"
                                        className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition"
                                        onClick={() => handleViewClinic(clinic)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                      
                                      {/* Edit Button */}
                                      <Button
                                        size="sm"
                                        className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm transition"
                                        onClick={() => handleEditClinic(clinic)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                      
                                      {/* Delete Button */}
                                      <Button
                                        size="sm"
                                        className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
                                        onClick={() => handleDeleteClinic(clinic._id)}
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

        {currentData.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              No clinics found matching your criteria
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* View Clinic Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clinic Details</DialogTitle>
          </DialogHeader>
          {selectedClinic && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-gradient-to-br from-white via-blue-50 to-blue-100/40 shadow-md hover:shadow-xl rounded-xl border border-gray-200 transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-gray-200">
                        <CardTitle className="flex items-center text-gray-800 font-semibold">
                        <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                        Basic Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div>
                        <Label className="text-sm font-medium text-gray-700">Clinic Name</Label>
                        <p className="mt-1 text-sm text-gray-900">{selectedClinic.clinic_name}</p>
                        </div>
                        <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <div className="mt-1">
                            <Badge className={getStatusBadge(selectedClinic.clinic_stauts)}>
                            {selectedClinic.clinic_stauts}
                            </Badge>
                        </div>
                        </div>
                        <div>
                        <Label className="text-sm font-medium text-gray-700">Rating</Label>
                        <div className="mt-1 flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 mr-1" />
                            <span className="font-medium">{selectedClinic.clinic_ratings}</span>
                        </div>
                        </div>
                    </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white via-green-50 to-emerald-100/40 shadow-md hover:shadow-xl rounded-xl border border-gray-200 transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-gray-200">
                        <CardTitle className="flex items-center text-gray-800 font-semibold">
                        <Phone className="h-5 w-5 mr-2 text-emerald-600" />
                        Contact Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="mt-1 text-sm text-gray-900">
                            {selectedClinic.clinic_contact_details.email}
                        </p>
                        </div>
                        <div>
                        <Label className="text-sm font-medium text-gray-600">Phone Numbers</Label>
                        <div className="mt-1 space-y-1">
                            {selectedClinic.clinic_contact_details.phone_numbers.map((phone, index) => (
                            <p
                                key={index}
                                className="text-sm text-gray-900 flex items-center gap-2"
                            >
                                📞 {phone}
                            </p>
                            ))}
                        </div>
                        </div>
                        <div>
                        <Label className="text-sm font-medium text-gray-600">Address</Label>
                        <p className="mt-1 text-sm text-gray-900">
                            {selectedClinic.clinic_contact_details.clinic_address}
                        </p>
                        </div>
                    </CardContent>
                    </Card>

               {/* Timings Card */}
<Card className="bg-gradient-to-br from-white via-amber-50 to-yellow-100/40 shadow-md hover:shadow-xl rounded-xl border border-gray-200 transition-all duration-300">
  <CardHeader className="pb-3 border-b border-gray-200">
    <CardTitle className="flex items-center text-gray-800 font-semibold">
      <Clock className="h-5 w-5 mr-2 text-yellow-500" />
      Timings
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 pt-4">
    <div>
      <Label className="text-sm font-medium text-gray-600">Operating Hours</Label>
      <p className="mt-1 text-sm text-gray-900">
        {selectedClinic.clinic_timings.open_time} - {selectedClinic.clinic_timings.close_time}
      </p>
    </div>
    <div>
      <Label className="text-sm font-medium text-gray-600">Off Day</Label>
      <p className="mt-1 text-sm text-gray-900">
        {selectedClinic.clinic_timings.off_day}
      </p>
    </div>
  </CardContent>
</Card>

{/* Booking Availability Card */}
<Card className="bg-gradient-to-br from-white via-purple-50 to-pink-100/40 shadow-md hover:shadow-xl rounded-xl border border-gray-200 transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-gray-200">
                        <CardTitle className="flex items-center text-gray-800 font-semibold">
                        <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                        Booking Availability
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div>
                        <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                        <p className="mt-1 text-sm text-gray-900">
                            {format(new Date(selectedClinic.BookingAvailabeAt.start_date), "PPP")}
                        </p>
                        </div>
                        <div>
                        <Label className="text-sm font-medium text-gray-600">End Date</Label>
                        <p className="mt-1 text-sm text-gray-900">
                            {format(new Date(selectedClinic.BookingAvailabeAt.end_date), "PPP")}
                        </p>
                        </div>
                    </CardContent>
                    </Card>
              </div>

             {/* Special Notes */}
            {selectedClinic.any_special_note && (
            <Card className="bg-gradient-to-br from-white via-sky-50 to-indigo-50/40 shadow-md hover:shadow-xl rounded-xl border border-gray-200 transition-all duration-300">
                <CardHeader className="pb-3 border-b border-gray-200">
                <CardTitle className="text-gray-800 font-semibold">
                    Special Notes
                </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                <p className="text-sm text-gray-900">{selectedClinic.any_special_note}</p>
                </CardContent>
            </Card>
            )}

            {/* Created / Updated Info */}
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4">
            <div className="bg-white shadow-sm rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all duration-200">
                <Label className="text-sm font-medium text-gray-700">Created At</Label>
                <p className="mt-1 text-gray-900">
                {format(new Date(selectedClinic.createdAt), "PPP pp")}
                </p>
            </div>
            <div className="bg-white shadow-sm rounded-xl p-3 border border-gray-100 hover:shadow-md transition-all duration-200">
                <Label className="text-sm font-medium text-gray-700">Updated At</Label>
                <p className="mt-1 text-gray-900">
                {format(new Date(selectedClinic.updatedAt), "PPP pp")}
                </p>
            </div>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Clinic Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Clinic</DialogTitle>
            <DialogDescription>
              Add a new clinic to your system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-clinic-name">Clinic Name *</Label>
                <Input
                  id="create-clinic-name"
                  value={createFormData.clinic_name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      clinic_name: e.target.value,
                    })
                  }
                  placeholder="Enter clinic name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Numbers *</Label>
                {createFormData.phone_numbers.map((phone, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={phone}
                      onChange={(e) =>
                        updatePhoneNumber(
                          index,
                          e.target.value,
                          createFormData,
                          setCreateFormData
                        )
                      }
                      placeholder="Enter phone number"
                    />
                    {createFormData.phone_numbers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removePhoneNumber(
                            index,
                            createFormData,
                            setCreateFormData
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addPhoneNumber(createFormData, setCreateFormData)
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phone
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-address">Address *</Label>
                <Textarea
                  id="create-address"
                  value={createFormData.clinic_address}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      clinic_address: e.target.value,
                    })
                  }
                  placeholder="Enter clinic address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-map">Google Maps Link</Label>
                <Input
                  id="create-map"
                  value={createFormData.clinic_map}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      clinic_map: e.target.value,
                    })
                  }
                  placeholder="Enter Google Maps link"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-open-time">Open Time *</Label>
                  <Input
                    id="create-open-time"
                    type="time"
                    value={createFormData.open_time}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        open_time: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-close-time">Close Time *</Label>
                  <Input
                    id="create-close-time"
                    type="time"
                    value={createFormData.close_time}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        close_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-off-day">Off Day</Label>
                <Select
                  value={createFormData.off_day}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, off_day: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select off day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-start-date">
                    Booking Start Date *
                  </Label>
                  <Input
                    id="create-start-date"
                    type="datetime-local"
                    value={createFormData.start_date}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-end-date">Booking End Date *</Label>
                  <Input
                    id="create-end-date"
                    type="datetime-local"
                    value={createFormData.end_date}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-status">Status</Label>
                <Select
                  value={createFormData.clinic_stauts}
                  onValueChange={(value) =>
                    setCreateFormData({ ...createFormData, clinic_stauts })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-images">Clinic Images</Label>
                <Input
                  id="create-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setCreateFormData({ ...createFormData, images: files });
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="create-notes">Special Notes</Label>
              <Textarea
                id="create-notes"
                value={createFormData.any_special_note}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    any_special_note: e.target.value,
                  })
                }
                placeholder="Enter any special notes about the clinic"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-800 to-sky-700 text-white hover:opacity-90 transition-opacity" onClick={handleCreateClinic}>Create Clinic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Clinic Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
            <DialogDescription>
              Update clinic information and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-clinic-name">Clinic Name *</Label>
                <Input
                  id="edit-clinic-name"
                  value={editFormData.clinic_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      clinic_name: e.target.value,
                    })
                  }
                  placeholder="Enter clinic name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Numbers *</Label>
                {editFormData.phone_numbers.map((phone, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      value={phone}
                      onChange={(e) =>
                        updatePhoneNumber(
                          index,
                          e.target.value,
                          editFormData,
                          setEditFormData
                        )
                      }
                      placeholder="Enter phone number"
                    />
                    {editFormData.phone_numbers.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removePhoneNumber(
                            index,
                            editFormData,
                            setEditFormData
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addPhoneNumber(editFormData, setEditFormData)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phone
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Textarea
                  id="edit-address"
                  value={editFormData.clinic_address}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      clinic_address: e.target.value,
                    })
                  }
                  placeholder="Enter clinic address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-map">Google Maps Link</Label>
                <Input
                  id="edit-map"
                  value={editFormData.clinic_map}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      clinic_map: e.target.value,
                    })
                  }
                  placeholder="Enter Google Maps link"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-open-time">Open Time *</Label>
                  <Input
                    id="edit-open-time"
                    type="time"
                    value={editFormData.open_time}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        open_time: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-close-time">Close Time *</Label>
                  <Input
                    id="edit-close-time"
                    type="time"
                    value={editFormData.close_time}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        close_time: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-off-day">Off Day</Label>
                <Select
                  value={editFormData.off_day}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, off_day: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select off day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-start-date">Booking Start Date *</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={editFormData.start_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-end-date">Booking End Date *</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={editFormData.end_date}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        end_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editFormData.clinic_stauts}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, clinic_stauts })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-images">Update Images</Label>
                <Input
                  id="edit-images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setEditFormData({ ...editFormData, images: files });
                  }}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-notes">Special Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.any_special_note}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    any_special_note: e.target.value,
                  })
                }
                placeholder="Enter any special notes about the clinic"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-blue-800 to-sky-700 text-white hover:opacity-90 transition-opacity" onClick={handleUpdateClinic}>Update Clinic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Clinic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this clinic? This action cannot be
              undone and will permanently remove all clinic data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Clinic
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllClinic;
