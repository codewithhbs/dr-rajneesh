import { API_URL } from "@/constant/Urls";
import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Star,
  Clock,
  Stethoscope,
  Building2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const validStatuses = ["Booking Open", "Booking Close", "Draft", "Published"];

// Helper function to generate doctor initials
const getDoctorInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// Helper for status badge variant (replace this with your logic or map if required)
const getStatusBadgeVariant = (status) => {
  switch (status) {
    case "Published":
      return "default";
    case "Draft":
      return "secondary";
    case "Booking Open":
      return "success";
    case "Booking Close":
      return "destructive";
    default:
      return "outline";
  }
};

const AllServices = () => {
  const [services, setServices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // number of services per page
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});

  // Search and sorting states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("service_name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Fetch all services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/get-all-service`);
      if (response.data.success) {
        setServices(response.data.data);
      } else {
        toast.info("Failed to fetch services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  const totalPages = Math.ceil(services.length / itemsPerPage);

  const paginatedServices = services.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    const filtered = services.filter(
      (service) =>
        service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.service_small_desc
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (service.service_doctor?.doctor_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    // Sort services
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "service_name":
          aValue = a.service_name.toLowerCase();
          bValue = b.service_name.toLowerCase();
          break;
        case "service_status":
          aValue = a.service_status;
          bValue = b.service_status;
          break;
        case "service_per_session_price":
          aValue =
            a.service_per_session_discount_price || a.service_per_session_price;
          bValue =
            b.service_per_session_discount_price || b.service_per_session_price;
          break;
        case "doctor_name":
          aValue = (a.service_doctor?.doctor_name || "").toLowerCase();
          bValue = (b.service_doctor?.doctor_name || "").toLowerCase();
          break;
        case "position":
          // Assuming position is based on creation order or a specific field
          aValue = a._id;
          bValue = b._id;
          break;
        default:
          aValue = a.service_name.toLowerCase();
          bValue = b.service_name.toLowerCase();
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
    });

    return filtered;
  }, [services, searchTerm, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Update service status
  const updateServiceStatus = useCallback(async (serviceId, newStatus) => {
    try {
      setUpdateLoading((prev) => ({ ...prev, [serviceId]: true }));

      const response = await axios.put(
        `${API_URL}/update-service-status/${serviceId}`,
        {
          status: newStatus,
        }
      );

      if (response.data.success) {
        setServices((prev) =>
          prev.map((service) =>
            service._id === serviceId
              ? { ...service, service_status: newStatus }
              : service
          )
        );

        toast.success("Service status updated successfully");
      } else {
        toast.info("Failed to update service status");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      toast.error(error.response.data.message);
    } finally {
      setUpdateLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  }, []);

  // Delete service
  const deleteService = useCallback(async (serviceId) => {
    try {
      setDeleteLoading((prev) => ({ ...prev, [serviceId]: true }));

      const response = await axios.delete(
        `${API_URL}/delete-service/${serviceId}`
      );

      if (response.data.success) {
        setServices((prev) =>
          prev.filter((service) => service._id !== serviceId)
        );
        toast.success("Service deleted successfully");
      } else {
        toast.info("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(error.response.data.message);
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  }, []);

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Published":
        return "default";
      case "Booking Open":
        return "secondary";
      case "Booking Close":
        return "destructive";
      case "Draft":
        return "outline";
      default:
        return "outline";
    }
  };

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-800 to-sky-700 text-white p-6 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold">All Treatments</h1>
          <p className="text-muted-foreground text-white">
            Manage all your healthcare Treatments (
            {filteredAndSortedServices.length} of {services.length} total)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={fetchServices}
            type="button"
            className="inline-flex items-center gap-2 text-white bg-[#050708] hover:bg-[#050708]/80 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>

          <Link
            to={"/dashboard/add-or-update-treatments?edit=false"}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
          >
            <Plus size={18} />
            Add New Treatment
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 mt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services by name, description, or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredAndSortedServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "No Services Found" : "No Services Available"}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? `No services match your search "${searchTerm}"`
                : "There are no services available at the moment."}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="mt-4"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gradient-to-r from-blue-800 to-sky-700 text-white rounded-t-lg">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:opacity-80 transition-all px-4 py-3 font-semibold text-white"
                      onClick={() => handleSort("service_name")}
                    >
                      <div className="flex items-center gap-2">
                        Service Name
                        {getSortIcon("service_name")}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer hover:opacity-80 transition-all px-4 py-3 font-semibold text-white"
                      onClick={() => handleSort("service_status")}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon("service_status")}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer hover:opacity-80 transition-all px-4 py-3 font-semibold text-white"
                      onClick={() => handleSort("service_per_session_price")}
                    >
                      <div className="flex items-center gap-2">
                        Price
                        {getSortIcon("service_per_session_price")}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer hover:opacity-80 transition-all px-4 py-3 font-semibold text-white"
                      onClick={() => handleSort("doctor_name")}
                    >
                      <div className="flex items-center gap-2">
                        Doctor
                        {getSortIcon("doctor_name")}
                      </div>
                    </TableHead>

                    <TableHead className="px-4 py-3 font-semibold text-white">
                      Sessions
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-white">
                      Clinics
                    </TableHead>
                    <TableHead className="px-4 py-3 text-right font-semibold text-white">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedServices.map((service) => (
                    <TableRow key={service._id}>
                      <TableCell>
                        <div className="flex flex-col space-y-1 max-w-xs">
                          {/* Service Name */}
                          <span className="font-semibold text-gray-800 text-sm md:text-base truncate">
                            {service.service_name}
                          </span>

                          {/* Small Description */}
                          <span className="text-gray-500 text-xs md:text-sm truncate line-clamp-1">
                            {service.service_small_desc}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(
                            service.service_status
                          )}
                        >
                          {service.service_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {service.service_per_session_discount_price <
                          service.service_per_session_price ? (
                            <>
                              {/* Discounted Price + Badge */}
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 font-semibold text-base md:text-lg">
                                  ₹{service.service_per_session_discount_price}
                                </span>
                                <span className="inline-block px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded animate-pulse">
                                  {
                                    service.service_per_session_discount_percentage
                                  }
                                  % OFF
                                </span>
                              </div>

                              {/* Original Price */}
                              <span className="text-gray-400 line-through text-sm md:text-base">
                                ₹{service.service_per_session_price}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-800 font-semibold text-base md:text-lg">
                              ₹{service.service_per_session_price}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {service.service_doctor ? (
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {service.service_doctor.doctor_name}
                              </p>
                              {service.service_doctor.doctor_ratings && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs text-muted-foreground">
                                    {service.service_doctor.doctor_ratings}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No doctor assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {service.service_session_allowed_limit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {service.service_available_at_clinics?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition"
                              >
                                <Eye className="h-4 w-4 " />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[600px] sm:w-[700px]">
                              <SheetHeader>
                                <SheetTitle>{service.service_name}</SheetTitle>
                              </SheetHeader>
                              <ScrollArea className="h-[calc(100vh-100px)] mt-6">
                                <ServiceDetails service={service} />
                              </ScrollArea>
                            </SheetContent>
                          </Sheet>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded shadow-sm transition"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-1"
                            >
                              {/* Actions Label */}
                              <DropdownMenuLabel className="text-gray-500 text-sm font-semibold px-3 py-1">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator className="my-1" />

                              {/* Edit Service */}
                              <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                                <Edit className="h-4 w-4 text-blue-500" />
                                <Link
                                  to={`/dashboard/add-or-update-treatments?edit=true&id=${service._id}`}
                                  className="w-full"
                                >
                                  Edit Service
                                </Link>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1" />

                              {/* Change Status */}
                              <DropdownMenuLabel className="text-gray-500 text-sm font-semibold px-3 py-1">
                                Change Status
                              </DropdownMenuLabel>
                              {validStatuses.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() =>
                                    updateServiceStatus(service._id, status)
                                  }
                                  disabled={
                                    updateLoading[service._id] ||
                                    service.service_status === status
                                  }
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md disabled:opacity-50"
                                >
                                  {updateLoading[service._id] &&
                                  service.service_status !== status ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                                  ) : null}
                                  <span>{status}</span>
                                </DropdownMenuItem>
                              ))}

                              <DropdownMenuSeparator className="my-1" />

                              {/* Delete Service */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                    Delete Service
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>

                                <AlertDialogContent className="rounded-lg p-4">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-lg font-semibold">
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                      This action cannot be undone. This will
                                      permanently delete the service "
                                      {service.service_name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex justify-end gap-2 mt-4">
                                    <AlertDialogCancel className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteService(service._id)}
                                      disabled={deleteLoading[service._id]}
                                      className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      {deleteLoading[service._id] ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                      ) : null}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination info */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md text-white bg-gradient-to-r from-blue-800 to-sky-700 "
          >
            Previous
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded-md ${
                currentPage === i + 1
                  ? "px-3 py-1 rounded-md text-white bg-gradient-to-r from-blue-800 to-sky-700 "
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md text-white bg-gradient-to-r from-blue-800 to-sky-700 "
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Service Details Component for the sheet
const ServiceDetails = ({ service }) => {
  return (
    <div className="space-y-6 px-5">
      {/* Service Images */}
      {/* {service.service_images && service.service_images.length > 0 ? (
        <div>
          <h3 className="font-semibold mb-3">Service Images</h3>
          <div className="grid grid-cols-2 gap-2">
            {service.service_images.map((image, index) => (
              <img
                key={index}
                src={image.url || "/placeholder.svg"}
                alt={`${service.service_name} ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold mb-3">Service Images</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No images available</p>
          </div>
        </div>
      )} */}

      {/* Basic Information */}
      <div className="bg-white shadow-md rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">
              Service Name
            </label>
            <p className="text-base font-semibold">{service.service_name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Tag</label>
            <p className="text-base">{service.service_tag}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">
              Short Description
            </label>
            <p className="text-sm text-gray-700">
              {service.service_small_desc}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <div className="mt-1">
              <Badge
                className="px-3 py-1 text-xs rounded shadow"
                variant={getStatusBadgeVariant(service.service_status)}
              >
                {service.service_status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Information */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 shadow-md rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          Pricing Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <label className="text-sm font-medium text-gray-500">
              Original Price
            </label>
            <p className="text-lg font-semibold text-gray-800">
              ₹{service.service_per_session_price}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <label className="text-sm font-medium text-gray-500">
              Discounted Price
            </label>
            <p className="text-lg font-semibold text-green-600">
              ₹{service.service_per_session_discount_price}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <label className="text-sm font-medium text-gray-500">
              Discount %
            </label>
            <p className="text-base text-gray-800">
              {service.service_per_session_discount_percentage}%
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <label className="text-sm font-medium text-gray-500">
              Session Limit
            </label>
            <p className="text-base text-gray-800">
              {service.service_session_allowed_limit}
            </p>
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      {service.service_doctor && (
        <div className="bg-white shadow-md rounded-xl p-5">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Doctor Information
          </h3>
          <div className="flex items-center gap-4 mt-4">
            <Avatar className="h-14 w-14 shadow-md ring-2 ring-blue-200">
              <AvatarImage
                src={
                  service.service_doctor.doctor_images?.[0]?.url ||
                  "/placeholder.svg"
                }
                alt={service.service_doctor.doctor_name}
              />
              <AvatarFallback>
                {getDoctorInitials(service.service_doctor.doctor_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 text-base">
                {service.service_doctor.doctor_name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="px-2 py-0.5">
                  {service.service_doctor.doctor_status}
                </Badge>
                {service.service_doctor.doctor_ratings !== undefined && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-700">
                      {service.service_doctor.doctor_ratings}
                    </span>
                  </div>
                )}
              </div>
              {service.service_doctor.any_special_note && (
                <p className="text-sm text-gray-500 mt-2 italic">
                  {service.service_doctor.any_special_note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Clinics */}
      {service.service_available_at_clinics &&
        service.service_available_at_clinics.length > 0 && (
          <div className="bg-white shadow-md rounded-xl p-5 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              Available Clinics
            </h3>
            <div className="grid gap-4">
              {service.service_available_at_clinics.map(
                (clinic, index) =>
                  clinic.clinic_name && (
                    <div
                      key={clinic._id || index}
                      className="p-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 shadow-sm hover:shadow-md transition"
                    >
                      <h4 className="font-semibold text-gray-800">
                        {clinic.clinic_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{clinic.clinic_stauts}</Badge>
                        {clinic.clinic_ratings !== undefined && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-gray-700">
                              {clinic.clinic_ratings}
                            </span>
                          </div>
                        )}
                      </div>
                      {clinic.any_special_note && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          {clinic.any_special_note}
                        </p>
                      )}
                      {clinic.clinic_map && (
                        <a
                          href={clinic.clinic_map}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
                        >
                          <MapPin className="h-4 w-4" />
                          View on Map
                        </a>
                      )}
                    </div>
                  )
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default AllServices;
