import React, { useState, useCallback, useEffect } from "react";
import useBlogCategories from "@/hooks/BlogsCategories";
import axiosInstance from "@/lib/axios";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  AlertCircle,
  Tag,
  Calendar,
  Eye,
  EyeOff,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AllBlogCategories = () => {
  const {
    categories,
    error: fetchError,
    refetch,
    loading: fetchLoading,
  } = useBlogCategories();

  // State management
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState("");

  // Modal states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
    slug: "",
  });

  const isEditMode = !!editingCategory;

  // Generate SEO-friendly slug
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Handle form data changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-generate slug when name changes
      if (field === "name") {
        updated.slug = generateSlug(value);
      }

      return updated;
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      isActive: true,
      slug: "",
    });
    setEditingCategory(null);
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setFormDialogOpen(true);
  };

  // Open edit modal
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      isActive: category.isActive !== undefined ? category.isActive : true,
      slug: category.slug || "",
    });
    setFormDialogOpen(true);
  };

  // Handle create/update
  const handleSubmit = useCallback(async () => {
    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        name: formData.name.trim(),
        isActive: formData.isActive,
        slug: formData.slug || generateSlug(formData.name),
      };

      if (isEditMode) {
        await axiosInstance.put(
          `/update-category/${editingCategory._id}`,
          payload
        );
      } else {
        await axiosInstance.post("/create-category", payload);
      }

      await refetch();
      setFormDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save category");
      console.error("Category save error:", err);
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, editingCategory, refetch]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deletingCategory) return;

    setLoading(true);
    setError("");

    try {
      await axiosInstance.delete(`/delete-category/${deletingCategory._id}`);
      await refetch();
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete category");
      console.error("Category delete error:", err);
    } finally {
      setLoading(false);
    }
  }, [deletingCategory, refetch]);

  // Open delete confirmation
  const openDeleteModal = (category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  // Filter and sort categories
  const processedCategories = React.useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];

    let filtered = categories.filter((category) => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.slug &&
          category.slug.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && category.isActive) ||
        (filterStatus === "inactive" && !category.isActive);

      return matchesSearch && matchesStatus;
    });

    // Sort categories
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle date sorting
      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // Handle string sorting
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [categories, searchTerm, filterStatus, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCategories = processedCategories.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handle sort change
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-xl shadow-md bg-gradient-to-r from-blue-700 to-sky-600">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Blog Categories
          </h1>
          <p className="text-blue-100 mt-1 text-sm sm:text-base">
            Organize and manage your blog content efficiently
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-[#FF9119] hover:bg-[#FF9119]/90 text-white font-semibold rounded-lg px-5 py-2.5 shadow-md transition"
        >
          <Plus size={18} />
          Add Category
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} className="text-gray-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split("-");
                    setSortBy(field);
                    setSortOrder(order);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="updatedAt-desc">Recently Updated</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {(error || fetchError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || fetchError}</AlertDescription>
        </Alert>
      )}

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Categories ({processedCategories.length})</span>
            {(fetchLoading || loading) && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-700 to-sky-600 text-white">
                  <th
                    className="text-left p-4 font-semibold cursor-pointer hover:bg-blue-800/70 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Category Name
                      {sortBy === "name" && (
                        <ArrowUpDown
                          size={14}
                          className={sortOrder === "asc" ? "rotate-180" : ""}
                        />
                      )}
                    </div>
                  </th>
                  <th className="text-left p-4 font-semibold">Slug</th>
                  <th className="text-left p-4 font-semibold">Status</th>

                  <th className="text-left p-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedCategories.map((category) => (
                  <tr
                    key={category._id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Tag size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {category.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {category._id?.slice(-6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {category.slug}
                      </code>
                    </td>
                  <td className="p-4">
                    <Badge
                        className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                        category.isActive
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-400 text-white hover:bg-gray-500"
                        }`}
                    >
                        {category.isActive ? (
                        <Eye size={12} className="mr-1" />
                        ) : (
                        <EyeOff size={12} className="mr-1" />
                        )}
                        {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                    </td>


                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <Button
                          size="sm"
                          className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm transition"
                          onClick={() => openEditModal(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
                          onClick={() => openDeleteModal(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {paginatedCategories.length === 0 && (
              <div className="text-center py-12">
                <Tag size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No categories found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first blog category"}
                </p>
                <Button onClick={openCreateModal} className="gap-2">
                  <Plus size={16} />
                  Add Category
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="outline"
            disabled={currentPage === 1 || loading}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="gap-2"
          >
            <ChevronLeft size={16} />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={loading}
                  className="w-10 h-10 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            disabled={currentPage === totalPages || loading}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="gap-2"
          >
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="text-blue-600" />
              {isEditMode ? "Edit Category" : "Create New Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter category name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug">SEO Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                placeholder="auto-generated-slug"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL-friendly version (auto-generated from name)
              </p>
            </div>

           <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="font-medium text-gray-700">
                    Active Status
                </Label>
                <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked)
                    }
                    className={`${
                    formData.isActive
                        ? "data-[state=checked]:bg-green-600 data-[state=checked]:hover:bg-green-700"
                        : ""
                    }`}
                />
                </div>

          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
           <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="gap-2 bg-gradient-to-r from-blue-800 to-sky-700 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
            {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
                <Tag size={16} />
            )}
            {isEditMode ? "Update Category" : "Create Category"}
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "
              {deletingCategory?.name}"? This action cannot be undone and may
              affect associated blog posts.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Trash2 size={16} />
              )}
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllBlogCategories;
