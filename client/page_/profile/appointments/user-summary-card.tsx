"use client"
import React, { useState } from "react"
import { format } from "date-fns"
import { User, X, Edit, Mail, Phone, CreditCard, Loader2, Check } from "lucide-react"
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
      const response = await fetch('http://localhost:8000/api/v1/user/update-profile', {
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
        
        // Check if OTP verification is needed
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
            window.location.reload() // Refresh to show updated data
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
      const response = await fetch('http://localhost:8000/api/v1/user/verify-otp-update', {
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
    updateProfile() // Resend OTP by calling update profile again
  }

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg">
        <CardContent className="p-4 sm:p-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-5 w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 flex items-center justify-center">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">Loading User Profile</h3>
            <p className="text-slate-600 text-sm">Please wait while we load your information.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 lg:h-32 lg:w-32 border-4 border-white shadow-lg">
                {user.profileImage?.url ? (
                  <img
                    src={user.profileImage.url}
                    alt={user.name || 'User'}
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg sm:text-xl font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1.5 sm:p-2 border-4 border-white shadow-lg">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </div>
            
            {/* User Info Section */}
            <div className="flex-1 text-center lg:text-left space-y-3 sm:space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">{user.name || 'Unknown User'}</h2>
                <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Email: {user.email || 'No email provided'}</p>
                {user.phone && <p className="text-gray-600 text-sm sm:text-base">Mobile: {user.phone}</p>}
                {user.aadhhar && <p className="text-gray-600 text-sm sm:text-base">Aadhaar: {user.aadhhar}</p>}
              </div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm">
                  Member since {user.createdAt ? format(new Date(user.createdAt), "MMM yyyy") : 'Unknown'}
                </Badge>
                <Badge 
                  onClick={() => setIsModalOpen(true)} 
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer text-xs sm:text-sm"
                >
                  Update Profile
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Update Profile
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  resetModal()
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Message */}
              {message.text && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === 'success' ? 'bg-green-100 text-green-800' :
                  message.type === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                  {showOtpFields.email && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={otpData.emailOtp}
                        onChange={(e) => handleOtpChange('emailOtp', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter email OTP"
                        maxLength={6}
                      />
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                  {showOtpFields.phone && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={otpData.phoneOtp}
                        onChange={(e) => handleOtpChange('phoneOtp', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Enter phone OTP"
                        maxLength={6}
                      />
                    </div>
                  )}
                </div>

                {/* Aadhaar */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Aadhaar Number
                  </label>
                  <input
                    type="text"
                    value={formData.aadhhar}
                    onChange={(e) => handleInputChange('aadhhar', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your Aadhaar number"
                    maxLength={12}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {(showOtpFields.email || showOtpFields.phone) ? (
                  <>
                    <button
                      onClick={verifyOtp}
                      disabled={otpLoading.email || otpLoading.phone}
                      className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {(otpLoading.email || otpLoading.phone) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Verify OTP
                    </button>
                    <button
                      onClick={resendOtp}
                      disabled={isLoading}
                      className="flex-1 bg-gray-600 text-white py-2.5 px-4 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Resend OTP
                    </button>
                  </>
                ) : (
                  <button
                    onClick={updateProfile}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                    Update Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserSummaryCard