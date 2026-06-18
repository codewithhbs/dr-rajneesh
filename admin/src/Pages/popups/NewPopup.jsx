import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

const EMPTY = {
  title: "",
  description: "",
  doctorName: "",
  location: "",
  availableDate: "",
  availableTime: "",
  startAt: "",
  endAt: "",
  priority: 1,
  isActive: true,
  buttonText: "",
  buttonLink: "",
  openInNewTab: false,
};

export default function NewPopup() {
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const setField = (key) => (e) => {
    const { type, value, checked } = e.target;
    setForm((f) => ({ ...f, [key]: type === "checkbox" ? checked : value }));
  };

  const onImage = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);

    try {
      await api.post("/popup", fd);
      toast.success("Popup created");
      navigate("/dashboard/all-popup");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create popup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-3">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <PageHeader title="New Popup" />

      <form onSubmit={handleSubmit}>
        <Card className="space-y-5 p-6">
          <Input label="Title" value={form.title} onChange={setField("title")} />
          <Textarea label="Description" value={form.description} onChange={setField("description")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Doctor Name" value={form.doctorName} onChange={setField("doctorName")} />
            <Input label="Location" value={form.location} onChange={setField("location")} />
            <Input
              label="Available Date"
              type="date"
              value={form.availableDate}
              onChange={setField("availableDate")}
            />
            <Input label="Available Time" value={form.availableTime} onChange={setField("availableTime")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Start At"
              type="datetime-local"
              value={form.startAt}
              onChange={setField("startAt")}
            />
            <Input
              label="End At"
              type="datetime-local"
              value={form.endAt}
              onChange={setField("endAt")}
            />
            <Input label="Button Text" value={form.buttonText} onChange={setField("buttonText")} />
            <Input label="Button Link" value={form.buttonLink} onChange={setField("buttonLink")} />
            <Input
              label="Priority"
              type="number"
              value={form.priority}
              onChange={setField("priority")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={onImage}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
            {preview && (
              <img src={preview} alt="preview" className="mt-2 h-32 rounded-lg border object-cover" />
            )}
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={setField("isActive")}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.openInNewTab}
                onChange={setField("openInNewTab")}
                className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              Open link in new tab
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-5">
            <Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Popup"}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
