import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, X, Building2, Star, MapPin, Clock, Calendar } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge, { toneForStatus } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";

const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ---------------------------------------------------------------------------
// The API returns clinic data in a NESTED shape:
//   clinic_contact_details: { email, phone_numbers[], clinic_address }
//   clinic_timings:         { open_time, close_time, off_day }
//   BookingAvailabeAt:      { start_date, end_date }
//   clinic_images:          [{ url, public_id }]
// These accessors read the nested values (with a flat fallback) so the rest of
// the component stays clean.
// ---------------------------------------------------------------------------
const getEmail = (c) => c.clinic_contact_details?.email ?? c.email ?? "";
const getPhones = (c) => c.clinic_contact_details?.phone_numbers ?? c.phone_numbers ?? [];
const getAddress = (c) => c.clinic_contact_details?.clinic_address ?? c.clinic_address ?? "";
const getOpen = (c) => c.clinic_timings?.open_time ?? c.open_time ?? "";
const getClose = (c) => c.clinic_timings?.close_time ?? c.close_time ?? "";
const getOffDay = (c) => c.clinic_timings?.off_day ?? c.off_day ?? "";
const getStart = (c) => c.BookingAvailabeAt?.start_date ?? c.start_date ?? "";
const getEnd = (c) => c.BookingAvailabeAt?.end_date ?? c.end_date ?? "";
const getImages = (c) => c.clinic_images ?? c.images ?? [];

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const EMPTY = {
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
  clinic_stauts: "Published", // matches backend field spelling
  clinic_ratings: "",
  any_special_note: "",
};

export default function Clinics() {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [viewClinic, setViewClinic] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/get-all-clinic");
      setClinics(data.data?.clinics || data.data || []);
    } catch {
      toast.error("Failed to load clinics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImages([]);
    setFormOpen(true);
  };

  // Flatten a nested clinic record into the form shape for editing.
  const openEdit = (c) => {
    setEditing(c);
    const phones = getPhones(c);
    setForm({
      clinic_name: c.clinic_name || "",
      email: getEmail(c),
      phone_numbers: phones.length ? phones : [""],
      clinic_address: getAddress(c),
      open_time: getOpen(c),
      close_time: getClose(c),
      off_day: getOffDay(c) || "Sunday",
      start_date: getStart(c) ? String(getStart(c)).slice(0, 10) : "",
      end_date: getEnd(c) ? String(getEnd(c)).slice(0, 10) : "",
      clinic_map: c.clinic_map || "",
      clinic_stauts: c.clinic_stauts || "Published",
      clinic_ratings: c.clinic_ratings ?? "",
      any_special_note: c.any_special_note || "",
    });
    setImages([]);
    setFormOpen(true);
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Phone numbers are a dynamic list.
  const setPhone = (i, val) =>
    setForm((f) => {
      const phones = [...f.phone_numbers];
      phones[i] = val;
      return { ...f, phone_numbers: phones };
    });
  const addPhone = () => setForm((f) => ({ ...f, phone_numbers: [...f.phone_numbers, ""] }));
  const removePhone = (i) =>
    setForm((f) => ({ ...f, phone_numbers: f.phone_numbers.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.clinic_name.trim()) {
      toast.error("Clinic name is required");
      return;
    }
    setSaving(true);

    // Backend accepts flat keys on create/update and nests them server-side.
    const fd = new FormData();
    fd.append("clinic_name", form.clinic_name);
    fd.append("email", form.email);
    fd.append("phone_numbers", JSON.stringify(form.phone_numbers.filter(Boolean)));
    fd.append("clinic_address", form.clinic_address);
    fd.append("open_time", form.open_time);
    fd.append("close_time", form.close_time);
    fd.append("off_day", form.off_day);
    fd.append("start_date", form.start_date);
    fd.append("end_date", form.end_date);
    fd.append("clinic_map", form.clinic_map);
    fd.append("clinic_stauts", form.clinic_stauts);
    if (form.clinic_ratings !== "") fd.append("clinic_ratings", form.clinic_ratings);
    fd.append("any_special_note", form.any_special_note);
    images.forEach((file) => fd.append("images", file));

    try {
      if (editing) {
        await api.put(`/update-clinic/${editing._id}`, fd);
        toast.success("Clinic updated");
      } else {
        await api.post("/create-clinic", fd);
        toast.success("Clinic created");
      }
      setFormOpen(false);
      fetchClinics();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save clinic");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/delete-clinic/${toDelete._id}`);
      toast.success("Clinic deleted");
      setClinics((prev) => prev.filter((c) => c._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete clinic");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clinics"
        subtitle={`${clinics.length} clinics`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Clinic
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : clinics.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No clinics yet"
            action={<Button onClick={openCreate}>Add Clinic</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Clinic</TH>
                <TH>Contact</TH>
                <TH>Hours</TH>
                <TH>Off Day</TH>
                <TH>Rating</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {clinics.map((c) => {
                const img = getImages(c)[0]?.url;
                return (
                  <TR key={c._id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-50 text-brand-700">
                          {img ? (
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{c.clinic_name}</p>
                          <p className="max-w-xs truncate text-xs text-gray-500">{getAddress(c)}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <p>{getEmail(c) || "—"}</p>
                      <p className="text-xs text-gray-500">{getPhones(c).join(", ") || "—"}</p>
                    </TD>
                    <TD className="whitespace-nowrap">
                      {getOpen(c) && getClose(c) ? `${getOpen(c)} - ${getClose(c)}` : "—"}
                    </TD>
                    <TD>{getOffDay(c) || "—"}</TD>
                    <TD>
                      {c.clinic_ratings ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {c.clinic_ratings}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TD>
                    <TD>
                      <Badge tone={toneForStatus(c.clinic_stauts)}>{c.clinic_stauts || "—"}</Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewClinic(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setToDelete(c)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ----- View (complete details) modal ----- */}
      <Modal open={!!viewClinic} onClose={() => setViewClinic(null)} title="Clinic Details" size="lg">
        {viewClinic && (
          <div className="space-y-5">
            {/* Images */}
            {getImages(viewClinic).length > 0 && (
              <div className="flex gap-3 overflow-x-auto">
                {getImages(viewClinic).map((im, i) => (
                  <img
                    key={i}
                    src={im.url}
                    alt=""
                    className="h-32 w-44 flex-shrink-0 rounded-lg border border-gray-200 object-cover"
                  />
                ))}
              </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewClinic.clinic_name}</h3>
                {viewClinic.clinic_ratings && (
                  <span className="mt-1 inline-flex items-center gap-1 text-sm text-amber-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {viewClinic.clinic_ratings} rating
                  </span>
                )}
              </div>
              <Badge tone={toneForStatus(viewClinic.clinic_stauts)}>
                {viewClinic.clinic_stauts || "—"}
              </Badge>
            </div>

            {/* Contact */}
            <Section title="Contact" icon={MapPin}>
              <DetailRow label="Email" value={getEmail(viewClinic)} />
              <DetailRow label="Phone(s)" value={getPhones(viewClinic).join(", ")} />
              <DetailRow label="Address" value={getAddress(viewClinic)} />
              {viewClinic.clinic_map && (
                <DetailRow
                  label="Map"
                  value={
                    <a
                      href={viewClinic.clinic_map}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      Open map link
                    </a>
                  }
                />
              )}
            </Section>

            {/* Timings */}
            <Section title="Timings" icon={Clock}>
              <DetailRow
                label="Open Hours"
                value={
                  getOpen(viewClinic) && getClose(viewClinic)
                    ? `${getOpen(viewClinic)} - ${getClose(viewClinic)}`
                    : "—"
                }
              />
              <DetailRow label="Off Day" value={getOffDay(viewClinic)} />
            </Section>

            {/* Booking availability */}
            <Section title="Booking Availability" icon={Calendar}>
              <DetailRow label="Start Date" value={fmtDate(getStart(viewClinic))} />
              <DetailRow label="End Date" value={fmtDate(getEnd(viewClinic))} />
            </Section>

            {viewClinic.any_special_note && (
              <Section title="Special Note">
                <p className="text-sm text-gray-700">{viewClinic.any_special_note}</p>
              </Section>
            )}

            <p className="text-xs text-gray-400">
              Created {fmtDate(viewClinic.createdAt)} · Updated {fmtDate(viewClinic.updatedAt)}
            </p>
          </div>
        )}
      </Modal>

      {/* ----- Create / edit modal ----- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Clinic" : "Add Clinic"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Clinic Name" value={form.clinic_name} onChange={setField("clinic_name")} />
            <Input label="Email" type="email" value={form.email} onChange={setField("email")} />
          </div>

          {/* Dynamic phone numbers */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Phone Numbers</label>
            <div className="space-y-2">
              {form.phone_numbers.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={p}
                    onChange={(e) => setPhone(i, e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                  />
                  {form.phone_numbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhone(i)}
                      className="rounded-lg border border-gray-300 px-2 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addPhone}
              className="mt-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              + Add phone
            </button>
          </div>

          <Textarea label="Address" value={form.clinic_address} onChange={setField("clinic_address")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Open Time" type="time" value={form.open_time} onChange={setField("open_time")} />
            <Input label="Close Time" type="time" value={form.close_time} onChange={setField("close_time")} />
            <Select label="Off Day" value={form.off_day} onChange={setField("off_day")} options={WEEK_DAYS} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Start Date" type="date" value={form.start_date} onChange={setField("start_date")} />
            <Input label="End Date" type="date" value={form.end_date} onChange={setField("end_date")} />
            <Input
              label="Rating (0-5)"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.clinic_ratings}
              onChange={setField("clinic_ratings")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              value={form.clinic_stauts}
              onChange={setField("clinic_stauts")}
              options={["Published", "Draft", "Archived"]}
            />
            <Input
              label="Google Maps Link"
              placeholder="Enter Google Maps link"
              value={form.clinic_map}
              onChange={setField("clinic_map")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setImages(Array.from(e.target.files))}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
          </div>

          <Textarea
            label="Special Note"
            placeholder="Enter any special notes about the clinic"
            value={form.any_special_note}
            onChange={setField("any_special_note")}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete clinic?"
        message={`This will permanently remove "${toDelete?.clinic_name || "this clinic"}".`}
      />
    </div>
  );
}

// Small presentational helpers used inside the view modal.
function Section({ title, icon: Icon, children }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-3 py-1 text-sm">
      <span className="w-28 flex-shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value || "—"}</span>
    </div>
  );
}