import useAdminProfile from '@/hooks/admin'
import axiosInstance from '@/lib/axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
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
  Clock
} from 'lucide-react'

const AdminProfile = () => {
  const { profile, loading, error, refetch } = useAdminProfile()
  const navigate = useNavigate()
  
  // State for profile update
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [profileLoading, setProfileLoading] = useState(false)

  // State for password change
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Initialize profile data when profile loads
  React.useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])


  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out admin...')
      const response = await axiosInstance.get('/admin/logout')
      console.log('✅ Logout successful:', response.data)
      
      toast.success('Logged out successfully!')
      

      localStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminToken')
      

      navigate('/admin/login', { replace: true })
      
    } catch (error) {
      console.error('❌ Logout failed:', error)
      toast.error(error.response?.data?.message || 'Logout failed')
    }
  }

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setProfileLoading(true)
      console.log('📝 Updating admin profile...', profileData)
      
      const response = await axiosInstance.put('/admin/update-profile', profileData)
      console.log('✅ Profile updated successfully:', response.data)
      
      toast.success('Profile updated successfully!')
      setIsEditingProfile(false)
      refetch() // Refresh profile data
      
    } catch (error) {
      console.error('❌ Profile update failed:', error)
      toast.error(error.response?.data?.message || 'Profile update failed')
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long!')
      return
    }

    try {
      setPasswordLoading(true)
      console.log('🔐 Changing admin password...')
      
      const response = await axiosInstance.put('/admin/change-password', {
        currentPassword: passwordData.currentPassword,
        confirmNewPassword:passwordData.confirmPassword,
        newPassword: passwordData.newPassword
      })
      
      console.log('✅ Password changed successfully:', response.data)
      toast.success('Password changed successfully! Login with new password')
      
      // Reset form and close dialog
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setIsPasswordDialogOpen(false)
      handleLogout()
    } catch (error) {
      console.error('❌ Password change failed:', error)
      toast.error(error.response?.data?.message || 'Password change failed')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle input changes
  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordInputChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            Admin Profile
          </h1>
          <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
        </div>
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src={profile?.profileImage?.url} alt={profile?.name} />
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl">{profile?.name || 'Admin User'}</CardTitle>
            <CardDescription className="flex items-center justify-center">
              <Mail className="w-4 h-4 mr-2" />
              {profile?.email}
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary" className="w-fit">
                <Shield className="w-3 h-3 mr-1" />
                {profile?.role?.toUpperCase() || 'ADMIN'}
              </Badge>
              <Badge variant={profile?.status === 'active' ? 'default' : 'destructive'} className="w-fit">
                {profile?.status?.toUpperCase() || 'ACTIVE'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-3 text-slate-500" />
                <span>{profile?.phone || 'Not provided'}</span>
                {profile?.phoneNumber?.isVerified ? (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 ml-2 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-3 text-slate-500" />
                <span>Email Verified</span>
                {profile?.emailVerification?.isVerified ? (
                  <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 ml-2 text-red-500" />
                )}
              </div>

              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-3 text-slate-500" />
                <span>Joined {new Date(profile?.createdAt).toLocaleDateString()}</span>
              </div>

              {profile?.lastLoginAt && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-3 text-slate-500" />
                  <span>Last login {new Date(profile.lastLoginAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {/* Auth Method Badges */}
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-slate-700">Authentication Methods</h4>
              <div className="flex flex-wrap gap-2">
                {profile?.isGoogleAuth && (
                  <Badge variant="outline">
                    <Globe className="w-3 h-3 mr-1" />
                    Google
                  </Badge>
                )}
                {profile?.isPhoneAuth && (
                  <Badge variant="outline">
                    <Smartphone className="w-3 h-3 mr-1" />
                    Phone
                  </Badge>
                )}
                {!profile?.isGoogleAuth && !profile?.isPhoneAuth && (
                  <Badge variant="outline">
                    <Mail className="w-3 h-3 mr-1" />
                    Email
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details & Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Profile Information
              </CardTitle>
              <div className="flex gap-2">
                {!isEditingProfile ? (
                  <Button 
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline"
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
                    >
                      {profileLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save Changes
                    </Button>
                    <Button 
                      onClick={() => setIsEditingProfile(false)}
                      variant="outline"
                      size="sm"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditingProfile ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleProfileInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md">{profile?.name || 'Not provided'}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditingProfile ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileInputChange('email', e.target.value)}
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md flex items-center">
                    {profile?.email || 'Not provided'}
                    {profile?.emailVerification?.isVerified && (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditingProfile ? (
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleProfileInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-md flex items-center">
                    {profile?.phone || 'Not provided'}
                    {profile?.phoneNumber?.isVerified ? (
                      <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 ml-2 text-red-500" />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="p-3 bg-slate-50 rounded-md">
                  <Badge variant={profile?.status === 'active' ? 'default' : 'destructive'}>
                    {profile?.status?.toUpperCase() || 'ACTIVE'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Security Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Security Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Two-Factor Authentication</Label>
                  <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-600">
                    Not configured
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Last IP Address</Label>
                  <div className="p-3 bg-slate-50 rounded-md text-sm">
                    {profile?.ipAddress || 'Unknown'}
                  </div>
                </div>
              </div>

              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('current')}
                        >
                          {showPasswords.current ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          {showPasswords.new ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          {showPasswords.confirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsPasswordDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handlePasswordChange}
                      disabled={passwordLoading}
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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Additional information about your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account ID</Label>
                <div className="p-3 bg-slate-50 rounded-md text-sm font-mono">
                  {profile?.id || profile?._id}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">User Agent</Label>
                <div className="p-3 bg-slate-50 rounded-md text-sm truncate">
                  {profile?.userAgent || 'Unknown'}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Terms Accepted</Label>
                <div className="p-3 bg-slate-50 rounded-md">
                  {profile?.termsAccepted ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Accepted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-red-600">
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
  )
}

export default AdminProfile