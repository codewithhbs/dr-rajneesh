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
  Filter
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
    formState: { errors, isSubmitting }
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
    }
  });

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
      const res = await axios.get("https://drkm.api.adsdigitalmedia.com/api/v1/get-all-clinic");
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
          ? editingDoctor.specialization.join(", ")
          : editingDoctor.specialization || "",
        languagesSpoken: Array.isArray(editingDoctor.languagesSpoken)
          ? editingDoctor.languagesSpoken.join(", ")
          : editingDoctor.languagesSpoken || "",
        doctor_status: editingDoctor.doctor_status ?? true,
        doctor_ratings: editingDoctor.doctor_ratings || "",
        any_special_note: editingDoctor.any_special_note || "",
        clinic_ids: editingDoctor.clinic_ids?.map(clinic =>
          typeof clinic === 'object' ? clinic._id : clinic
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
    setImagesPreview(files.map(file => URL.createObjectURL(file)));
  };

  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removePreviewImage = (index) => {
    const currentImages = watch("images") || [];
    const newImages = currentImages.filter((_, i) => i !== index);
    setValue("images", newImages);
    setImagesPreview(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const formData = new FormData();

    // Process form data
    Object.entries(data).forEach(([key, value]) => {
      if (key === "clinic_ids") {
        value.forEach(id => formData.append("clinic_ids[]", id));
      } else if (key === "images") {
        value.forEach(file => formData.append("images", file));
      } else if (key === "specialization" || key === "languagesSpoken") {
        // Convert comma-separated strings to arrays
        const arrayValue = typeof value === 'string'
          ? value.split(',').map(item => item.trim()).filter(Boolean)
          : value;
        formData.append(key, JSON.stringify(arrayValue));
      } else {
        formData.append(key, value);
      }
    });

    const endpoint = isEditMode
      ? `https://drkm.api.adsdigitalmedia.com/api/v1/update-doctor/${editingDoctor._id}`
      : `https://drkm.api.adsdigitalmedia.com/api/v1/create-doctor`;

    const method = isEditMode ? "put" : "post";

    try {
      await axios[method](endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" }
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
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialization && doctor.specialization.some(spec =>
        spec.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && doctor.doctor_status) ||
      (filterStatus === "inactive" && !doctor.doctor_status);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
          <p className="text-gray-600 mt-1">Manage your medical staff efficiently</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus size={18} />
          Add New Doctor
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold">Doctor</th>
                  <th className="text-left p-4 font-semibold">Specialization</th>
                  <th className="text-left p-4 font-semibold">Languages</th>
                  <th className="text-left p-4 font-semibold">Status</th>
                  <th className="text-left p-4 font-semibold">Rating</th>
                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Stethoscope size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{doctor.doctor_name}</div>
                          <div className="text-xs text-gray-500">ID: {doctor._id?.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {doctor.specialization?.slice(0, 2).map((spec, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {doctor.specialization?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doctor.specialization.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Globe size={14} />
                        <span className="text-sm">
                          {doctor.languagesSpoken?.slice(0, 2).join(", ")}
                          {doctor.languagesSpoken?.length > 2 && ` +${doctor.languagesSpoken.length - 2}`}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={doctor.doctor_status ? "default" : "secondary"}
                        className={doctor.doctor_status ? "bg-green-100 text-green-800" : ""}
                      >
                        {doctor.doctor_status ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-current" />
                        <span className="font-medium">{doctor.doctor_ratings || "N/A"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewModal(doctor)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(doctor)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(doctor._id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors found</h3>
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
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            Previous
          </Button>
          <span className="text-sm font-medium px-4 py-2 bg-gray-100 rounded">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage || loading}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* View Doctor Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="text-blue-600" />
              {selectedDoctor?.doctor_name}
            </DialogTitle>
            <DialogDescription>
              {selectedDoctor?.any_special_note}
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Specializations</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDoctor.specialization?.map((spec, idx) => (
                        <Badge key={idx} variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Languages Spoken</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDoctor.languagesSpoken?.map((lang, idx) => (
                        <Badge key={idx} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge
                        variant={selectedDoctor.doctor_status ? "default" : "secondary"}
                        className={selectedDoctor.doctor_status ? "bg-green-100 text-green-800" : ""}
                      >
                        {selectedDoctor.doctor_status ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Rating</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Star size={16} className="text-yellow-400 fill-current" />
                      <span className="font-medium">{selectedDoctor.doctor_ratings || "Not rated"}</span>
                    </div>
                  </div>
                </div>
              </div>
              {selectedDoctor?.doctor_images?.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {selectedDoctor.doctor_images.map((image, index) => (
                    <div key={index} className="w-full h-32 overflow-hidden rounded-md border shadow">
                      <img
                        src={image?.url}
                        alt={`doctor-image-${index}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}


              <Separator />

              <div>
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin size={16} />
                  Associated Clinics
                </Label>
                <div className="mt-2 space-y-2">
                  {selectedDoctor.clinic_ids?.length > 0 ? (
                    selectedDoctor.clinic_ids.map((clinic, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium">{clinic.clinic_name || clinic}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No clinics associated</p>
                  )}
                </div>
              </div>

              {selectedDoctor.images && selectedDoctor.images.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Images</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {selectedDoctor.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        className="w-full h-20 rounded-lg object-cover border"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="text-blue-600" />
              {isEditMode ? "Edit Doctor" : "Create New Doctor"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doctor_name">Doctor Name *</Label>
                  <Input
                    id="doctor_name"
                    {...register("doctor_name", { required: "Doctor name is required" })}
                    className={errors.doctor_name ? "border-red-500" : ""}
                  />
                  {errors.doctor_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.doctor_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    placeholder="e.g., Cardiology, Neurology (comma-separated)"
                    {...register("specialization", { required: "Specialization is required" })}
                    className={errors.specialization ? "border-red-500" : ""}
                  />
                  {errors.specialization && (
                    <p className="text-red-500 text-sm mt-1">{errors.specialization.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="languagesSpoken">Languages Spoken</Label>
                  <Input
                    id="languagesSpoken"
                    placeholder="e.g., English, Hindi, Spanish (comma-separated)"
                    {...register("languagesSpoken")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="doctor_ratings">Rating</Label>
                  <Input
                    id="doctor_ratings"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="0.0 - 5.0"
                    {...register("doctor_ratings")}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="doctor_status"
                    checked={watch("doctor_status")}
                    onCheckedChange={(checked) => setValue("doctor_status", checked)}
                  />
                  <Label htmlFor="doctor_status">Active Status</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="any_special_note">Special Notes</Label>
              <Textarea
                id="any_special_note"
                placeholder="Any special notes about the doctor..."
                rows={3}
                {...register("any_special_note")}
              />
            </div>

            <div>
              <Label>Associated Clinics</Label>
              <ScrollArea className="h-32 border rounded-lg p-4 mt-2">
                <div className="space-y-2">
                  {clinics.map(clinic => (
                    <div key={clinic._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`clinic-${clinic._id}`}
                        checked={watch("clinic_ids")?.includes(clinic._id)}
                        onCheckedChange={(checked) => {
                          const selected = watch("clinic_ids") || [];
                          if (checked) {
                            setValue("clinic_ids", [...selected, clinic._id]);
                          } else {
                            setValue("clinic_ids", selected.filter(id => id !== clinic._id));
                          }
                        }}
                      />
                      <Label htmlFor={`clinic-${clinic._id}`} className="text-sm">
                        {clinic.clinic_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>


            <div>
              <Label htmlFor="images">Upload Images</Label>
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
                  {/* New image previews */}
                  {imagesPreview.map((src, idx) => (
                    <div key={`preview-${idx}`} className="relative group">
                      <img src={src} className="w-full h-24 rounded-lg object-cover border" alt={`Preview ${idx + 1}`} />
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

                  {/* Existing uploaded images */}
                  {uploadedImages.map((img, idx) => (
                    <div key={`uploaded-${idx}`} className="relative group">
                      <img src={img.url} className="w-full h-24 rounded-lg object-cover border" alt={`Uploaded ${idx + 1}`} />
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

            <DialogFooter className="gap-2">
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
                className="gap-2"
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