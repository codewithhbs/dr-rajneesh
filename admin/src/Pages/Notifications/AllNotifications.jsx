import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  Save,
  Loader2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { API_URL } from '@/constant/Urls'


// Create and Edit Modal Component
const CreateAndEditModel = ({ type = "create", onClose, open, data, onSuccess }) => {
  const [formData, setFormData] = useState({
    messages: '',
    position: '',
    expiredThis: '',
    status: 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (type === 'edit' && data) {
      setFormData({
        messages: data.messages || '',
        position: data.position || '',
        expiredThis: data.expiredThis ? new Date(data.expiredThis).toISOString().slice(0, 16) : '',
        status: data.status || 'active'
      })
    } else {
      setFormData({
        messages: '',
        position: '',
        expiredThis: '',
        status: 'active'
      })
    }
  }, [type, data, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload = {
        messages: formData.messages,
        position: parseInt(formData.position),
        expiredThis: formData.expiredThis ? new Date(formData.expiredThis) : new Date(),
        status: formData.status
      }

      const url = type === 'create' 
        ? `${API_URL}/add-notification`
        : `${API_URL}/update-notification/${data._id}`

      const response = await fetch(url, {
        method: type === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${type} notification`)
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {type === 'create' ? 'Create New Notification' : 'Edit Notification'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="messages">Message *</Label>
            <Textarea
              id="messages"
              value={formData.messages}
              onChange={(e) => handleChange('messages', e.target.value)}
              placeholder="Enter notification message..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                type="number"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                placeholder="0"
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiredThis">Expiration Date</Label>
            <Input
              id="expiredThis"
              type="date"
              value={formData.expiredThis}
              onChange={(e) => handleChange('expiredThis', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Leave empty to use default (24 hours from now)
            </p>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
           <Button
                type="submit"
                disabled={loading}
                className="px-6 py-4 rounded-md bg-gradient-to-r from-blue-800 to-sky-700 text-white font-semibold flex items-center gap-2 shadow-md hover:from-blue-900 hover:to-sky-800 transition"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                <Save className="h-5 w-5" />
                {type === 'create' ? 'Create' : 'Update'}
              </Button>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Main AllNotifications Component
const AllNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/get-notifications`)
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }
      const result = await response.json()
      setNotifications(result.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete notification
  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const response = await fetch(`${API_URL}/delete-notification/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }
      
      await fetchNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
    } finally {
      setDeletingId(null)
    }
  }

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.messages.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage)

  // Get status badge variant
  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
   <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 to-sky-700 text-white p-4 rounded-md shadow-md">
  {/* Left side */}
  <div className="flex items-center gap-3">
    <Bell className="h-8 w-8" />
    <div>
      <h1 className="text-3xl font-bold">Notifications</h1>
      <p className="text-white/80">Manage your system notifications</p>
    </div>
  </div>

  {/* Right side buttons */}
   <div className="flex gap-2">
            {/* Refresh Button */}
            <Button
              onClick={fetchNotifications}
              disabled={loading}
              className="bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold hover:from-green-500 hover:to-green-700 shadow-lg rounded px-5"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
  
            {/* Export Button */}
            <Button  onClick={() => setIsCreateModalOpen(true)} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold hover:from-yellow-500 hover:to-orange-600 shadow-lg rounded px-5">
              <Plus className="mr-2 h-4 w-4" />
              Add Notification
            </Button>
          </div>
    </div>


      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Notifications ({filteredNotifications.length})</span>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading notifications...</span>
            </div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create your first notification to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Notification
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
  {paginatedNotifications.map((notification) => (
    <div
      key={notification._id}
      className="border rounded-xl p-4 hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        {/* Notification Content */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="font-semibold text-sm text-slate-700">
              Position: {notification.position}
            </span>
            {getStatusBadge(notification.status)}
          </div>
          <p className="text-sm text-slate-800 mb-3 leading-relaxed">
            {notification.messages}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created: {formatDate(notification.createdAt)}
            </span>
            {notification.expiredThis && (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Expires: {formatDate(notification.expiredThis)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-200 text-white px-3 py-1 rounded flex items-center gap-1 transition"
            onClick={() => setEditingNotification(notification)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded shadow-sm transition"
            onClick={() => handleDelete(notification._id)}
            disabled={deletingId === notification._id}
          >
            {deletingId === notification._id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  ))}
</div>

          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredNotifications.length)} of{' '}
                {filteredNotifications.length} notifications
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateAndEditModel 
        type="create"
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchNotifications}
      />

      {/* Edit Modal */}
      {editingNotification && (
        <CreateAndEditModel 
          type="edit"
          open={!!editingNotification}
          data={editingNotification}
          onClose={() => setEditingNotification(null)}
          onSuccess={fetchNotifications}
        />
      )}
    </div>
  )
}

export default AllNotifications