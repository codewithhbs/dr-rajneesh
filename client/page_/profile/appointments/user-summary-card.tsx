"use client"
import React, { useState } from "react"
import { format } from "date-fns"
import { User, X, Edit, Mail, Phone, CreditCard, Loader2, Check, Calendar, Shield, MapPin } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/context/authContext/auth"

interface UserType {
  _id: string
  name?: string
  email?: string
  phone?: string
  aadhhar?: string
  profileImage?: {
    url?: string
    publicId?: string
  }
  createdAt?: string
}

interface UserSummaryCardProps {
  user?: UserType
}

const UserSummaryCard: React.FC<UserSummaryCardProps> = ({ user }) => {
  const { token } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    aadhhar: user?.aadhhar || ''
  })
  const [otpData, setOtpData] = useState({
    emailOtp: '',
    phoneOtp: ''
  })
  const [showOtpFields, setShowOtpFields] = useState({
    email: false,
    phone: false
  })
  const [otpLoading, setOtpLoading] = useState({
    email: false,
    phone: false
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  const resetModal = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      aadhhar: user?.aadhhar || ''
    })
    setOtpData({ emailOtp: '', phoneOtp: '' })
    setShowOtpFields({ email: false, phone: false })
    setMessage({ type: '', text: '' })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage({ type: '', text: '' })
  }

  const handleOtpChange = (field: 'emailOtp' | 'phoneOtp', value: string) => {
    setOtpData(prev => ({ ...prev, [field]: value }))
  }

  const updateProfile = async () => {
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('https://api.dikshantias.in/api/v1/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email !== user?.email ? formData.email : undefined,
          phone: formData.phone !== user?.phone ? formData.phone : undefined,
          aadhhar: formData.aadhhar
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        
        const emailChanged = formData.email !== user?.email
        const phoneChanged = formData.phone !== user?.phone
        
        if (emailChanged || phoneChanged) {
          setShowOtpFields({
            email: emailChanged,
            phone: phoneChanged
          })
          setMessage({ 
            type: 'info', 
            text: 'OTP sent for verification. Please check your email/phone.' 
          })
        } else {
          setTimeout(() => {
            setIsModalOpen(false)
            resetModal()
            window.location.reload()
          }, 1500)
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Update failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOtp = async () => {
    setOtpLoading({ email: true, phone: true })
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('https://api.dikshantias.in/api/v1/user/verify-otp-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otp: showOtpFields.email ? otpData.emailOtp : otpData.phoneOtp,
          email: showOtpFields.email ? formData.email : undefined,
          number: showOtpFields.phone ? formData.phone : undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Verification successful!' })
        setTimeout(() => {
          setIsModalOpen(false)
          resetModal()
          window.location.reload()
        }, 1500)
      } else {
        setMessage({ type: 'error', text: data.message || 'Verification failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setOtpLoading({ email: false, phone: false })
    }
  }

  const resendOtp = async () => {
    updateProfile()
  }

  if (!user) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Profile</h3>
            <p className="text-gray-600 text-sm">Please wait...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-blue-100">
                {user.profileImage?.url ? (
                  <img
                    src={user.profileImage.url}
                    alt={user.name || 'User'}
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-blue-50 text-blue-600 text-xl font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {user.name || 'Unknown User'}
                </h3>
                <Badge variant="outline" className="text-xs font-normal">
                  Patient
                </Badge>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Edit profile"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="text-sm text-gray-900 truncate">
                  {user.email || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <Phone className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="text-sm text-gray-900 truncate">
                  {user.phone || 'Not provided'}
                </p>
              </div>
            </div>

            {user.aadhhar && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-md">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Aadhaar</p>
                  <p className="text-sm text-gray-900 font-mono">
                    {user.aadhhar}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-md">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">Member Since</p>
                <p className="text-sm text-gray-900">
                  {user.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Edit Profile</h3>
                  <p className="text-sm text-gray-500">Update your personal information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetModal()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Alert Message */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                  message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                  <div className={`p-1 rounded-full ${
                    message.type === 'success' ? 'bg-green-100' :
                    message.type === 'error' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    {message.type === 'success' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </div>
                  <p className="text-sm flex-1">{message.text}</p>
                </div>
              )}

              {/* Form */}
              <div className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  {showOtpFields.email && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email OTP
                      </label>
                      <input
                        type="text"
                        value={otpData.emailOtp}
                        onChange={(e) => handleOtpChange('emailOtp', e.target.value)}
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center text-lg tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  {showOtpFields.phone && (
                    <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone OTP
                      </label>
                      <input
                        type="text"
                        value={otpData.phoneOtp}
                        onChange={(e) => handleOtpChange('phoneOtp', e.target.value)}
                        className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-center text-lg tracking-widest"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                  )}
                </div>

                {/* Aadhaar Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhaar Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.aadhhar}
                      onChange={(e) => handleInputChange('aadhhar', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                      placeholder="1234 5678 9012"
                      maxLength={12}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {(showOtpFields.email || showOtpFields.phone) ? (
                <div className="flex gap-3">
                  <button
                    onClick={verifyOtp}
                    disabled={otpLoading.email || otpLoading.phone}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                  >
                    {(otpLoading.email || otpLoading.phone) ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Verify OTP
                      </>
                    )}
                  </button>
                  <button
                    onClick={resendOtp}
                    disabled={isLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    Resend
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsModalOpen(false)
                      resetModal()
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProfile}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserSummaryCard