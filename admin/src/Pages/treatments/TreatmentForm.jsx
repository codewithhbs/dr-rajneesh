import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, X, ImageOff } from "lucide-react";
import toast from "react-hot-toast";
import JoditEditor from "jodit-react";

import api from "@/lib/axios";
import { useDoctors, useClinics } from "@/hooks/useLookups";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import CheckboxGroup from "@/components/ui/CheckboxGroup";
import { serviceStatusOptions } from "@/constants/config";

const EMPTY = {
  service_name: "",
  service_small_desc: "",
  service_desc: "",
  service_status: "Draft",
  appointment_status: "Hide",
  service_session_allowed_limit: 3,
  service_per_session_price: 0,
  service_per_session_discount_price: 0,
  service_per_session_discount_percentage: 0,
  service_tag: "",
  service_doctor: "",
  service_available_at_clinics: [],
  position: 0,
};

const joditConfig = {
  readonly: false,
  height: 320,
  toolbarAdaptive: false,
  buttons: [
    "bold", "italic", "underline", "strikethrough", "|",
    "ul", "ol", "|",
    "outdent", "indent", "|",
    "font", "fontsize", "paragraph", "|",
    "link", "table", "|",
    "align", "undo", "redo", "|",
    "hr", "eraser", "source",
  ],
};

export default function TreatmentForm() {
  const { id } = useParams(); // present => edit mode
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const editorRef = useRef(null);

  const doctors = useDoctors();
  const clinics = useClinics();

  const [form, setForm] = useState(EMPTY);
  const [existingImages, setExistingImages] = useState([]); // [{ url, public_id, _id }]
  const [removedPublicIds, setRemovedPublicIds] = useState([]);
  const [newImages, setNewImages] = useState([]); // File[]
  const [newImagePreviews, setNewImagePreviews] = useState([]); // string[]
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/get-service/${id}`);
        const s = data.data || data;
        setForm({
          ...EMPTY,
          ...s,
          service_doctor:
            typeof s.service_doctor === "object" ? s.service_doctor?._id : s.service_doctor || "",
          service_available_at_clinics: (s.service_available_at_clinics || []).map((c) =>
            typeof c === "object" ? c._id : c
          ),
        });
        setExistingImages(s.service_images || []);
      } catch {
        toast.error("Failed to load treatment");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  // Build/cleanup object URLs for newly selected (not-yet-uploaded) images
  useEffect(() => {
    const urls = newImages.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newImages]);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

const handleNewImagesChange = (e) => {
  const files = Array.from(e.target.files);

  console.log("Selected Files:", files);

  setNewImages((prev) => [...prev, ...files]);

  e.target.value = "";
};
  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExisting = (publicId) => {
    setRemovedPublicIds((prev) =>
      prev.includes(publicId) ? prev.filter((p) => p !== publicId) : [...prev, publicId]
    );
  };

  const visibleExistingImages = useMemo(
    () => existingImages.filter((img) => !removedPublicIds.includes(img.public_id)),
    [existingImages, removedPublicIds]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_name.trim()) {
      toast.error("Treatment name is required");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    const skip = [
      "_id",
      "service_images",
      "service_available_at_clinics",
      "service_doctor",
      "service_reviews",
      "service_slug",
      "__v",
      "createdAt",
      "updatedAt",
    ];
    Object.entries(form).forEach(([k, v]) => {
      if (skip.includes(k)) return;
      fd.append(k, v ?? "");
    });
    fd.append("service_doctor", form.service_doctor || "");

    form.service_available_at_clinics.forEach((cid) =>
      fd.append("service_available_at_clinics[]", cid)
    );

    removedPublicIds.forEach((pid) => fd.append("remove_images", pid));
    newImages.forEach((file) => fd.append("images", file));

    try {
      if (isEdit) {
        await api.put(`/update-service/${id}`, fd);
        toast.success("Treatment updated");
      } else {
        await api.post("/create-service", fd);
        toast.success("Treatment created");
      }
      navigate("/dashboard/treatments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save treatment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading treatment..." />;

  const doctorOptions = doctors.map((d) => ({ value: d._id, label: d.doctor_name }));
  const clinicOptions = clinics.map((c) => ({ value: c._id, label: c.clinic_name }));

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader title={isEdit ? "Edit Treatment" : "Add Treatment"} />

      <form onSubmit={handleSubmit}>
        <Card className="space-y-6 p-6">
          {/* Basic info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Treatment Name" value={form.service_name} onChange={setField("service_name")} />
            <Input label="Tag" value={form.service_tag} onChange={setField("service_tag")} />
          </div>

          <Input
            label="Short Description"
            value={form.service_small_desc}
            onChange={setField("service_small_desc")}
          />

          {/* Rich text editor for full description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Full Description</label>
            <JoditEditor
              ref={editorRef}
              value={form.service_desc}
              config={joditConfig}
              onBlur={(newContent) => setForm((f) => ({ ...f, service_desc: newContent }))}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Price (₹)"
              type="number"
              value={form.service_per_session_price}
              onChange={setField("service_per_session_price")}
            />
            <Input
              label="Discount Price (₹)"
              type="number"
              value={form.service_per_session_discount_price}
              onChange={setField("service_per_session_discount_price")}
            />
            <Input
              label="Discount %"
              type="number"
              value={form.service_per_session_discount_percentage}
              onChange={setField("service_per_session_discount_percentage")}
            />
          </div>

          {/* Session config */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Sessions Allowed"
              type="number"
              value={form.service_session_allowed_limit}
              onChange={setField("service_session_allowed_limit")}
            />
            <Input
              label="Position (sort order)"
              type="number"
              value={form.position}
              onChange={setField("position")}
            />
            <Select
              label="Assigned Doctor"
              value={form.service_doctor}
              onChange={setField("service_doctor")}
              placeholder="Select doctor"
              options={doctorOptions}
            />
          </div>

          {/* Visibility */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              value={form.service_status}
              onChange={setField("service_status")}
              options={serviceStatusOptions}
            />
            <Select
              label="Appointment Visibility"
              value={form.appointment_status}
              onChange={setField("appointment_status")}
              options={["Show", "Hide"]}
            />
          </div>

          <CheckboxGroup
            label="Available at Clinics"
            options={clinicOptions}
            value={form.service_available_at_clinics}
            onChange={(ids) => setForm((f) => ({ ...f, service_available_at_clinics: ids }))}
          />

          {/* Existing images */}
          {isEdit && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Images {existingImages.length > 0 && `(${visibleExistingImages.length}/${existingImages.length})`}
              </label>

              {existingImages.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-400">
                  <ImageOff className="h-4 w-4" /> No images uploaded yet
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {existingImages.map((img) => {
                    const isRemoved = removedPublicIds.includes(img.public_id);
                    return (
                      <div
                        key={img._id || img.public_id}
                        className={`group relative overflow-hidden rounded-lg border ${
                          isRemoved ? "border-red-300 opacity-50" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt="Treatment"
                          className="h-32 w-full object-cover"
                        />
                        {isRemoved && (
                          <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
                              Marked for removal
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleRemoveExisting(img.public_id)}
                          className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm transition ${
                            isRemoved ? "bg-gray-500 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
                          }`}
                          title={isRemoved ? "Undo removal" : "Remove image"}
                        >
                          {isRemoved ? "↺" : <X className="h-4 w-4" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {removedPublicIds.length > 0 && (
                <p className="text-xs text-red-500">
                  {removedPublicIds.length} image{removedPublicIds.length > 1 ? "s" : ""} will be removed on save.
                </p>
              )}
            </div>
          )}

          {/* New image uploads */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {isEdit ? "Add New Images" : "Images"}
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleNewImagesChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />

            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {newImagePreviews.map((src, i) => (
                  <div key={src} className="group relative overflow-hidden rounded-lg border border-brand-200">
                    <img src={src} alt={`New upload ${i + 1}`} className="h-32 w-full object-cover" />
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-medium text-white">
                      New
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-700/80 text-white shadow-sm hover:bg-gray-800"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-5">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Treatment" : "Create Treatment"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}