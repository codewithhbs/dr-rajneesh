"use client"

import { API_URL } from "@/constant/Urls"
import { useEffect, useState, useRef, useMemo } from "react"
import axios from "axios"
import { useGetAllDoctor, useGetAllClinic } from "@/hooks/common"
import { toast } from "sonner"
import { Link, useSearchParams } from "react-router-dom"
import JoditEditor from "jodit-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X, Loader2, Save, ArrowLeft, Star } from 'lucide-react'

const validStatuses = ["Booking Open", "Booking Close", "Draft", "Published"]

const AddNewTreatMents = () => {
  const [searchParams] = useSearchParams()
  const isEdit = searchParams.get("edit") === "true"
  const EditTrearmentId = searchParams.get("id")

  const { data: clinics, loading: clinicsLoading } = useGetAllClinic()
  const { data: doctors, loading: doctorsLoading } = useGetAllDoctor()

  const editor = useRef(null)

  const [formData, setFormData] = useState({
    service_name: "",
    service_small_desc: "",
    service_desc: "",
    service_status: "Draft",
    service_session_allowed_limit: 3,
    service_per_session_price: 12000,
    service_per_session_discount_price: 10000,
    service_per_session_discount_percentage: 0,
    service_tag: "",
    service_doctor: "",
    service_available_at_clinics: [],
    position: 0,
    images: [],
  })

  const [previewImages, setPreviewImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  // Jodit editor config
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: "Enter detailed description of the treatment, benefits, and process...",
      height: 300,
      toolbar: true,
      spellcheck: true,
      language: "en",
      toolbarButtonSize: "medium",
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      buttons: [
        "bold",
        "italic",
        "underline",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "|",
        "outdent",
        "indent",
        "align",
        "|",
        "hr",
        "|",
        "fullsize",
        "brush",
        "|",
        "undo",
        "redo",
      ],
    }),
    [],
  )

  // Auto-select defaults when not editing
  useEffect(() => {
    if (!isEdit && !doctorsLoading && !clinicsLoading && doctors?.length && clinics?.length) {
      setFormData((prev) => ({
        ...prev,
        service_doctor: doctors[0]._id,
        service_available_at_clinics: clinics.map((clinic) => clinic._id),
      }))
    }
  }, [isEdit, doctors, clinics, doctorsLoading, clinicsLoading])

  // Calculate discount percentage automatically
  useEffect(() => {
    const originalPrice = Number.parseFloat(formData.service_per_session_price) || 0
    const discountPrice = Number.parseFloat(formData.service_per_session_discount_price) || 0

    if (originalPrice > 0 && discountPrice > 0 && discountPrice < originalPrice) {
      const percentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      setFormData((prev) => ({
        ...prev,
        service_per_session_discount_percentage: percentage,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        service_per_session_discount_percentage: 0,
      }))
    }
  }, [formData.service_per_session_price, formData.service_per_session_discount_price])

  // Fetch data if editing
  useEffect(() => {
    if (isEdit && EditTrearmentId) {
      fetchOldTreatMents()
    }
  }, [isEdit, EditTrearmentId])

  const fetchOldTreatMents = async () => {
    try {
      setFetchingData(true)
      const { data } = await axios.get(`${API_URL}/get-service/${EditTrearmentId}`)
      const service = data.data

      setFormData({
        service_name: service.service_name || "",
        service_small_desc: service.service_small_desc || "",
        service_desc: service.service_desc || "",
        service_status: service.service_status || "Draft",
        service_session_allowed_limit: service.service_session_allowed_limit || 1,
        service_per_session_price: service.service_per_session_price || 0,
        service_per_session_discount_price: service.service_per_session_discount_price || 0,
        service_per_session_discount_percentage: service.service_per_session_discount_percentage || 0,
        service_tag: service.service_tag || "",
        service_doctor: service.service_doctor?._id || "",
        service_available_at_clinics: service.service_available_at_clinics?.map((c) => c._id) || [],
        position: service.position || 0,
        images: [],
      })

      setPreviewImages(service.service_images || [])
    } catch (error) {
      console.error("Failed to fetch service:", error)
      toast.error("Unable to fetch treatment details.")
    } finally {
      setFetchingData(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)

    if (files.length + formData.images.length + previewImages.length > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    const newImages = []
    const newPreviews = []

    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        newImages.push(file)

        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push(e.target.result)
          if (newPreviews.length === files.length) {
            setPreviewImages((prev) => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      }
    })

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }))
  }

  const removeImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
    if (index >= previewImages.length - formData.images.length) {
      const newImageIndex = index - (previewImages.length - formData.images.length)
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== newImageIndex),
      }))
    }
  }

  const handleClinicToggle = (clinicId) => {
    setFormData((prev) => ({
      ...prev,
      service_available_at_clinics: prev.service_available_at_clinics.includes(clinicId)
        ? prev.service_available_at_clinics.filter((id) => id !== clinicId)
        : [...prev.service_available_at_clinics, clinicId],
    }))
  }

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.service_name.trim()) {
      toast.error("Service name is required")
      return
    }
    if (!formData.service_small_desc.trim()) {
      toast.error("Short description is required")
      return
    }
    if (!formData.service_desc.trim()) {
      toast.error("Full description is required")
      return
    }
    if (!formData.service_doctor) {
      toast.error("Please select a doctor")
      return
    }
    if (formData.service_available_at_clinics.length === 0) {
      toast.error("Please select at least one clinic")
      return
    }

    const form = new FormData()

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images") {
        value.forEach((img) => form.append("images", img))
      } else if (Array.isArray(value)) {
        value.forEach((item) => form.append(`${key}[]`, item))
      } else {
        form.append(key, value)
      }
    })

    try {
      setLoading(true)
      if (isEdit) {
        await axios.put(`${API_URL}/update-service/${EditTrearmentId}`, form)
        toast.success("Treatment updated successfully!")
      } else {
        await axios.post(`${API_URL}/create-service`, form)
        toast.success("Treatment created successfully!")
        
        // Reset form
        setFormData({
          service_name: "",
          service_small_desc: "",
          service_desc: "",
          service_status: "Draft",
          service_session_allowed_limit: 1,
          service_per_session_price: 12000,
          service_per_session_discount_price: 10000,
          service_per_session_discount_percentage: 0,
          service_tag: "",
          service_doctor: doctors?.[0]?._id || "",
          service_available_at_clinics: clinics?.map((clinic) => clinic._id) || [],
          position: 0,
          images: [],
        })
        setPreviewImages([])
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast.error(error.response?.data?.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading treatment data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <Link to={'/dashboard/treatments'}>Back</Link>
       
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? "Edit Treatment" : "Create New Treatment"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit ? "Update the treatment details below" : "Fill in the details to create a new treatment service"}
          </p>
        </div>

        {/* Main Form */}
        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service_name">Service Name *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => handleInputChange("service_name", e.target.value)}
                    placeholder="e.g., Neck Pain Relief"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_tag">Service Tag</Label>
                  <Input
                    id="service_tag"
                    value={formData.service_tag}
                    onChange={(e) => handleInputChange("service_tag", e.target.value)}
                    placeholder="e.g., pain-relief"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_small_desc">Short Description *</Label>
                <Textarea
                  id="service_small_desc"
                  value={formData.service_small_desc}
                  onChange={(e) => handleInputChange("service_small_desc", e.target.value)}
                  placeholder="Brief description of the treatment"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Full Description *</Label>
                <div className="border rounded-md">
                  <JoditEditor
                    ref={editor}
                    value={formData.service_desc}
                    config={config}
                    tabIndex={1}
                    onBlur={(newContent) => handleInputChange("service_desc", newContent)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service_status">Status</Label>
                  <Select
                    value={formData.service_status}
                    onValueChange={(value) => handleInputChange("service_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {validStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    type="number"
                    value={formData.position}
                    onChange={(e) => handleInputChange("position", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service_per_session_price">Original Price (₹) *</Label>
                  <Input
                    id="service_per_session_price"
                    type="number"
                    value={formData.service_per_session_price}
                    onChange={(e) =>
                      handleInputChange("service_per_session_price", Number.parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_per_session_discount_price">Discounted Price (₹)</Label>
                  <Input
                    id="service_per_session_discount_price"
                    type="number"
                    value={formData.service_per_session_discount_price}
                    onChange={(e) =>
                      handleInputChange("service_per_session_discount_price", Number.parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    step="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_session_allowed_limit">Session Limit</Label>
                  <Input
                    id="service_session_allowed_limit"
                    type="number"
                    value={formData.service_session_allowed_limit}
                    onChange={(e) =>
                      handleInputChange("service_session_allowed_limit", Number.parseInt(e.target.value) || 1)
                    }
                    min="1"
                  />
                </div>
              </div>

              {formData.service_per_session_discount_percentage > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {formData.service_per_session_discount_percentage}% OFF
                  </Badge>
                  <span className="text-sm text-gray-500">Auto-calculated discount</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Doctor & Clinics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Doctor Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Assign Doctor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctorsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading doctors...</span>
                  </div>
                ) : (
                  <Select
                    value={formData.service_doctor}
                    onValueChange={(value) => handleInputChange("service_doctor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors?.map((doctor) => (
                        <SelectItem key={doctor._id} value={doctor._id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={doctor.doctor_images?.[0] || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {doctor.doctor_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {doctor.doctor_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Selected Doctor Preview */}
                {formData.service_doctor && doctors && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {(() => {
                      const selectedDoctor = doctors.find((doc) => doc._id === formData.service_doctor)
                      return selectedDoctor ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={selectedDoctor.doctor_images?.[0] || "/placeholder.svg"} />
                            <AvatarFallback>
                              {selectedDoctor.doctor_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedDoctor.doctor_name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{selectedDoctor.doctor_ratings}</span>
                            </div>
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Clinic Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Available Clinics</CardTitle>
              </CardHeader>
              <CardContent>
                {clinicsLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading clinics...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clinics?.map((clinic) => (
                      <div key={clinic._id} className="flex items-start space-x-3">
                        <Checkbox
                          id={clinic._id}
                          checked={formData.service_available_at_clinics.includes(clinic._id)}
                          onCheckedChange={() => handleClinicToggle(clinic._id)}
                        />
                        <div className="flex-1">
                          <label htmlFor={clinic._id} className="font-medium cursor-pointer">
                            {clinic.clinic_name}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {clinic.clinic_stauts}
                            </Badge>
                            {clinic.clinic_ratings && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs text-gray-600">{clinic.clinic_ratings}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Service Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Click to upload images (max 5)</p>
                </label>
              </div>

              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={typeof image.url === "string" ? image.url : image.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading} size="lg" className="px-8">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEdit ? "Update Treatment" : "Create Treatment"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddNewTreatMents
