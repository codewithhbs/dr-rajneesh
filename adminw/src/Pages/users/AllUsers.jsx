import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertTriangle,
  Search,
  Users,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

const AllUsers = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    user: null,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("📥 Fetching all users...");

      const res = await axiosInstance.get("/admin/get-all-user");

      setUsers(res.data.users || []);
      setFiltered(res.data.users || []);
    } catch (err) {
      console.error("❌ Failed to fetch users:", err);
      toast.error(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    applyFilters(value, statusFilter, roleFilter, verificationFilter);
    setCurrentPage(1);
  };

  const applyFilters = (searchTerm, status, role, verification) => {
    let result = users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phone?.includes(searchTerm);

      const matchesStatus = status === "all" || user.status === status;
      const matchesRole = role === "all" || user.role === role;

      let matchesVerification = true;
      if (verification === "email-verified") {
        matchesVerification = user.emailVerification?.isVerified === true;
      } else if (verification === "phone-verified") {
        matchesVerification = user.phoneNumber?.isVerified === true;
      } else if (verification === "both-verified") {
        matchesVerification =
          user.emailVerification?.isVerified === true &&
          user.phoneNumber?.isVerified === true;
      } else if (verification === "unverified") {
        matchesVerification =
          user.emailVerification?.isVerified !== true &&
          user.phoneNumber?.isVerified !== true;
      }

      return (
        matchesSearch && matchesStatus && matchesRole && matchesVerification
      );
    });

    setFiltered(result);
  };

  const handleFilterChange = (type, value) => {
    if (type === "status") setStatusFilter(value);
    if (type === "role") setRoleFilter(value);
    if (type === "verification") setVerificationFilter(value);

    applyFilters(
      search,
      type === "status" ? value : statusFilter,
      type === "role" ? value : roleFilter,
      type === "verification" ? value : verificationFilter
    );
    setCurrentPage(1);
  };

  const handleDeleteClick = (user) => {
    setDeleteDialog({ open: true, user });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.user) return;

    try {
      setDeleteLoading(true);
      console.log("🗑️ Deleting user:", deleteDialog.user._id);

      await axiosInstance.delete(`/admin/delete-user/${deleteDialog.user._id}`);
      console.log("✅ User deleted successfully");

      toast.success(`User "${deleteDialog.user.name}" deleted successfully`);
      setDeleteDialog({ open: false, user: null });
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("❌ Delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

const getStatusBadge = (status) => {
  const styles = {
    active: "bg-green-500 text-white",
    inactive: "bg-gray-300 text-gray-800",
    blocked: "bg-red-500 text-white",
    pending: "bg-yellow-400 text-gray-900",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${
        styles[status] || "bg-gray-200 text-gray-800"
      }`}
    >
      {status?.toUpperCase() || "UNKNOWN"}
    </span>
  );
};


const getRoleBadge = (role) => {
  const variants = {
    admin: "destructive",
    user: "default",
    moderator: "secondary",
  };
  return (
    <Badge
      variant={variants[role] || "outline"}
      className="rounded px-2 py-1 text-xs font-semibold"
    >
      {role?.toUpperCase() || "USER"}
    </Badge>
  );
};


  // Pagination calculations
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filtered.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filtered.length / usersPerPage);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRoleFilter("all");
    setVerificationFilter("all");
    setFiltered(users);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

const handleExport = () => {
  if (!users || users.length === 0) {
    toast.error("No users to export");
    return;
  }

  // Prepare data
  const data = users.map((user) => ({
    Name: user.name,
    Email: user.email,
    Phone: user.phone,
    Status: user.status,
    Role: user.role,
    "Email Verified": user.emailVerification?.isVerified ? "Yes" : "No",
    "Phone Verified": user.phoneNumber?.isVerified ? "Yes" : "No",
    Joined: new Date(user.createdAt).toLocaleDateString(),
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Save file
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `users_${new Date().getTime()}.xlsx`);
};



  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 to-sky-700 text-white px-6 py-4 rounded-lg shadow-md">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center">
            <Users className="mr-3 h-8 w-8" />
            All Users
          </h1>
          <p className="text-slate-200 mt-1 text-sm md:text-base">
            Manage and monitor all registered users
          </p>
        </div>
        <div className="flex gap-2">
          {/* Refresh Button */}
          <Button
            onClick={fetchUsers}
            disabled={loading}
            className="bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 shadow-lg rounded px-5"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* Export Button */}
         <Button
  onClick={handleExport}
  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold hover:from-yellow-500 hover:to-orange-600 shadow-lg rounded px-5"
>
  <Download className="mr-2 h-4 w-4" />
  Export
</Button>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-blue-50 text-blue-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-semibold">Total Users</p>
                <p className="text-2xl font-semibold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-green-50 text-green-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-semibold">Active Users</p>
                <p className="text-2xl font-semibold">
                  {users.filter((u) => u.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Users */}
        <Card className="bg-red-50 text-red-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center">
              <XCircle className="h-10 w-10 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-semibold">Inactive Users</p>
                <p className="text-2xl font-semibold">
                  {users.filter((u) => u.status !== "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verified Users */}
        <Card className="bg-yellow-50 text-yellow-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-semibold">Verified</p>
                <p className="text-2xl font-semibold">
                  {users.filter((u) => u.emailVerification?.isVerified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(value) => handleFilterChange("role", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verificationFilter}
              onValueChange={(value) =>
                handleFilterChange("verification", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="email-verified">Email Verified</SelectItem>
                <SelectItem value="phone-verified">Phone Verified</SelectItem>
                <SelectItem value="both-verified">Both Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={clearFilters}
              className="bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 rounded-md shadow-sm"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Loading users...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-800 to-sky-700 text-white">
                  <TableRow>
                    <TableHead className="w-12 px-4 py-2 text-white">
                      #
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white font-bold">
                      User
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white font-bold">
                      Contact
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white font-bold">
                      Verification
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white font-bold">
                      Status
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white font-bold">
                      Role
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white font-bold">
                      Joined
                    </TableHead>
                    <TableHead className="px-4 py-2 text-white text-right font-bold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentUsers.map((user, index) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">
                        {indexOfFirstUser + index + 1}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={user.profileImage?.url}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-slate-500">
                              ID: {user._id?.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{user.email}</div>
                          <div className="text-sm text-slate-500">
                            {user.phone}
                          </div>
                        </div>
                      </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center">
                              {user.emailVerification?.isVerified ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className="text-sm">Email</span>
                            </div>
                            <div className="flex items-center">
                              {user.phoneNumber?.isVerified ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className="text-sm">Phone</span>
                            </div>
                          </div>
                        </TableCell>

                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>

                     <TableCell>
                      <div className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).toUpperCase()}
                      </div>
                    </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Delete Button */}
                          <Button
                            size="sm"
                            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {currentUsers.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <Users className="h-12 w-12 text-slate-400 mb-4" />
                          <p className="text-slate-600">No users found</p>
                          <p className="text-sm text-slate-400">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
     {totalPages > 1 && (
  <Card>
    <CardContent className="py-4">
      <div className="flex items-center justify-end space-x-2">
        {/* Previous Button */}
        <Button
          size="sm"
          className={`px-3 py-1 rounded-md font-semibold text-white bg-gradient-to-r from-blue-800 to-sky-700 flex items-center gap-1 ${
            currentPage === 1 ? "opacity-50 pointer-events-none" : "hover:from-blue-700 hover:to-sky-600"
          }`}
          onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page Numbers */}
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const page = i + 1;
          return (
            <Button
              key={page}
              size="sm"
              className={`px-3 py-1 rounded-md font-semibold ${
                currentPage === page
                  ? "bg-gradient-to-r from-blue-800 to-sky-700 text-white shadow-lg"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          );
        })}

        {/* Next Button */}
        <Button
          size="sm"
          className={`px-3 py-1 rounded-md font-semibold text-white bg-gradient-to-r from-blue-800 to-sky-700 flex items-center gap-1 ${
            currentPage === totalPages ? "opacity-50 pointer-events-none" : "hover:from-blue-700 hover:to-sky-600"
          }`}
          onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
)}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user "
              {deleteDialog.user?.name}"? This action cannot be undone and will
              permanently remove all user data.
            </DialogDescription>
          </DialogHeader>

          {deleteDialog.user && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={deleteDialog.user.profileImage?.url} />
                  <AvatarFallback>
                    {deleteDialog.user.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{deleteDialog.user.name}</p>
                  <p className="text-sm text-slate-600">
                    {deleteDialog.user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, user: null })}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllUsers;
