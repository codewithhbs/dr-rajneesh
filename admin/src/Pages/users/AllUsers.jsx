"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import {
    CalendarIcon,
    Eye,
    Edit,
    Trash2,
    Filter,
    Search,
    X,
    RefreshCw,
    Users,
    UserCheck,
    Shield,
    Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { API_URL } from "@/constant/Urls"



const UserManagement = () => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showViewDialog, setShowViewDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteUserId, setDeleteUserId] = useState(null)
    const [showFilters, setShowFilters] = useState(false)
    const [editFormData, setEditFormData] = useState({})

    const [filters, setFilters] = useState({
        name: "",
        email: "",
        phone: "",
        status: "",
        role: "",
        termsAccepted: "",
        isLocked: "",
        startDate: null,
        endDate: null,
    })

    // Fetch users with filters
    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const queryParams = new URLSearchParams()

            // Add filters to query params
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== "") {
                    if (key === "startDate" || key === "endDate") {
                        queryParams.append(key, (value).toISOString())
                    } else {
                        queryParams.append(key, value)
                    }
                }
            })

            const response = await fetch(`${API_URL}/user/users?${queryParams.toString()}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setData(result.users)

            } else {
                throw new Error("Failed to fetch users")
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
            setError(errorMessage)

        } finally {
            setLoading(false)
        }
    }, [filters])

    // Fetch single user
    const fetchSingleUser = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/user/users/${userId}`)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            return result.success ? result.user : null
        } catch (err) {
            console.error("Error fetching single user:", err)
            return null
        }
    }

    // Update user
    const updateUser = async (userId, userData) => {
        try {
            const response = await fetch(`${API_URL}/user/users/${userId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                // Update local data
                setData((prevData) => prevData.map((user) => (user._id === userId ? { ...user, ...userData } : user)))

                toast.success("User updated successfully")

                return true
            } else {
                throw new Error("Failed to update user")
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message
            toast.error(errorMessage)
            return false
        }
    }

    // Delete user
    const deleteUser = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/user/users/${userId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setData((prevData) => prevData.filter((user) => user._id !== userId))
                toast.success("User updated successfully")

                return true
            } else {
                throw new Error("Failed to delete user")
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"

            toast.error(errorMessage)

            return false
        }
    }

    // Initial load
    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // Filter and pagination logic
    const filteredData = useMemo(() => {
        return data.filter((user) => {
            const matchesName = !filters.name || user.name.toLowerCase().includes(filters.name.toLowerCase())
            const matchesEmail = !filters.email || user.email.toLowerCase().includes(filters.email.toLowerCase())
            const matchesPhone = !filters.phone || (user.phone && user.phone.includes(filters.phone))
            const matchesStatus = !filters.status || user.status === filters.status
            const matchesRole = !filters.role || user.role === filters.role
            const matchesTerms = filters.termsAccepted === "" || user.termsAccepted.toString() === filters.termsAccepted
            const matchesLocked = filters.isLocked === "" || user.isLocked.toString() === filters.isLocked

            let matchesDateRange = true
            if (filters.startDate || filters.endDate) {
                const userDate = new Date(user.createdAt)
                if (filters.startDate && userDate < filters.startDate) matchesDateRange = false
                if (filters.endDate && userDate > filters.endDate) matchesDateRange = false
            }

            return (
                matchesName &&
                matchesEmail &&
                matchesPhone &&
                matchesStatus &&
                matchesRole &&
                matchesTerms &&
                matchesLocked &&
                matchesDateRange
            )
        })
    }, [data, filters])

    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentData = filteredData.slice(startIndex, endIndex)

    // Event handlers
    const handleApplyFilters = () => {
        setCurrentPage(1)
        fetchUsers()
    }

    const handleClearFilters = () => {
        setFilters({
            name: "",
            email: "",
            phone: "",
            status: "",
            role: "",
            termsAccepted: "",
            isLocked: "",
            startDate: null,
            endDate: null,
        })
        setCurrentPage(1)
    }

    const handleViewUser = async (user) => {
        const fullUser = await fetchSingleUser(user._id)
        setSelectedUser(fullUser || user)
        setShowViewDialog(true)
    }

    const handleEditUser = (user) => {
        setSelectedUser(user)
        setEditFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            status: user.status,
            role: user.role,
            isLocked: user.isLocked,
        })
        setShowEditDialog(true)
    }

    const handleUpdateUser = async () => {
        if (!selectedUser) return

        const success = await updateUser(selectedUser._id, editFormData)
        if (success) {
            setShowEditDialog(false)
            setSelectedUser(null)
            setEditFormData({})
        }
    }

    const handleDeleteUser = (userId) => {
        setDeleteUserId(userId)
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        if (!deleteUserId) return

        const success = await deleteUser(deleteUserId)
        if (success) {
            setShowDeleteDialog(false)
            setDeleteUserId(null)
        }
    }

    // Utility functions
    const getStatusBadge = (status) => {
        const variants = {
            active: "bg-green-100 text-green-800 border-green-200",
            inactive: "bg-red-100 text-red-800 border-red-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        }
        return variants[status] || "bg-gray-100 text-gray-800 border-gray-200"
    }

    const getRoleBadge = (role) => {
        const variants = {
            admin: "bg-purple-100 text-purple-800 border-purple-200",
            user: "bg-blue-100 text-blue-800 border-blue-200",
            moderator: "bg-orange-100 text-orange-800 border-orange-200",
        }
        return variants[role] || "bg-gray-100 text-gray-800 border-gray-200"
    }

    // Statistics
    const stats = useMemo(
        () => ({
            total: filteredData.length,
            active: filteredData.filter((u) => u.status === "active").length,
            verified: filteredData.filter((u) => u.emailVerification.isVerified).length,
            locked: filteredData.filter((u) => u.isLocked).length,
        }),
        [filteredData],
    )

    if (loading && data.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-2">
                    <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-lg">Loading users...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-1">Manage and monitor all users in your system</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2"
                    >
                        <Filter className="h-4 w-4" />
                        <span>Filters</span>
                        {showFilters && <X className="h-4 w-4 ml-1" />}
                    </Button>
                    <Button onClick={fetchUsers} className="flex items-center space-x-2">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <UserCheck className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Verified Users</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.verified}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Shield className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Locked Users</p>
                                <p className="text-2xl font-bold text-red-600">{stats.locked}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <Lock className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Advanced Filters</span>
                            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Search by name..."
                                    value={filters.name}
                                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    placeholder="Search by email..."
                                    value={filters.email}
                                    onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    placeholder="Search by phone..."
                                    value={filters.phone}
                                    onChange={(e) => setFilters({ ...filters, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={filters.role} onValueChange={(value) => setFilters({ ...filters, role: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="moderator">Moderator</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="terms">Terms Accepted</Label>
                                <Select
                                    value={filters.termsAccepted}
                                    onValueChange={(value) => setFilters({ ...filters, termsAccepted: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select terms status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="true">Accepted</SelectItem>
                                        <SelectItem value="false">Not Accepted</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="locked">Account Status</Label>
                                <Select value={filters.isLocked} onValueChange={(value) => setFilters({ ...filters, isLocked: value })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select account status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="false">Unlocked</SelectItem>
                                        <SelectItem value="true">Locked</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !filters.startDate && "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.startDate ? format(filters.startDate, "PPP") : "Pick start date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.startDate}
                                            onSelect={(date) => setFilters({ ...filters, startDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !filters.endDate && "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {filters.endDate ? format(filters.endDate, "PPP") : "Pick end date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={filters.endDate}
                                            onSelect={(date) => setFilters({ ...filters, endDate: date })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center space-x-3">
                                <Button onClick={handleApplyFilters} className="flex items-center space-x-2">
                                    <Search className="h-4 w-4" />
                                    <span>Apply Filters</span>
                                </Button>
                                <Button variant="outline" onClick={handleClearFilters}>
                                    Clear All
                                </Button>
                            </div>
                            <p className="text-sm text-gray-600">{filteredData.length} users match your criteria</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                        <p className="text-red-800 flex items-center">
                            <X className="h-4 w-4 mr-2" />
                            {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Table Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(Number.parseInt(value))
                            setCurrentPage(1)
                        }}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">entries</span>
                </div>

                <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                </div>
            </div>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">User</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Verification</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Terms</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="w-[120px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentData.map((user) => (
                                <TableRow key={user._id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <img
                                                src={user.profileImage.url || "/placeholder.svg?height=40&width=40"}
                                                alt={user.name}
                                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-[150px]">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm space-y-1">
                                            <div className="truncate max-w-[150px]">{user.email}</div>
                                            {user.phone && <div className="text-gray-500">{user.phone}</div>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    user.emailVerification.isVerified
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : "bg-red-50 text-red-700 border-red-200"
                                                }
                                            >
                                                Email: {user.emailVerification.isVerified ? "Verified" : "Unverified"}
                                            </Badge>
                                            {user.phone && (
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        user.phoneNumber.isVerified
                                                            ? "bg-green-50 text-green-700 border-green-200"
                                                            : "bg-red-50 text-red-700 border-red-200"
                                                    }
                                                >
                                                    Phone: {user.phoneNumber.isVerified ? "Verified" : "Unverified"}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col space-y-1">
                                            <Badge variant="outline" className={getStatusBadge(user.status)}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </Badge>
                                            {user.isLocked && (
                                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                                    <Lock className="h-3 w-3 mr-1" />
                                                    Locked
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={getRoleBadge(user.role)}>
                                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                user.termsAccepted
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                            }
                                        >
                                            {user.termsAccepted ? "Accepted" : "Not Accepted"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-500">{format(new Date(user.createdAt), "MMM dd, yyyy")}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)} className="h-8 w-8 p-0">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} className="h-8 w-8 p-0">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteUser(user._id)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {currentData.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No users found matching your criteria</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search terms</p>
                    </div>
                )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNumber
                                if (totalPages <= 5) {
                                    pageNumber = i + 1
                                } else if (currentPage <= 3) {
                                    pageNumber = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i
                                } else {
                                    pageNumber = currentPage - 2 + i
                                }

                                return (
                                    <PaginationItem key={pageNumber}>
                                        <PaginationLink
                                            onClick={() => setCurrentPage(pageNumber)}
                                            isActive={currentPage === pageNumber}
                                            className="cursor-pointer"
                                        >
                                            {pageNumber}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            })}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            {/* View User Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <img
                                    src={selectedUser.profileImage.url || "/placeholder.svg?height=64&width=64"}
                                    alt={selectedUser.name}
                                    className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                                    <p className="text-gray-600">{selectedUser.email}</p>
                                    {selectedUser.phone && <p className="text-gray-600">{selectedUser.phone}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                                    <Badge className={getStatusBadge(selectedUser.status)}>
                                        {selectedUser.status.charAt(0).toUpperCase() + selectedUser.status.slice(1)}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Role</Label>
                                    <Badge className={getRoleBadge(selectedUser.role)}>
                                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Terms Accepted</Label>
                                    <Badge
                                        className={selectedUser.termsAccepted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                    >
                                        {selectedUser.termsAccepted ? "Yes" : "No"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                                    <Badge className={selectedUser.isLocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                                        {selectedUser.isLocked ? "Locked" : "Unlocked"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Email Verification</Label>
                                    <Badge
                                        className={
                                            selectedUser.emailVerification.isVerified
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }
                                    >
                                        {selectedUser.emailVerification.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Phone Verification</Label>
                                    <Badge
                                        className={
                                            selectedUser.phoneNumber.isVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                        }
                                    >
                                        {selectedUser.phoneNumber.isVerified ? "Verified" : "Unverified"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Google Auth</Label>
                                    <Badge
                                        className={selectedUser.isGoogleAuth ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                                    >
                                        {selectedUser.isGoogleAuth ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Phone Auth</Label>
                                    <Badge
                                        className={selectedUser.isPhoneAuth ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}
                                    >
                                        {selectedUser.isPhoneAuth ? "Enabled" : "Disabled"}
                                    </Badge>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Created At</Label>
                                    <p className="text-sm">{format(new Date(selectedUser.createdAt), "PPP pp")}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Updated At</Label>
                                    <p className="text-sm">{format(new Date(selectedUser.updatedAt), "PPP pp")}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user information and settings.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editFormData.name || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editFormData.email || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone</Label>
                            <Input
                                id="edit-phone"
                                value={editFormData.phone || ""}
                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-status">Status</Label>
                            <Select
                                value={editFormData.status || "all"}
                                onValueChange={(value) =>
                                    setEditFormData({ ...editFormData, status: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={editFormData.role || "all"}
                                onValueChange={(value) =>
                                    setEditFormData({ ...editFormData, role: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-locked">Account Status</Label>
                            <Select
                                value={editFormData.isLocked?.toString() || "false"}
                                onValueChange={(value) => setEditFormData({ ...editFormData, isLocked: value === "true" })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select account status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="false">Unlocked</SelectItem>
                                    <SelectItem value="true">Locked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateUser}>Update User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone and will permanently remove all
                            user data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default UserManagement
