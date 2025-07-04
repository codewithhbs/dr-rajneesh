'use client'

import { API_ENDPOINT } from '@/constant/url'
import React, { useState } from 'react'
import axios, { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Lock, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react'

type Step = 'request' | 'verify' | 'success'

interface FormData {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}

const ForgotPasswordPage = () => {
  const [currentStep, setCurrentStep] = useState<Step>('request')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear errors when user starts typing
    if (error) setError('')
    if (message) setMessage('')
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email) {
      setError('Email is required')
      return
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post(`${API_ENDPOINT}/user/request-password-reset`, {
        email: formData.email
      })

      if (response.data.success) {
        setMessage(response.data.message)
        setCurrentStep('verify')
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 429) {
          setError('Please wait before requesting another password reset');
        } else {
          setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.otp || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required')
      return
    }

    if (formData.otp.length !== 6) {
      setError('OTP must be 6 digits')
      return
    }

    if (!validatePassword(formData.newPassword)) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await axios.post(`${API_ENDPOINT}/user/verify-password-reset`, {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      })

      if (response.data.success) {
        setMessage(response.data.message)
        setCurrentStep('success')
      }
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.')
      } else {
         setError('Invalid or expired OTP. Please try again.');
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setMessage('')
    setCurrentStep('request')
  }

  const renderRequestStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
        <p className="text-gray-600">
          Enter your email address and we&#39;ll send you an OTP to reset your password.
        </p>
      </div>

      <form onSubmit={handleRequestReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="h-12"
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-12"
          disabled={loading}
        >
          {loading ? 'Sending OTP...' : 'Send Reset OTP'}
        </Button>
      </form>
    </div>
  )

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
        <p className="text-gray-600">
          Enter the 6-digit OTP sent to <span className="font-medium">{formData.email}</span> and create a new password.
        </p>
      </div>

      <form onSubmit={handleVerifyReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">OTP Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit OTP"
            value={formData.otp}
            onChange={(e) => handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-12 text-center text-lg tracking-widest"
            maxLength={6}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              className="h-12 pr-10"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="h-12 pr-10"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            className="w-full h-12"
            disabled={loading}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full h-12"
            onClick={() => setCurrentStep('request')}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Email
          </Button>
        </div>
      </form>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Password Reset Successful!</h1>
          <p className="text-gray-600">
            Your password has been successfully reset. You can now login with your new password.
          </p>
        </div>
      </div>

      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Button
          className="w-full h-12"
          onClick={() => {
            // Navigate to login page
            window.location.href = '/login'
          }}
        >
          Go to Login
        </Button>

        <Button
          variant="ghost"
          className="w-full h-12"
          onClick={resetForm}
        >
          Reset Another Password
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-600 mx-1"></div>
              <div className={`w-2 h-2 rounded-full mx-1 ${currentStep === 'verify' || currentStep === 'success' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`w-2 h-2 rounded-full mx-1 ${currentStep === 'success' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep === 'request' && renderRequestStep()}
            {currentStep === 'verify' && renderVerifyStep()}
            {currentStep === 'success' && renderSuccessStep()}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage