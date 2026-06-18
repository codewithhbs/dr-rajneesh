import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Newspaper } from "lucide-react";
import JoditEditor from "jodit-react";
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

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

const EMPTY = {
  title: "",
  slug: "",
  content: "",
  category: "",
  status: "draft",
  featured: false,
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
};

export default function Blogs() {
  const editorRef = useRef(null);

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Jodit config (kept minimal but full-featured).
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      height: 420,
      placeholder: "Start writing your blog content...",
      toolbarSticky: false,
      showCharsCounter: true,
      showWordsCounter: true,
      buttons:
        "bold,italic,underline,strikethrough,|,ul,ol,|,h1,h2,h3,paragraph,|,link,image,table,|,align,|,undo,redo,eraser,source",
    }),
    []
  );

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/get-all-blogs");
      setBlogs(data.data || []);
    } catch {
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/all-categories");
      setCategories(data.data || []);
    } catch {
      // optional
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImage(null);
    setFormOpen(true);
  };

  const openEdit = async (blog) => {
    setEditing(blog);
    setImage(null);
    try {
      const { data } = await api.get(`/get-blog/${blog._id}`);
      const b = data.data || blog;
      setForm({
        title: b.title || "",
        slug: b.slug || "",
        content: b.content || "",
        category: b.category?._id || b.category || "",
        status: b.status || "draft",
        featured: !!b.featured,
        metaTitle: b.metaTitle || "",
        metaDescription: b.metaDescription || "",
        metaKeywords: b.metaKeywords || "",
      });
    } catch {
      setForm({ ...EMPTY, ...blog });
    }
    setFormOpen(true);
  };

  const handleTitle = (e) => {
    const title = e.target.value;
    setForm((f) => ({ ...f, title, slug: slugify(title) }));
  };
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (image) fd.append("image", image);

    try {
      if (editing) {
        await api.put(`/update-blog/${editing._id}`, fd);
        toast.success("Blog updated");
      } else {
        await api.post("/create-blog", fd);
        toast.success("Blog created");
      }
      setFormOpen(false);
      fetchBlogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/delete-blog/${toDelete._id}`);
      toast.success("Blog deleted");
      setBlogs((prev) => prev.filter((b) => b._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(false);
    }
  };

  const categoryOptions = categories.map((c) => ({ value: c._id, label: c.name }));

  return (
    <div>
      <PageHeader
        title="Blogs"
        subtitle={`${blogs.length} posts`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Blog
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : blogs.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No blogs yet"
            action={<Button onClick={openCreate}>New Blog</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Category</TH>
                <TH>Status</TH>
                <TH>Featured</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {blogs.map((b) => (
                <TR key={b._id}>
                  <TD className="max-w-xs truncate font-medium text-gray-900">{b.title}</TD>
                  <TD>{b.category?.name || "—"}</TD>
                  <TD>
                    <Badge tone={toneForStatus(b.status)}>{b.status || "draft"}</Badge>
                  </TD>
                  <TD>{b.featured ? "Yes" : "No"}</TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(b)}>
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
        title={editing ? "Edit Blog" : "New Blog"}
        size="xl"
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
            <Input label="Title" value={form.title} onChange={handleTitle} />
            <Input label="Slug" value={form.slug} onChange={setField("slug")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={form.category}
              onChange={setField("category")}
              placeholder="Select category"
              options={categoryOptions}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={setField("status")}
              options={["draft", "published"]}
            />
          </div>

          {/* Rich text editor */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <JoditEditor
              ref={editorRef}
              value={form.content}
              config={editorConfig}
              onBlur={(newContent) => setForm((f) => ({ ...f, content: newContent }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Featured post
          </label>

          <div className="border-t border-gray-200 pt-4">
            <p className="mb-3 text-sm font-medium text-gray-700">SEO</p>
            <div className="space-y-4">
              <Input label="Meta Title" value={form.metaTitle} onChange={setField("metaTitle")} />
              <div>
                <Textarea
                  label="Meta Description"
                  rows={2}
                  value={form.metaDescription}
                  onChange={setField("metaDescription")}
                />
                <p className="mt-1 text-xs text-gray-400">
                  {form.metaDescription.length}/160 characters
                </p>
              </div>
              <Input
                label="Meta Keywords (comma separated)"
                value={form.metaKeywords}
                onChange={setField("metaKeywords")}
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete blog?"
        message={`This will permanently remove "${toDelete?.title || "this blog"}".`}
      />
    </div>
  );
}
