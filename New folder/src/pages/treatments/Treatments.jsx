import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Pill } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge, { toneForStatus } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";

export default function Treatments() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/get-all-service");
      setServices(data.data || []);
    } catch {
      toast.error("Failed to load treatments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/delete-service/${toDelete._id}`);
      toast.success("Treatment deleted");
      setServices((prev) => prev.filter((s) => s._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete treatment");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Treatments"
        subtitle={`${services.length} treatments / services`}
        actions={
          <Button onClick={() => navigate("/dashboard/treatments/new")}>
            <Plus className="h-4 w-4" /> Add Treatment
          </Button>
        }
      />

      <Card>
        {loading ? (
          <Spinner />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="No treatments yet"
            action={<Button onClick={() => navigate("/dashboard/treatments/new")}>Add Treatment</Button>}
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Treatment</TH>
                <TH>Price</TH>
                <TH>Sessions</TH>
                <TH>Status</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {services.map((s) => (
                <TR key={s._id}>
                  <TD className="font-medium text-gray-900">{s.service_name}</TD>
                  <TD>
                    {s.service_per_session_discount_price ? (
                      <span>
                        ₹{s.service_per_session_discount_price}{" "}
                        <span className="text-xs text-gray-400 line-through">
                          ₹{s.service_per_session_price}
                        </span>
                      </span>
                    ) : (
                      `₹${s.service_per_session_price || 0}`
                    )}
                  </TD>
                  <TD>{s.service_session_allowed_limit || "—"}</TD>
                  <TD>
                    <Badge tone={toneForStatus(s.service_status)}>{s.service_status || "—"}</Badge>
                  </TD>
                  <TD className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/treatments/edit/${s._id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(s)}>
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

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete treatment?"
        message={`This will permanently remove "${toDelete?.service_name || "this treatment"}".`}
      />
    </div>
  );
}
