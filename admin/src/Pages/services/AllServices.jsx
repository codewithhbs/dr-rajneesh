
import { API_URL } from "@/constant/Urls"
import { useEffect, useState, useMemo, useCallback } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/alert-dialog"
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
} from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"

const validStatuses = ["Booking Open", "Booking Close", "Draft", "Published"]

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
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [updateLoading, setUpdateLoading] = useState({})
    const [deleteLoading, setDeleteLoading] = useState({})
    const [pagination, setPagination] = useState({})

    // Search and sorting states
    const [searchTerm, setSearchTerm] = useState("")
    const [sortField, setSortField] = useState("service_name")
    const [sortDirection, setSortDirection] = useState("asc")


    // Fetch all services
    const fetchServices = useCallback(async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${API_URL}/get-all-service`)

            if (response.data.success) {
                setServices(response.data.data)
                setPagination(response.data.pagination)
            } else {
                toast.info("Failed to fetch services")
            }
        } catch (error) {
            console.error("Error fetching services:", error)
            toast.error(error.response.data.message)
        } finally {
            setLoading(false)
        }
    }, [])

    // Filter and sort services
    const filteredAndSortedServices = useMemo(() => {
        const filtered = services.filter(
            (service) =>
                service.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                service.service_small_desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (service.service_doctor?.doctor_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
        )

        // Sort services
        filtered.sort((a, b) => {
            let aValue, bValue

            switch (sortField) {
                case "service_name":
                    aValue = a.service_name.toLowerCase()
                    bValue = b.service_name.toLowerCase()
                    break
                case "service_status":
                    aValue = a.service_status
                    bValue = b.service_status
                    break
                case "service_per_session_price":
                    aValue = a.service_per_session_discount_price || a.service_per_session_price
                    bValue = b.service_per_session_discount_price || b.service_per_session_price
                    break
                case "doctor_name":
                    aValue = (a.service_doctor?.doctor_name || "").toLowerCase()
                    bValue = (b.service_doctor?.doctor_name || "").toLowerCase()
                    break
                case "position":
                    // Assuming position is based on creation order or a specific field
                    aValue = a._id
                    bValue = b._id
                    break
                default:
                    aValue = a.service_name.toLowerCase()
                    bValue = b.service_name.toLowerCase()
            }

            if (typeof aValue === "string" && typeof bValue === "string") {
                return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
            } else {
                return sortDirection === "asc" ? aValue - bValue : bValue - aValue
            }
        })

        return filtered
    }, [services, searchTerm, sortField, sortDirection])

    // Handle sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    // Get sort icon
    const getSortIcon = (field) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-4 w-4" />
        }
        return sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
    }

    // Update service status
    const updateServiceStatus = useCallback(async (serviceId, newStatus) => {
        try {
            setUpdateLoading((prev) => ({ ...prev, [serviceId]: true }))

            const response = await axios.put(`${API_URL}/update-service-status/${serviceId}`, {
                status: newStatus,
            })

            if (response.data.success) {
                setServices((prev) =>
                    prev.map((service) => (service._id === serviceId ? { ...service, service_status: newStatus } : service)),
                )

                toast.success("Service status updated successfully")
            } else {
                toast.info("Failed to update service status")
            }
        } catch (error) {
            console.error("Error updating service status:", error)
            toast.error(error.response.data.message)
        } finally {
            setUpdateLoading((prev) => ({ ...prev, [serviceId]: false }))
        }
    }, [])

    // Delete service
    const deleteService = useCallback(async (serviceId) => {
        try {
            setDeleteLoading((prev) => ({ ...prev, [serviceId]: true }))

            const response = await axios.delete(`${API_URL}/delete-service/${serviceId}`)

            if (response.data.success) {
                setServices((prev) => prev.filter((service) => service._id !== serviceId))
                toast.success("Service deleted successfully")
            } else {
                toast.info("Failed to delete service")
            }
        } catch (error) {
            console.error("Error deleting service:", error)
            toast.error(error.response.data.message)
        } finally {
            setDeleteLoading((prev) => ({ ...prev, [serviceId]: false }))
        }
    }, [])

    // Get status badge variant
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "Published":
                return "default"
            case "Booking Open":
                return "secondary"
            case "Booking Close":
                return "destructive"
            case "Draft":
                return "outline"
            default:
                return "outline"
        }
    }


    useEffect(() => {
        fetchServices()
    }, [fetchServices])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">All Treatments</h1>
                    <p className="text-muted-foreground">
                        Manage all your healthcare Treatments ({filteredAndSortedServices.length} of {services.length} total)
                    </p>
                </div>
                <div>
                    <Button onClick={fetchServices} variant="outline">
                        Refresh
                    </Button>
                    <Button className={'ml-2'} variant={'destructive'}>
                        <Link to={'/dashboard/add-or-update-treatments?edit=false'}>Add New Treatment</Link>
                    </Button>
                </div>


            </div>

            {/* Search Bar */}
            <div className="mb-6">
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
                        <h3 className="text-lg font-semibold mb-2">{searchTerm ? "No Services Found" : "No Services Available"}</h3>
                        <p className="text-muted-foreground text-center">
                            {searchTerm
                                ? `No services match your search "${searchTerm}"`
                                : "There are no services available at the moment."}
                        </p>
                        {searchTerm && (
                            <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
                                Clear Search
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Services Table</CardTitle>
                        <CardDescription>Click on column headers to sort the data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("service_name")}>
                                            <div className="flex items-center gap-2">
                                                Service Name
                                                {getSortIcon("service_name")}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort("service_status")}
                                        >
                                            <div className="flex items-center gap-2">
                                                Status
                                                {getSortIcon("service_status")}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort("service_per_session_price")}
                                        >
                                            <div className="flex items-center gap-2">
                                                Price
                                                {getSortIcon("service_per_session_price")}
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("doctor_name")}>
                                            <div className="flex items-center gap-2">
                                                Doctor
                                                {getSortIcon("doctor_name")}
                                            </div>
                                        </TableHead>
                                        <TableHead>Sessions</TableHead>
                                        <TableHead>Clinics</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAndSortedServices.map((service) => (
                                        <TableRow key={service._id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div className="font-medium">{service.service_name}</div>
                                                    <div className="text-sm w-sm truncate  text-muted-foreground line-clamp-1">{service.service_small_desc}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(service.service_status)}>{service.service_status}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {service.service_per_session_discount_price < service.service_per_session_price ? (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-green-600">
                                                                    ₹{service.service_per_session_discount_price}
                                                                </span>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {service.service_per_session_discount_percentage}% OFF
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm line-through text-muted-foreground">
                                                                ₹{service.service_per_session_price}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="font-semibold">₹{service.service_per_session_price}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {service.service_doctor ? (
                                                    <div className="flex items-center gap-3">

                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{service.service_doctor.doctor_name}</p>
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
                                                    <span className="text-muted-foreground">No doctor assigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{service.service_session_allowed_limit}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{service.service_available_at_clinics?.length || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="h-4 w-4" />
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
                                                            <Button variant="outline" size="sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                <Link to={`/dashboard/add-or-update-treatments?edit=true&id=${service._id}`}>
                                                                    Edit Service</Link>

                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                            {validStatuses.map((status) => (
                                                                <DropdownMenuItem
                                                                    key={status}
                                                                    onClick={() => updateServiceStatus(service._id, status)}
                                                                    disabled={updateLoading[service._id] || service.service_status === status}
                                                                >
                                                                    {updateLoading[service._id] ? (
                                                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                                                                    ) : null}
                                                                    {status}
                                                                </DropdownMenuItem>
                                                            ))}

                                                            <DropdownMenuSeparator />

                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem
                                                                        onSelect={(e) => e.preventDefault()}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete Service
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This action cannot be undone. This will permanently delete the service "
                                                                            {service.service_name}".
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteService(service._id)}
                                                                            disabled={deleteLoading[service._id]}
                                                                            className="bg-red-600 hover:bg-red-700"
                                                                        >
                                                                            {deleteLoading[service._id] ? (
                                                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            {pagination && (
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}({pagination.totalServices} total services)
                </div>
            )}
        </div>
    )
}

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
            <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Service Name</label>
                        <p className="text-sm">{service.service_name}</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Short Description</label>
                        <p className="text-sm">{service.service_small_desc}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                            <Badge variant={getStatusBadgeVariant(service.service_status)}>
                                {service.service_status}
                            </Badge>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Tag</label>
                        <p className="text-sm">{service.service_tag}</p>
                    </div>
                </div>
            </div>

            {/* Pricing Information */}
            <div>
                <h3 className="font-semibold mb-3">Pricing Information</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Original Price</label>
                            <p className="text-sm font-medium">₹{service.service_per_session_price}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Discounted Price</label>
                            <p className="text-sm font-medium text-green-600">₹{service.service_per_session_discount_price}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Discount Percentage</label>
                            <p className="text-sm">{service.service_per_session_discount_percentage}%</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Session Limit</label>
                            <p className="text-sm">{service.service_session_allowed_limit}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Doctor Information */}
            {service.service_doctor && (
                <div>
                    <h3 className="font-semibold mb-3">Doctor Information</h3>
                    <div className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage
                                    src={service.service_doctor.doctor_images?.[0]?.url || "/placeholder.svg"}
                                    alt={service.service_doctor.doctor_name}
                                />
                                <AvatarFallback>
                                    {getDoctorInitials(service.service_doctor.doctor_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h4 className="font-medium">{service.service_doctor.doctor_name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline">{service.service_doctor.doctor_status}</Badge>
                                    {service.service_doctor.doctor_ratings !== undefined && (
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm">{service.service_doctor.doctor_ratings}</span>
                                        </div>
                                    )}
                                </div>
                                {service.service_doctor.any_special_note && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {service.service_doctor.any_special_note}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Available Clinics */}
            {service.service_available_at_clinics && service.service_available_at_clinics.length > 0 && (
                <div>
                    <h3 className="font-semibold mb-3">Available Clinics</h3>
                    <div className="space-y-3">
                        {service.service_available_at_clinics.map((clinic, index) => (
                            clinic.clinic_name && (
                                <div key={clinic._id || index} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium">{clinic.clinic_name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline">{clinic.clinic_stauts}</Badge>
                                                {clinic.clinic_ratings !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        <span className="text-sm">{clinic.clinic_ratings}</span>
                                                    </div>
                                                )}
                                            </div>
                                            {clinic.any_special_note && (
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {clinic.any_special_note}
                                                </p>
                                            )}
                                            {clinic.clinic_map && (
                                                <a
                                                    href={clinic.clinic_map}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                    View on Map
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


export default AllServices
