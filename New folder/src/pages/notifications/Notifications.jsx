import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Bell } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge, { toneForStatus } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";

const EMPTY = { messages: "", position: "", expiredThis: "", status: "active" };

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/get-notifications");
      setItems(data.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    setForm({
      messages: n.messages || "",
      position: n.position || "",
      expiredThis: n.expiredThis ? new Date(n.expiredThis).toISOString().slice(0, 16) : "",
      status: n.status || "active",
    });
    setFormOpen(true);
  };

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.messages.trim()) {
      toast.error("Message is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/update-notification/${editing._id}`, form);
        toast.success("Notification updated");
      } else {
        await api.post("/add-notification", form);
        toast.success("Notification created");
      }
      setFormOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save notification");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/delete-notification/${toDelete._id}`);
      toast.success("Notification deleted");
      setItems((prev) => prev.filter((n) => n._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete notification");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${items.length} notifications`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Notification
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            action={<Button onClick={openCreate}>New Notification</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Message</TH>
                <TH>Position</TH>
                <TH>Expires</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {items.map((n) => (
                <TR key={n._id}>
                  <TD className="max-w-md truncate font-medium text-gray-900">{n.messages}</TD>
                  <TD>{n.position || "—"}</TD>
                  <TD>{n.expiredThis ? new Date(n.expiredThis).toLocaleDateString("en-IN") : "—"}</TD>
                  <TD>
                    <Badge tone={toneForStatus(n.status)}>{n.status || "active"}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(n)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(n)}>
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Notification" : "New Notification"}
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
          <Textarea label="Message" value={form.messages} onChange={setField("messages")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Position" value={form.position} onChange={setField("position")} />
            <Input
              label="Expires At"
              type="datetime-local"
              value={form.expiredThis}
              onChange={setField("expiredThis")}
            />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={setField("status")}
            options={["active", "inactive"]}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete notification?"
      />
    </div>
  );
}
