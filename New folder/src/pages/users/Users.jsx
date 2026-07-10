import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Users as UsersIcon, CheckCircle2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import Badge, { toneForStatus } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Table, THead, TR, TH, TD } from "@/components/ui/Table";

const VerifyIcon = ({ ok }) =>
  ok ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-gray-300" />
  );

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const fetchUsers = async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit,
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      };

      const { data } = await api.get("/admin/get-all-user", {
        params,
      });

      setUsers(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);


  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/delete-user/${toDelete._id}`);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u._id !== toDelete._id));
      setToDelete(null);
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
const totalPages = Math.ceil(total / limit);
  return (
    <div>
      <PageHeader
        title="Users"
     subtitle={`${total} users`}
      />

      <Card>
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, phone"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
            />
          </div>
          <Select
            value={statusFilter}
onChange={(e) => {
  setStatusFilter(e.target.value);
  setPage(1);
}}            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "blocked", label: "Blocked" },
            ]}
          />
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: "all", label: "All roles" },
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
              { value: "doctor", label: "Doctor" },
            ]}
          />
          <Select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            options={[
              { value: "all", label: "All verification" },
              { value: "email-verified", label: "Email verified" },
              { value: "phone-verified", label: "Phone verified" },
              { value: "fully-verified", label: "Fully verified" },
              { value: "unverified", label: "Unverified" },
            ]}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users found" description="Try different filters." />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Role</TH>
                <TH>Verified</TH>
                <TH>Status</TH>
                <TH>Joined</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <tbody>
              {users?.map((u) => (
                <TR key={u._id}>
                  <TD className="font-medium text-gray-900">{u.name || "—"}</TD>
                  <TD>{u.email || "—"}</TD>
                  <TD>{u.phone || "—"}</TD>
                  <TD>
                    <Badge tone="blue">{u.role || "user"}</Badge>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <VerifyIcon ok={u.emailVerification?.isVerified} /> Email
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <VerifyIcon ok={u.phoneNumber?.isVerified} /> Phone
                      </span>
                    </div>
                  </TD>
                  <TD>
                    <Badge tone={toneForStatus(u.status)}>{u.status || "—"}</Badge>
                  </TD>
                  <TD>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(u)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
<div className="flex items-center justify-between border-t px-4 py-3">
  <p className="text-sm text-gray-500">
    Showing page {page} of {totalPages}
  </p>

  <div className="flex gap-2">
    <Button
      variant="ghost"
      size="sm"
      disabled={page <= 1}
      onClick={() => setPage((p) => p - 1)}
    >
      Previous
    </Button>

    <Button
      variant="ghost"
      size="sm"
      disabled={page >= totalPages}
      onClick={() => setPage((p) => p + 1)}
    >
      Next
    </Button>
  </div>
</div>
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete user?"
        message={`This will permanently remove ${toDelete?.name || "this user"}.`}
      />
    </div>
  );
}
