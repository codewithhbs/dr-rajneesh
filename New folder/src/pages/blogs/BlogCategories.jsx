import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
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

// Turn a title into a URL-friendly slug.
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const EMPTY = { name: "", slug: "", description: "", status: "active" };

export default function BlogCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/all-categories");
      setCategories(data.data || []);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      slug: c.slug || "",
      description: c.description || "",
      status: c.status || "active",
    });
    setFormOpen(true);
  };

  // Editing the name auto-fills the slug (until the user edits slug manually).
  const handleName = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: slugify(name) }));
  };
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/update-category/${editing._id}`, form);
        toast.success("Category updated");
      } else {
        await api.post("/create-category", form);
        toast.success("Category created");
      }
      setFormOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/delete-category/${toDelete._id}`);
      toast.success("Category deleted");
      setCategories((prev) => prev.filter((c) => c._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Blog Categories"
        subtitle={`${categories.length} categories`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No categories yet"
            action={<Button onClick={openCreate}>Add Category</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Slug</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {categories.map((c) => (
                <TR key={c._id}>
                  <TD className="font-medium text-gray-900">{c.name}</TD>
                  <TD className="text-gray-500">{c.slug || "—"}</TD>
                  <TD>
                    <Badge tone={toneForStatus(c.status)}>{c.status || "active"}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(c)}>
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
        title={editing ? "Edit Category" : "Add Category"}
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
          <Input label="Name" value={form.name} onChange={handleName} />
          <Input label="Slug" value={form.slug} onChange={setField("slug")} />
          <Textarea label="Description" value={form.description} onChange={setField("description")} />
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
        title="Delete category?"
        message={`This will permanently remove "${toDelete?.name || "this category"}".`}
      />
    </div>
  );
}
