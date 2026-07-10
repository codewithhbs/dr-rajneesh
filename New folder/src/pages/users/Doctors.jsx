import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import { useClinics } from "@/hooks/useLookups";
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
import CheckboxGroup from "@/components/ui/CheckboxGroup";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";

const EMPTY = {
  doctor_name: "",
  specialization: "",
  languagesSpoken: "",
  doctor_status: "Published",
  doctor_ratings: "",
  any_special_note: "",
  clinic_ids: [],
};

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 py-2 last:border-0">
      <span className="w-36 flex-shrink-0 text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value || "—"}</span>
    </div>
  );
}

export default function Doctors() {
  const clinics = useClinics();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [viewDoctor, setViewDoctor] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/get-all-doctor?page=1");
      setDoctors(data.data || data.doctors || []);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImages([]);
    setFormOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      doctor_name: d.doctor_name || "",
      specialization: d.specialization || "",
      languagesSpoken: Array.isArray(d.languagesSpoken)
        ? d.languagesSpoken.join(", ")
        : d.languagesSpoken || "",
      doctor_status: d.doctor_status || "Published",
      doctor_ratings: d.doctor_ratings || "",
      any_special_note: d.any_special_note || "",
      clinic_ids: (d.clinic_ids || d.clinics || []).map((c) => (typeof c === "object" ? c._id : c)),
    });
    setImages([]);
    setFormOpen(true);
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.doctor_name.trim()) {
      toast.error("Doctor name is required");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    fd.append("doctor_name", form.doctor_name);
    fd.append("specialization", form.specialization);
    fd.append("languagesSpoken", form.languagesSpoken);
    fd.append("doctor_status", form.doctor_status);
    fd.append("doctor_ratings", form.doctor_ratings);
    fd.append("any_special_note", form.any_special_note);
    form.clinic_ids.forEach((id) => fd.append("clinic_ids[]", id));
    images.forEach((file) => fd.append("images", file));

    try {
      if (editing) {
        await api.put(`/update-doctor/${editing._id}`, fd);
        toast.success("Doctor updated");
      } else {
        await api.post("/create-doctor", fd);
        toast.success("Doctor created");
      }
      setFormOpen(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save doctor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/delete-doctor/${toDelete._id}`);
      toast.success("Doctor deleted");
      setDoctors((prev) => prev.filter((d) => d._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete doctor");
    } finally {
      setDeleting(false);
    }
  };

  const clinicOptions = clinics.map((c) => ({ value: c._id, label: c.clinic_name }));

  return (
    <div>
      <PageHeader
        title="Doctors"
        subtitle={`${doctors.length} doctors`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Doctor
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors yet"
            action={<Button onClick={openCreate}>Add Doctor</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Doctor</TH>
                <TH>Specialization</TH>
                <TH>Languages</TH>
                <TH>Rating</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {doctors.map((d) => (
                <TR key={d._id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-50 font-semibold text-brand-700">
                        {d.images?.[0]?.url ? (
                          <img src={d.images[0].url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          d.doctor_name?.charAt(0) || "D"
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{d.doctor_name}</span>
                    </div>
                  </TD>
                  <TD>{d.specialization || "—"}</TD>
                  <TD>
                    {Array.isArray(d.languagesSpoken)
                      ? d.languagesSpoken.join(", ")
                      : d.languagesSpoken || "—"}
                  </TD>
                  <TD>{d.doctor_ratings ? `${d.doctor_ratings} ★` : "—"}</TD>
                  <TD>
                    <Badge tone={toneForStatus(d.doctor_status)}>{d.doctor_status || "—"}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewDoctor(d)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(d)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create / edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Doctor" : "Add Doctor"}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Doctor Name" value={form.doctor_name} onChange={setField("doctor_name")} />
          <Input
            label="Specialization"
            placeholder="e.g., Cardiology, Neurology"
            value={form.specialization}
            onChange={setField("specialization")}
          />
          <Input
            label="Languages (comma separated)"
            placeholder="e.g., English, Hindi"
            value={form.languagesSpoken}
            onChange={setField("languagesSpoken")}
          />
          <Input
            label="Rating (0.0 - 5.0)"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={form.doctor_ratings}
            onChange={setField("doctor_ratings")}
          />
          <Select
            label="Status"
            value={form.doctor_status}
            onChange={setField("doctor_status")}
            options={["Published", "Draft", "Archived"]}
          />
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
          <div className="sm:col-span-2">
            <CheckboxGroup
              label="Associated Clinics"
              options={clinicOptions}
              value={form.clinic_ids}
              onChange={(ids) => setForm((f) => ({ ...f, clinic_ids: ids }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Special Note"
              placeholder="Add any notes about the doctor..."
              value={form.any_special_note}
              onChange={setField("any_special_note")}
            />
          </div>
        </div>
      </Modal>

      {/* View modal */}
      <Modal open={!!viewDoctor} onClose={() => setViewDoctor(null)} title="Doctor Details" size="lg">
        {viewDoctor && (
          <div className="space-y-1 text-sm">
            {viewDoctor.images?.[0]?.url && (
              <img
                src={viewDoctor.images[0].url}
                alt=""
                className="mb-3 h-40 w-full rounded-lg object-cover"
              />
            )}
            <DetailRow label="Name" value={viewDoctor.doctor_name} />
            <DetailRow label="Specialization" value={viewDoctor.specialization} />
            <DetailRow
              label="Languages"
              value={
                Array.isArray(viewDoctor.languagesSpoken)
                  ? viewDoctor.languagesSpoken.join(", ")
                  : viewDoctor.languagesSpoken
              }
            />
            <DetailRow label="Rating" value={viewDoctor.doctor_ratings} />
            <DetailRow label="Status" value={viewDoctor.doctor_status} />
            <DetailRow label="Special Note" value={viewDoctor.any_special_note} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete doctor?"
        message={`This will permanently remove ${toDelete?.doctor_name || "this doctor"}.`}
      />
    </div>
  );
}
