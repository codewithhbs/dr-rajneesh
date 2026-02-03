"use client";

import { useState, useEffect, useMemo } from "react";
import JoditEditor from "jodit-react";
import axiosInstance from "@/lib/axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  RefreshCw,
  FileText,
  AlertCircle,
  X,
  ImageIcon,
  Calendar,
  Tag,
  Globe,
} from "lucide-react";
import useBlogCategories from "@/hooks/BlogsCategories";

const BlogManagement = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [viewBlog, setViewBlog] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    categories,
    error: fetchError,
    refetch,
    loading: fetchLoading,
  } = useBlogCategories();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    category: "",
    status: "draft",
    featured: false,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    image: null,
  });

  // Enhanced Jodit editor configuration with Tailwind support
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      placeholder: "Start crafting your amazing blog content...",
      height: 500,
      toolbarSticky: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: "insert_clear_html",
      theme: "default",
      saveModeInCookie: false,
      spellcheck: true,
      editorCssClass: "prose prose-lg max-w-none",
      bodyClassName: "p-4",
      buttons: [
        "source",
        "|",
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "superscript",
        "subscript",
        "|",
        "ul",
        "ol",
        "|",
        "outdent",
        "indent",
        "|",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "|",
        "image",
        "file",
        "video",
        "link",
        "table",
        "|",
        "left",
        "center",
        "right",
        "justify",
        "|",
        "undo",
        "redo",
        "|",
        "hr",
        "eraser",
        "copyformat",
        "|",
        "symbol",
        "fullsize",
        "print",
        "about",
      ],
      uploader: {
        insertImageAsBase64URI: true,
        imagesExtensions: ["jpg", "png", "jpeg", "gif", "svg", "webp"],
        filesVariableName: "files",
        withCredentials: false,
        pathVariableName: "path",
        format: "json",
        method: "POST",
      },
      filebrowser: {
        ajax: {
          url: "/api/upload",
        },
      },
      image: {
        editSrc: true,
        useImageEditor: true,
        openOnDblClick: true,
        editTitle: true,
        editAlt: true,
        editLink: true,
        editSize: true,
        editBorderRadius: true,
        editMargins: true,
        editClass: true,
        editStyle: true,
        editId: true,
        resizer: true,
        selectOnClick: true,
      },
      link: {
        followOnDblClick: false,
        processVideoLink: true,
        processPastedLink: true,
        removeLinkAfterFormat: true,
      },
      table: {
        resizeHandler: true,
        useExtraClassesOptions: true,
      },
      toolbarAdaptive: true,
      toolbarButtonSize: "middle",
      removeButtons: [],
      disablePlugins: ["paste", "stat"],
      extraButtons: [
        {
          name: "insertTailwindClass",
          iconURL:
            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+",
          tooltip: "Add Tailwind Classes",
          exec: (editor) => {
            const selection = editor.selection.save();
            const range = editor.selection.range;
            const selectedElement =
              range.commonAncestorContainer.nodeType === 3
                ? range.commonAncestorContainer.parentNode
                : range.commonAncestorContainer;

            const className = prompt(
              "Enter Tailwind CSS classes:",
              selectedElement.className || ""
            );
            if (className !== null) {
              if (selectedElement.tagName) {
                selectedElement.className = className;
              } else {
                const span = editor.create.element("span");
                span.className = className;
                editor.selection.insertNode(span, false, false);
              }
            }
            editor.selection.restore(selection);
          },
        },
      ],
    }),
    []
  );

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      slug: generateSlug(title),
      metaTitle: title,
    }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, GIF, WebP)");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
    }));
    setImagePreview(null);
    document.getElementById("image").value = "";
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/get-all-blogs");
      setBlogs(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
      alert("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "image" && formData[key]) {
        formDataToSend.append("image", formData[key]);
      } else if (key !== "image") {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      };

      if (selectedBlog) {
        await axiosInstance.put(
          `/update-blog/${selectedBlog._id}`,
          formDataToSend,
          config
        );
        alert("Blog updated successfully!");
      } else {
        await axiosInstance.post("/create-blog", formDataToSend, config);
        alert("Blog created successfully!");
      }

      resetForm();
      setIsDialogOpen(false);
      fetchBlogs();
    } catch (error) {
      console.error("Error saving blog:", error);
      alert(selectedBlog ? "Failed to update blog" : "Failed to create blog");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/delete-blog/${id}`);
      alert("Blog deleted successfully!");
      fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Failed to delete blog");
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    try {
      const response = await axiosInstance.get(`/get-blog/${id}`);
      setViewBlog(response.data.data || response.data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Error fetching blog details:", error);
      alert("Failed to fetch blog details");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      category: "",
      status: "draft",
      featured: false,
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      image: null,
    });
    setSelectedBlog(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

const handleEdit = (blog) => {
  setFormData({
    title: blog.title || "",
    slug: blog.slug || "",
    content: blog.content || "",
    category: blog.category?._id || blog.category || "",
    status: blog.status || "draft",
    featured: blog.featured || false,
    metaTitle: blog.metaTitle || "",
    metaDescription: blog.metaDescription || "",
    metaKeywords: blog.metaKeywords || "",
    image: null, // keep null until user uploads new image
  });

  setSelectedBlog(blog);

  if (blog.image?.url) {
    setImagePreview(blog.image.url); // <-- use URL string
  } else {
    setImagePreview(null);
  }

  setIsDialogOpen(true);
};

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const filteredBlogs = Array.isArray(blogs)
    ? blogs.filter((blog) => {
        const matchesSearch =
          blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.status?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || blog.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
    : [];

  const getStatusColor = (status) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 border-green-200";
      case "draft":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-800 to-sky-700 shadow-md">
          <h1 className="text-3xl font-bold text-white mb-2">
            Blog Management
          </h1>
          <p className="text-blue-100">
            Create, manage, and publish your blog content
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search blogs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchBlogs} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={resetForm}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Blog Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">
                        {selectedBlog
                          ? "Edit Blog Post"
                          : "Create New Blog Post"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 ">
                          <TabsTrigger
                            value="content"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Content
                          </TabsTrigger>
                          <TabsTrigger
                            value="settings"
                            className="flex items-center gap-2"
                          >
                            <Tag className="h-4 w-4" />
                            Settings
                          </TabsTrigger>
                          <TabsTrigger
                            value="seo"
                            className="flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4" />
                            SEO
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="content" className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="title"
                                className="text-sm font-medium"
                              >
                                Title *
                              </Label>
                              <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="Enter blog title..."
                                required
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor="slug"
                                className="text-sm font-medium"
                              >
                                URL Slug
                              </Label>
                              <Input
                                id="slug"
                                name="slug"
                                value={formData.slug}
                                onChange={handleInputChange}
                                placeholder="auto-generated-from-title"
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              Blog Content *
                            </Label>
                            <div className="border rounded-lg overflow-hidden">
                              <JoditEditor
                                value={formData.content}
                                config={editorConfig}
                                onBlur={handleContentChange}
                                onChange={() => {}}
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-3 block">
                              Featured Image
                            </Label>
                            <div className="space-y-4">
                              {imagePreview ? (
                                <div className="relative inline-block">
                                  <img
                                    src={imagePreview || "/placeholder.svg"}
                                    alt="Preview"
                                    className="w-48 h-32 object-cover rounded-lg border"
                                  />
                                  <Button
                                    type="button"
                                    onClick={removeImage}
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                  <div className="space-y-2">
                                    <Label
                                      htmlFor="image"
                                      className="cursor-pointer"
                                    >
                                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                                        Click to upload
                                      </span>
                                      <span className="text-gray-500">
                                        {" "}
                                        or drag and drop
                                      </span>
                                    </Label>
                                    <p className="text-xs text-gray-500">
                                      PNG, JPG, GIF, WebP up to 5MB
                                    </p>
                                  </div>
                                </div>
                              )}
                              <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                              />
                              {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="category"
                                className="text-sm font-medium"
                              >
                                Category
                              </Label>
                              <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    category: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue
                                    placeholder={
                                      fetchLoading
                                        ? "Loading..."
                                        : "Select category"
                                    }
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories && categories.length > 0 ? (
                                    categories.map((category) => (
                                      <SelectItem
                                        key={category._id || category.name}
                                        value={category._id || category}
                                      >
                                        {category.name || category}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="" disabled>
                                      No categories available
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label
                                htmlFor="status"
                                className="text-sm font-medium"
                              >
                                Status
                              </Label>
                              <Select
                                value={formData.status}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    status: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="published">
                                    Published
                                  </SelectItem>
                                  <SelectItem value="archived">
                                    Archived
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="featured"
                              checked={formData.featured}
                              onCheckedChange={(checked) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  featured: checked,
                                }))
                              }
                            />
                            <Label
                              htmlFor="featured"
                              className="text-sm font-medium"
                            >
                              Mark as featured blog post
                            </Label>
                          </div>
                        </TabsContent>

                        <TabsContent value="seo" className="space-y-6">
                          <div>
                            <Label
                              htmlFor="metaTitle"
                              className="text-sm font-medium"
                            >
                              Meta Title
                            </Label>
                            <Input
                              id="metaTitle"
                              name="metaTitle"
                              value={formData.metaTitle}
                              onChange={handleInputChange}
                              placeholder="SEO title for search engines"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label
                              htmlFor="metaDescription"
                              className="text-sm font-medium"
                            >
                              Meta Description
                            </Label>
                            <Textarea
                              id="metaDescription"
                              name="metaDescription"
                              value={formData.metaDescription}
                              onChange={handleInputChange}
                              rows={3}
                              placeholder="Brief description for search engines (150-160 characters)"
                              className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {formData.metaDescription.length}/160 characters
                            </p>
                          </div>
                          <div>
                            <Label
                              htmlFor="metaKeywords"
                              className="text-sm font-medium"
                            >
                              Meta Keywords
                            </Label>
                            <Input
                              id="metaKeywords"
                              name="metaKeywords"
                              value={formData.metaKeywords}
                              onChange={handleInputChange}
                              placeholder="keyword1, keyword2, keyword3"
                              className="mt-1"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="flex justify-end space-x-3 pt-6 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-800 to-sky-700 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all shadow-md"
                          >
                            {loading ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                {selectedBlog ? "Updating..." : "Creating..."}
                              </>
                            ) : (
                              <>
                                {selectedBlog ? (
                                  <Edit className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                                {selectedBlog ? "Update Blog" : "Create Blog"}
                              </>
                            )}
                          </Button>

                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {fetchError && (
              <Alert className="m-6 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Failed to load categories. You can still manage blogs, but
                  category selection may be limited.
                </AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                 <TableRow className="bg-gradient-to-r from-blue-800 to-sky-700">
                    <TableHead className="font-semibold text-white px-6">Blog Post</TableHead>
                    <TableHead className="font-semibold text-white px-6">Category</TableHead>
                    <TableHead className="font-semibold text-white px-6">Status</TableHead>
                    <TableHead className="font-semibold text-white px-6">Featured</TableHead>
                    <TableHead className="text-right font-semibold text-white px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                        <p className="text-gray-500">
                          Loading your blog posts...
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : filteredBlogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="bg-gray-100 rounded-full p-6">
                            <FileText className="h-12 w-12 text-gray-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {searchTerm || statusFilter !== "all"
                                ? "No blogs found"
                                : "No blog posts yet"}
                            </h3>
                            <p className="text-gray-500 mb-4">
                              {searchTerm || statusFilter !== "all"
                                ? "Try adjusting your search or filters."
                                : "Get started by creating your first blog post."}
                            </p>
                            {!searchTerm && statusFilter === "all" && (
                              <Button
                                onClick={() => {
                                  resetForm();
                                  setIsDialogOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Blog
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBlogs.map((blog) => (
                      <TableRow key={blog._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {blog.image && (
                              <img
                                src={blog.image?.url || "/placeholder.svg"}
                                alt={blog.title}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 line-clamp-1">
                                {blog.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                /{blog.slug}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {blog.category && (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {blog.category?.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(blog.status)}>
                            {blog.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {blog.featured && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                              Featured
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {/* View Button */}
                            <Button
                              size="sm"
                              className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition"
                              onClick={() => handleView(blog._id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            {/* Edit Button */}
                            <Button
                              size="sm"
                              className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm transition"
                              onClick={() => handleEdit(blog)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                {/* Delete Button */}
                                <Button
                                  size="sm"
                                  className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Blog Post
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {blog.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(blog._id)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Blog Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Blog Preview
              </DialogTitle>
            </DialogHeader>
            {viewBlog && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {viewBlog.title}
                  </h1>
                  <p className="text-gray-600">Slug: /{viewBlog.slug}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge className={getStatusColor(viewBlog.status)}>
                      {viewBlog.status}
                    </Badge>
                    {viewBlog.featured && (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        Featured
                      </Badge>
                    )}
                    {viewBlog.category && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {viewBlog.category?.name}
                      </Badge>
                    )}
                  </div>
                </div>

                {viewBlog.image && (
                  <div>
                    <h3 className="font-semibold mb-3">Featured Image</h3>
                    <img
                      src={viewBlog.image.url || "/placeholder.svg"}
                      alt={viewBlog.title}
                      className="max-w-full h-64 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Content</h3>
                  <div className="prose prose-lg max-w-none border rounded-lg p-6 bg-gray-50">
                    <div
                      dangerouslySetInnerHTML={{ __html: viewBlog.content }}
                    />
                  </div>
                </div>

                {(viewBlog.metaTitle ||
                  viewBlog.metaDescription ||
                  viewBlog.metaKeywords) && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">SEO Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      {viewBlog.metaTitle && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Meta Title:
                          </span>
                          <p className="text-gray-600 mt-1">
                            {viewBlog.metaTitle}
                          </p>
                        </div>
                      )}
                      {viewBlog.metaDescription && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Meta Description:
                          </span>
                          <p className="text-gray-600 mt-1">
                            {viewBlog.metaDescription}
                          </p>
                        </div>
                      )}
                      {viewBlog.metaKeywords && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Meta Keywords:
                          </span>
                          <p className="text-gray-600 mt-1">
                            {viewBlog.metaKeywords}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BlogManagement;
