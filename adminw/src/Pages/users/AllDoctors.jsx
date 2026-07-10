"use client";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  Star,
  MapPin,
  Globe,
  Stethoscope,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import axios from "axios";

const AllDoctors = () => {
  // State management
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  // Form management
  const [imagesPreview, setImagesPreview] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      doctor_name: "",
      specialization: "",
      languagesSpoken: "",
      doctor_status: "Published",
      doctor_ratings: "",
      any_special_note: "",
      clinic_ids: [],
      images: [],
    },
  });
 const cleanArrayItem = (item) => item.replace(/['"\[\]\n]/g, "").trim();
 
  const isEditMode = !!editingDoctor;

  // Fetch functions
  const fetchDoctors = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/get-all-doctor?page=${page}`);
      if (res.data.success) {
        setDoctors(res.data.data);
        setPagination(res.data.pagination);
        setCurrentPage(res.data.pagination.currentPage);
      }
    } catch (err) {
      setError("Failed to fetch doctors. Please try again.");
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:7900/api/v1/get-all-clinic"
      );
      setClinics(res.data?.data?.clinics || []);
    } catch (err) {
      console.error("Error fetching clinics:", err);
    }
  };

  // Effects
  useEffect(() => {
    fetchDoctors(currentPage);
    fetchClinics();
  }, [currentPage]);

  useEffect(() => {
    if (isEditMode && editingDoctor) {
      reset({
        doctor_name: editingDoctor.doctor_name || "",
      specialization: Array.isArray(editingDoctor.specialization)
        ? editingDoctor.specialization.map(cleanArrayItem).join(", ")
        : editingDoctor.specialization || "",
      languagesSpoken: Array.isArray(editingDoctor.languagesSpoken)
        ? editingDoctor.languagesSpoken.map(cleanArrayItem).join(", ")
        : editingDoctor.languagesSpoken || "",
        doctor_status: editingDoctor.doctor_status ?? true,
        doctor_ratings: editingDoctor.doctor_ratings || "",
        any_special_note: editingDoctor.any_special_note || "",
        clinic_ids:
          editingDoctor.clinic_ids?.map((clinic) =>
            typeof clinic === "object" ? clinic._id : clinic
          ) || [],
      });
      setUploadedImages(editingDoctor.images || []);
      setImagesPreview([]);
    } else {
      reset({
        doctor_name: "",
        specialization: "",
        languagesSpoken: "",
        doctor_status: "Published",
        doctor_ratings: "",
        any_special_note: "",
        clinic_ids: [],
        images: [],
      });
      setUploadedImages([]);
      setImagesPreview([]);
    }
  }, [editingDoctor, isEditMode, reset]);

  // Handlers
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this doctor?")) return;

    setLoading(true);
    try {
      await axiosInstance.delete(`/delete-doctor/${id}`);
      await fetchDoctors(currentPage);
      setError("");
    } catch (err) {
      setError("Failed to delete doctor. Please try again.");
      console.error("Failed to delete:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setValue("images", files);
    setImagesPreview(files.map((file) => URL.createObjectURL(file)));
  };

  const removeUploadedImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removePreviewImage = (index) => {
    const currentImages = watch("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue("images", newImages);
    setImagesPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();

    // Process form data
    Object.entries(data).forEach(([key, value]) => {
      if (key === "clinic_ids") {
        value.forEach((id) => formData.append("clinic_ids[]", id));
      } else if (key === "images") {
        value.forEach((file) => formData.append("images", file));
      } else if (key === "specialization" || key === "languagesSpoken") {
        // Convert comma-separated strings to arrays
        const arrayValue =
          typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value;
        formData.append(key, JSON.stringify(arrayValue));
      } else {
        formData.append(key, value);
      }
    });

    const endpoint = isEditMode
      ? `http://localhost:7900/api/v1/update-doctor/${editingDoctor._id}`
      : `http://localhost:7900/api/v1/create-doctor`;

    const method = isEditMode ? "put" : "post";

    try {
      await axios[method](endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchDoctors(currentPage);
      setFormDialogOpen(false);
      setEditingDoctor(null);
      setError("");
    } catch (error) {
      setError("Failed to save doctor. Please try again.");
      console.error("Doctor save failed", error);
    }
  };






  const openCreateModal = () => {
    setEditingDoctor(null);
    setFormDialogOpen(true);
  };

  const openEditModal = (doctor) => {
    setEditingDoctor(doctor);
    setFormDialogOpen(true);
  };

  const openViewModal = (doctor) => {
    setSelectedDoctor(doctor);
    setViewDialogOpen(true);
  };

  // Filter doctors based on search and status
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialization &&
        doctor.specialization.some((spec) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && doctor.doctor_status) ||
      (filterStatus === "inactive" && !doctor.doctor_status);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-sky-700 text-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        {/* Title Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-wide">
            Doctor Management
          </h1>
          <p className="text-white/80 text-sm sm:text-base">
            Manage your medical staff efficiently
          </p>
        </div>

        {/* Button */}
        <Button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
        >
          <Plus size={18} />
          Add New Doctor
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="shadow-md rounded-lg">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 h-10 shadow-sm hover:shadow-md transition-shadow">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent focus:outline-none text-gray-700 text-sm w-full h-full px-2 rounded"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Doctors ({filteredDoctors.length})</span>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-to-r from-blue-800 to-sky-700 text-white shadow-sm">
                  <th className="text-left p-4 font-semibold rounded-tl-lg">
                    Doctor
                  </th>
                  <th className="text-left p-4 font-semibold">
                    Specialization
                  </th>
                  <th className="text-left p-4 font-semibold">Languages</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Rating</th>
                  <th className="text-left p-4 font-semibold rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr
                    key={doctor._id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {doctor.doctor_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {doctor._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-sm text-gray-700">
                      {doctor.specialization &&
                      doctor.specialization.length > 0 ? (
                        <>
                          <span className="bg-blue-300 text-dark px-2 py-1 rounded shadow-sm">
                            {doctor.specialization
                              .slice(0, 2)
                              .map((spec) =>
                                spec.replace(/['"\[\]\n]/g, "").trim()
                              )
                              .join(", ")}
                            {doctor.specialization.length > 2 &&
                              ", Many More +"}
                          </span>
                        </>
                      ) : (
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-lg">
                          N/A
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {doctor.languagesSpoken &&
                        doctor.languagesSpoken.length > 0 ? (
                          <>
                            {/* Display up to 2 languages */}
                            {doctor.languagesSpoken
                              .slice(0, 2)
                              .map((lang, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-300 text-dark text-xs md:text-sm font-medium px-2 py-1 rounded shadow-sm"
                                >
                                  {lang.replace(/['"\[\]\n]/g, "").trim()}
                                </span>
                              ))}

                            {/* Show 'Many More +' if more than 2 languages */}
                            {doctor.languagesSpoken.length > 2 && (
                              <span className="bg-blue-400 text-white text-xs md:text-sm font-medium px-2 py-1 rounded shadow-sm">
                                Many More +
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            N/A
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium shadow-sm ${
                          doctor.doctor_status
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {doctor.doctor_status ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-2  text-yellow-800 px-3 py-1 rounded shadow-sm text-sm font-medium">
                        <Star
                          size={16}
                          className="text-yellow-500 fill-current"
                        />
                        <span>{doctor.doctor_ratings || "N/A"}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewModal(doctor)}
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(doctor)}
                          className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm transition"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doctor._id)}
                          className="h-8 w-8 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <Stethoscope size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No doctors found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by adding your first doctor"}
                </p>
                <Button onClick={openCreateModal} className="gap-2">
                  <Plus size={16} />
                  Add Doctor
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage || loading}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Previous
          </Button>
          <span className="text-sm font-medium px-4 py-2 bg-gray-100 rounded">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* View Doctor Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="bg-gradient-to-r from-blue-800 to-sky-700 text-white p-4 rounded-t-lg relative">
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="text-white" />
              {selectedDoctor?.doctor_name}
            </DialogTitle>
            <DialogDescription className="text-white">
              {selectedDoctor?.any_special_note}
            </DialogDescription>
            {/* Top-right close button */}
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6">
              {/* Top Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Specializations & Languages */}
                <div className="space-y-4">
                  {/* Specializations */}
                <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                      Specializations
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.specialization?.map((spec, idx) => {
                        const cleanedSpec = spec.replace(/['"\[\]\n]/g, "").trim();
                        return (
                          <span
                            key={idx}
                            className="inline-block px-4 py-1 text-sm font-medium text-white bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
                          >
                            {cleanedSpec}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* Languages Spoken */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                      Languages Spoken
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.languagesSpoken?.map((lang, idx) => {
                        const cleanedLang = lang
                          .replace(/['"\[\]\n]/g, "")
                          .trim();
                        return (
                          <span
                            key={idx}
                            className="inline-block px-4 py-1 text-sm font-medium text-white bg-gradient-to-r from-blue-400 to-blue-500 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
                          >
                            {cleanedLang}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Status & Rating */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Status
                    </Label>
                    <Badge
                      className={`px-3 py-1 rounded font-medium mt-1 ${
                        selectedDoctor.doctor_status
                          ? "bg-green-300 text-dark"
                          : "bg-red-300 text-red-800"
                      }`}
                    >
                      {selectedDoctor.doctor_status ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">
                      Rating
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Star
                        size={16}
                        className="text-yellow-400 fill-current"
                      />
                      <span className="font-medium">
                        {selectedDoctor.doctor_ratings || "Not rated"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Images */}
              {selectedDoctor?.doctor_images?.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">
                    Doctor Images
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {selectedDoctor.doctor_images.map((image, idx) => (
                      <div
                        key={idx}
                        className="w-full h-32 overflow-hidden rounded-xl border shadow hover:shadow-lg transition"
                      >
                        <img
                          src={image?.url}
                          alt={`doctor-image-${idx}`}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Associated Clinics */}
              <div>
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} />
                  Associated Clinics
                </Label>
                <div className="mt-2 space-y-2">
                  {selectedDoctor.clinic_ids?.length > 0 ? (
                    selectedDoctor.clinic_ids.map((clinic, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-xl shadow-sm hover:bg-gray-100 transition"
                      >
                        <div className="font-medium">
                          {clinic.clinic_name || clinic}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      No clinics associated
                    </p>
                  )}
                </div>
              </div>

              {/* Extra Images */}
              {selectedDoctor.images?.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2">
                    Images
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedDoctor.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        className="w-full h-24 rounded-xl object-cover border shadow-sm"
                        alt={`Doctor ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Doctor Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-4xl w-full p-6 bg-white rounded-xl shadow-xl">
          {/* Header with Close Button */}
          <DialogHeader className="bg-gradient-to-r from-blue-800 to-sky-700 text-white p-4 rounded-t-lg relative">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <Stethoscope size={24} className="text-white" />
              {isEditMode ? "Edit Doctor" : "Create New Doctor"}
            </DialogTitle>
            <p className="mt-1 text-sm text-white/90">
              Fill in the details below to {isEditMode ? "update" : "add"} a
              doctor.
            </p>

            {/* Top-right close button */}
            <button
              type="button"
              onClick={() => setFormDialogOpen(false)}
              className="absolute top-3 right-3 bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <X size={16} />
            </button>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Name, Specialization, Languages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doctor_name" className="font-semibold">
                    Doctor Name *
                  </Label>
                  <Input
                    id="doctor_name"
                    {...register("doctor_name", {
                      required: "Doctor name is required",
                    })}
                    className={`mt-1 w-full ${
                      errors.doctor_name ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter doctor name"
                  />
                  {errors.doctor_name && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.doctor_name.message}
                    </p>
                  )}
                </div>
               


                <div>
                  <Label htmlFor="specialization" className="font-semibold">
                    Specialization *
                  </Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Cardiology, Neurology"
                    {...register("specialization", {
                      required: "Specialization is required",
                    })}
                    className={`mt-1 w-full ${
                      errors.specialization
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.specialization.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="languagesSpoken" className="font-semibold">
                    Languages Spoken
                  </Label>
                  <Input
                    id="languagesSpoken"
                    placeholder="e.g., English, Hindi"
                    {...register("languagesSpoken")}
                    className="mt-1 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="doctor_ratings" className="font-semibold">
                    Rating
                  </Label>
                  <Input
                    id="doctor_ratings"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="0.0 - 5.0"
                    {...register("doctor_ratings")}
                    className="mt-1 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="any_special_note" className="font-semibold">
                    Special Notes
                  </Label>
                  <Textarea
                    id="any_special_note"
                    rows={3}
                    placeholder="Add any notes about the doctor..."
                    {...register("any_special_note")}
                    className="mt-1 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <Checkbox
                    id="doctor_status"
                    checked={watch("doctor_status")}
                    onCheckedChange={(checked) =>
                      setValue("doctor_status", checked)
                    }
                    className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-400 transition-all"
                  />
                  <Label
                    htmlFor="doctor_status"
                    className="font-medium text-gray-700"
                  >
                    Active Status
                  </Label>
                </div>
              </div>
            </div>

            {/* Associated Clinics */}
            <div>
              <Label className="font-semibold">Associated Clinics</Label>
              <ScrollArea className="h-36 border rounded-lg p-3 mt-2">
                <div className="space-y-2">
                  {clinics.map((clinic) => (
                    <div key={clinic._id} className="flex items-center gap-2">
                      <Checkbox
                        id={`clinic-${clinic._id}`}
                        checked={watch("clinic_ids")?.includes(clinic._id)}
                        onCheckedChange={(checked) => {
                          const selected = watch("clinic_ids") || [];
                          setValue(
                            "clinic_ids",
                            checked
                              ? [...selected, clinic._id]
                              : selected.filter((id) => id !== clinic._id)
                          );
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-400 transition-all"
                      />
                      <Label
                        htmlFor={`clinic-${clinic._id}`}
                        className="text-sm"
                      >
                        {clinic.clinic_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Upload Images */}
            <div>
              <Label htmlFor="images" className="font-semibold">
                Upload Images
              </Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2"
              />
              {(imagesPreview.length > 0 || uploadedImages.length > 0) && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {imagesPreview.map((src, idx) => (
                    <div key={`preview-${idx}`} className="relative group">
                      <img
                        src={src}
                        alt={`Preview ${idx}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePreviewImage(idx)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                  {uploadedImages.map((img, idx) => (
                    <div key={`uploaded-${idx}`} className="relative group">
                      <img
                        src={img.url}
                        alt={`Uploaded ${idx}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeUploadedImage(idx)}
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <DialogFooter className="flex justify-end gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-gradient-to-r from-blue-800 to-sky-700 text-white hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Upload size={16} />
                )}
                {isEditMode ? "Update Doctor" : "Create Doctor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllDoctors;
