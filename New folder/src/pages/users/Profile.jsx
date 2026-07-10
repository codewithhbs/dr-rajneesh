import { useState } from "react";
import { User, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import { useAuth } from "@/context/authContext";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function Profile() {
  const { user } = useAuth();

  const [pwd, setPwd] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const setField = (key) => (e) => setPwd((p) => ({ ...p, [key]: e.target.value }));

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/change-password", {
        oldPassword: pwd.oldPassword,
        newPassword: pwd.newPassword,
      });
      toast.success("Password changed");
      setPwd({ oldPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your account details and security." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{user?.name || "Admin"}</h2>
            <p className="text-sm text-gray-500">{user?.email || "admin@clinic.com"}</p>
            {user?.role && (
              <span className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {user.role}
              </span>
            )}
          </div>
        </Card>

        {/* Change password */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-gray-400" />
            <h3 className="text-base font-semibold text-gray-900">Change Password</h3>
          </div>
          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={pwd.oldPassword}
              onChange={setField("oldPassword")}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={pwd.newPassword}
              onChange={setField("newPassword")}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={pwd.confirm}
              onChange={setField("confirm")}
              required
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
