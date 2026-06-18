import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Megaphone, Eye } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";

export default function Popups() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedPopup, setSelectedPopup] = useState(null);
  const navigate = useNavigate();

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/popup");
      setPopups(data.data || []);
    } catch {
      toast.error("Failed to load popups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/popup/${toDelete._id}`);
      toast.success("Popup deleted");
      setPopups((prev) => prev.filter((p) => p._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete popup");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Popups"
        subtitle={`${popups.length} popups`}
        actions={
          <Button onClick={() => navigate("/dashboard/new-popup")}>
            <Plus className="h-4 w-4" /> New Popup
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : popups.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No popups yet"
            action={<Button onClick={() => navigate("/dashboard/new-popup")}>New Popup</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Title</TH>
                <TH>Priority</TH>
                <TH>Active</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {popups.map((p) => (
                <TR key={p._id}>
                  <TD className="font-medium text-gray-900">{p.title}</TD>
                  <TD>{p.priority ?? "—"}</TD>
                  <TD>
                    <Badge tone={p.isActive ? "green" : "gray"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPopup(p)}
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setToDelete(p)}
                      >
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
      {selectedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-semibold">
                Popup Preview
              </h3>

              <button
                onClick={() => setSelectedPopup(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div className="p-5">
              {selectedPopup.image && (
                <img
                  src={selectedPopup.image}
                  alt={selectedPopup.title}
                  className="mb-4 h-64 w-full rounded-xl object-cover"
                />
              )}

              <div className="space-y-3">
                <h2 className="text-2xl font-bold">
                  {selectedPopup.title}
                </h2>

                <p className="text-sm text-gray-600">
                  {selectedPopup.description}
                </p>

                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Doctor</p>
                    <p className="font-medium">
                      {selectedPopup.doctorName || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium">
                      {selectedPopup.location || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Available Date</p>
                    <p className="font-medium">
                      {selectedPopup.availableDate
                        ? new Date(
                          selectedPopup.availableDate
                        ).toLocaleDateString("en-IN")
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium">
                      {selectedPopup.availableTime || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Priority</p>
                    <p className="font-medium">
                      {selectedPopup.priority}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge tone={selectedPopup.isActive ? "green" : "gray"}>
                      {selectedPopup.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {selectedPopup.button?.text && (
                  <div className="pt-4">
                    <a
                      href={selectedPopup.button.link}
                      target={
                        selectedPopup.button.openInNewTab
                          ? "_blank"
                          : "_self"
                      }
                      rel="noreferrer"
                      className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-white"
                    >
                      {selectedPopup.button.text}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete popup?"
        message={`This will permanently remove "${toDelete?.title || "this popup"}".`}
      />
    </div>
  );
}
