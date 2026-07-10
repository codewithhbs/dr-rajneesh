import useAdminProfile from "@/hooks/admin";
import axiosInstance from "@/lib/axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  LogOut,
  Edit,
  Lock,
  Save,
  X,
  Eye,
  EyeOff,
  Settings,
  CheckCircle,
  XCircle,
  Globe,
  Smartphone,
  Clock,
} from "lucide-react";

const AdminProfile = () => {
  const { profile, loading, error, refetch } = useAdminProfile();
  const navigate = useNavigate();

  // State for profile update
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // State for password change
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initialize profile data when profile loads
  React.useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleLogout = async () => {
    try {
      console.log("🚪 Logging out admin...");
      const response = await axiosInstance.get("/admin/logout");
      console.log("✅ Logout successful:", response.data);

      toast.success("Logged out successfully!");

      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminToken");

      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("❌ Logout failed:", error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true);
      console.log("📝 Updating admin profile...", profileData);

      const response = await axiosInstance.put(
        "/admin/update-profile",
        profileData
      );
      console.log("✅ Profile updated successfully:", response.data);

      toast.success("Profile updated successfully!");
      setIsEditingProfile(false);
      refetch(); // Refresh profile data
    } catch (error) {
      console.error("❌ Profile update failed:", error);
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long!");
      return;
    }

    try {
      setPasswordLoading(true);
      console.log("🔐 Changing admin password...");

      const response = await axiosInstance.put("/admin/change-password", {
        currentPassword: passwordData.currentPassword,
        confirmNewPassword: passwordData.confirmPassword,
        newPassword: passwordData.newPassword,
      });

      console.log("✅ Password changed successfully:", response.data);
      toast.success("Password changed successfully! Login with new password");

      // Reset form and close dialog
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordDialogOpen(false);
      handleLogout();
    } catch (error) {
      console.error("❌ Password change failed:", error);
      toast.error(error.response?.data?.message || "Password change failed");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle input changes
  const handleProfileInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordInputChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Error loading profile: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white px-6 py-5 rounded shadow-md border">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Settings className="mr-3 h-8 w-8 text-white" />
            Admin Profile
          </h1>
          <p className="text-white/90 mt-1 text-sm">
            Manage your account settings and preferences
          </p>
        </div>

        <Button
          onClick={handleLogout}
          className="bg-[#EF4444] text-white hover:bg-[#DC2626] transition-all px-4 py-2 rounded-md flex items-center shadow-sm"
        >
          <LogOut className="mr-2 h-4 w-4 text-white" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-white shadow-lg border border-gray-100 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="text-center">
            <div className="relative w-fit mx-auto">
              <div className="absolute inset-0 bg-blue-100 blur-lg opacity-30 rounded" />
              <Avatar className="w-24 h-24 mx-auto mb-4 ring-4 ring-white shadow-sm relative z-10">
                <AvatarImage
                  src={profile?.profileImage?.url}
                  alt={profile?.name}
                />
                <AvatarFallback className="text-2xl bg-blue-50 text-blue-600">
                  {profile?.name?.charAt(0)?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
            </div>

            <CardTitle className="text-xl font-semibold text-slate-800">
              {profile?.name || "Admin User"}
            </CardTitle>

            <CardDescription className="flex items-center justify-center text-slate-500 mt-1">
              <Mail className="w-4 h-4 mr-2 text-[#155DFC]" />
              {profile?.email}
            </CardDescription>

            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge className="bg-[#155DFC] text-white font-medium">
                <Shield className="w-3 h-3 mr-1" />
                {profile?.role?.toUpperCase() || "ADMIN"}
              </Badge>
              <Badge
                className={`font-medium ${
                  profile?.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {profile?.status?.toUpperCase() || "ACTIVE"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <Separator className="my-5" />

            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-3 text-[#0092B8]" />
                <span>{profile?.phone || "Not provided"}</span>
                {profile?.phoneNumber?.isVerified ? (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 ml-2 text-red-500" />
                )}
              </div>

              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-[#0092B8]" />
                <span>Email Verified</span>
                {profile?.emailVerification?.isVerified ? (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 ml-2 text-red-500" />
                )}
              </div>

              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-3 text-[#0092B8]" />
                <span>
                  Joined {new Date(profile?.createdAt).toLocaleDateString()}
                </span>
              </div>

              {profile?.lastLoginAt && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-3 text-[#0092B8]" />
                  <span>
                    Last login{" "}
                    {new Date(profile.lastLoginAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">
                Authentication Methods
              </h4>
              <div className="flex flex-wrap gap-2">
                {profile?.isGoogleAuth && (
                  <Badge className="bg-gray-50 border border-gray-200 text-slate-700 hover:bg-gray-100 transition-all">
                    <Globe className="w-3 h-3 mr-1 text-[#155DFC]" />
                    Google
                  </Badge>
                )}
                {profile?.isPhoneAuth && (
                  <Badge className="bg-gray-50 border border-gray-200 text-slate-700 hover:bg-gray-100 transition-all">
                    <Smartphone className="w-3 h-3 mr-1 text-[#155DFC]" />
                    Phone
                  </Badge>
                )}
                {!profile?.isGoogleAuth && !profile?.isPhoneAuth && (
                  <Badge className="bg-gray-50 border border-gray-200 text-slate-700 hover:bg-gray-100 transition-all">
                    <Mail className="w-3 h-3 mr-1 text-[#155DFC]" />
                    Email
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details & Actions */}
        <Card className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <CardHeader className="border-b border-gray-100 pb-6 bg-gradient-to-r from-[#155DFC]/15 to-[#0092B8]/15 rounded shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Title Section */}
              <div>
                <CardTitle className="flex items-center text-[#155DFC] font-semibold text-xl tracking-tight mt-3">
                  <User className="mr-2 h-5 w-5 text-[#0092B8]" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-slate-600 mt-1 text-sm">
                  Manage your personal details and account settings
                </CardDescription>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isEditingProfile ? (
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    size="sm"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleProfileUpdate}
                      size="sm"
                      disabled={profileLoading}
                      className="bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
                    >
                      {profileLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      onClick={() => setIsEditingProfile(false)}
                      variant="outline"
                      size="sm"
                      className="text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-all"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium text-slate-700">
                  Full Name
                </Label>
                {isEditingProfile ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      handleProfileInputChange("name", e.target.value)
                    }
                    placeholder="Enter your full name"
                    className="focus:ring-2 focus:ring-[#0092B8]"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md text-slate-700">
                    {profile?.name || "Not provided"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium text-slate-700">
                  Email Address
                </Label>
                {isEditingProfile ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      handleProfileInputChange("email", e.target.value)
                    }
                    placeholder="Enter your email"
                    className="focus:ring-2 focus:ring-[#0092B8]"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md flex items-center text-slate-700">
                    {profile?.email || "Not provided"}
                    {profile?.emailVerification?.isVerified && (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium text-slate-700">
                  Phone Number
                </Label>
                {isEditingProfile ? (
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) =>
                      handleProfileInputChange("phone", e.target.value)
                    }
                    placeholder="Enter your phone number"
                    className="focus:ring-2 focus:ring-[#0092B8]"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md flex items-center text-slate-700">
                    {profile?.phone || "Not provided"}
                    {profile?.phoneNumber?.isVerified ? (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 ml-2 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="font-medium text-slate-700">
                  Account Status
                </Label>
                <div className="p-3 bg-slate-50 rounded-md">
                  <Badge
                    className={`px-3 py-1 rounded-md ${
                      profile?.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {profile?.status?.toUpperCase() || "ACTIVE"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Security Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center text-[#155DFC]">
                <Lock className="mr-2 h-5 w-5 text-[#0092B8]" />
                Security Settings
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="font-medium text-slate-700">
                    Two-Factor Authentication
                  </Label>
                  <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                    Not configured
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-slate-700">
                    Last IP Address
                  </Label>
                  <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                    {profile?.ipAddress || "Unknown"}
                  </div>
                </div>
              </div>

              <Dialog
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white hover:shadow-md transition-all w-full md:w-auto">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-[#155DFC]">
                      Change Password
                    </DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>

                  {/* Password Fields */}
                  <div className="space-y-4 mt-2">
                    {["currentPassword", "newPassword", "confirmPassword"].map(
                      (field) => (
                        <div key={field} className="space-y-2">
                          <Label htmlFor={field}>
                            {field === "currentPassword"
                              ? "Current Password"
                              : field === "newPassword"
                              ? "New Password"
                              : "Confirm New Password"}
                          </Label>
                          <div className="relative">
                            <Input
                              id={field}
                              type={
                                showPasswords[field.split("Password")[0]]
                                  ? "text"
                                  : "password"
                              }
                              value={passwordData[field]}
                              onChange={(e) =>
                                handlePasswordInputChange(field, e.target.value)
                              }
                              placeholder={`${
                                field === "currentPassword"
                                  ? "Enter current"
                                  : field === "newPassword"
                                  ? "Enter new"
                                  : "Confirm new"
                              } password`}
                              className="focus:ring-2 focus:ring-[#0092B8]"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                togglePasswordVisibility(
                                  field.split("Password")[0]
                                )
                              }
                            >
                              {showPasswords[field.split("Password")[0]] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                      className="text-gray-700 border-gray-300 hover:bg-gray-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
                      className="bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white hover:shadow-md transition-all"
                    >
                      {passwordLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Lock className="mr-2 h-4 w-4" />
                      )}
                      Change Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="lg:col-span-3 shadow-md rounded border border-gray-100 ">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-[#155DFC]/10 to-[#0092B8]/10 rounded pb-5 border-b border-gray-100">
            <CardTitle className="flex items-center text-[#155DFC] font-semibold text-lg mt-3">
              <Settings className="mr-2 h-5 w-5 text-[#0092B8]" />
              Account Details
            </CardTitle>
            <CardDescription className="text-slate-600">
              Additional information about your account
            </CardDescription>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Account ID */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Account ID
                </Label>
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-md text-sm font-mono border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  {profile?.id || profile?._id}
                </div>
              </div>

              {/* User Agent */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  User Agent
                </Label>
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-md text-sm truncate border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                  {profile?.userAgent || "Unknown"}
                </div>
              </div>

              {/* Terms Accepted */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Terms Accepted
                </Label>
                <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center">
                  {profile?.termsAccepted ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-600 border-green-200 px-2 py-1 text-xs font-medium flex items-center"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Accepted
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-600 border-red-200 px-2 py-1 text-xs font-medium flex items-center"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Accepted
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminProfile;
