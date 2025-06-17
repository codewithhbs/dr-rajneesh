"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/context/authContext/auth"
import { authAPI } from "@/lib/auth-api"

import { MessageAlert } from "@/components/auth/message-alert"
import { BrandingSection } from "@/components/auth/branding-section"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { PhoneVerifyForm } from "@/components/auth/phone-verify-form"
import { OTPVerifyForm } from "@/components/auth/otp-verify-form"

const AuthSystem = () => {
  const { isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [lastRoute] = useState("/")
  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    otp: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState({ type: "" as "success" | "error" | "", text: "" })

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {

      window.location.href = "/";
      setIsLoading(false);
    }
  }, [isAuthenticated]);


  // OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (currentView === "register") {
      if (!formData.name.trim()) newErrors.name = "Name is required"
      if (!formData.email.trim()) newErrors.email = "Email is required"
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"
      if (!formData.password) newErrors.password = "Password is required"
      else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"

    } else if (currentView === "login") {
      if (!formData.email.trim()) newErrors.email = "Email is required"
      if (!formData.password) newErrors.password = "Password is required"
    } else if (currentView === "phone-verify") {
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
      else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits"
    } else if (currentView === "otp-verify") {
      if (!formData.otp.trim()) newErrors.otp = "OTP is required"
      else if (!/^\d{6}$/.test(formData.otp)) newErrors.otp = "OTP must be 6 digits"
    }
    console.log("Errors",newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("i am d")
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setMessage({ type: "", text: "" })

    try {
      if (currentView === "login") {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setMessage({ type: "success", text: "Login successful! Redirecting..." })
        setTimeout(() => {
          window.location.href = lastRoute
        }, 1500)
      } else if (currentView === "register") {
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setMessage({ type: "success", text: "Registration successful! Please login." })
        setTimeout(() => setCurrentView("login"), 2000)
      } else if (currentView === "phone-verify") {
        const result = await authAPI.validatePhone(formData.phone)
        if (result.success) {
          setMessage({ type: "success", text: "OTP sent successfully!" })
          setCurrentView("otp-verify")
          setCountdown(60)
        } else {
          setMessage({ type: "error", text: result.message })
        }
      } else if (currentView === "otp-verify") {
        // Mock OTP verification
        if (formData.otp === "123456") {
          setMessage({ type: "success", text: "Phone verified! Redirecting..." })
          setTimeout(() => {
            window.location.href = lastRoute
          }, 1500)
        } else {
          setMessage({ type: "error", text: "Invalid OTP. Please try again." })
        }
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    try {
      const result = await authAPI.googleAuth()
      if (result.success) {
        window.location.href = result.redirect
      }
    } catch (error) {
      setMessage({ type: "error", text: "Google authentication failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    if (countdown > 0) return
    setIsLoading(true)
    try {
      setMessage({ type: "success", text: "OTP resent successfully!" })
      setCountdown(60)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to resend OTP" })
    } finally {
      setIsLoading(false)
    }
  }



  const renderCurrentForm = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginForm
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onGoogleAuth={handleGoogleAuth}
            onSwitchToRegister={() => setCurrentView("register")}
            onSwitchToPhone={() => setCurrentView("phone-verify")}
          />
        )
      case "register":
        return (
          <RegisterForm
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onGoogleAuth={handleGoogleAuth}
            onSwitchToLogin={() => setCurrentView("login")}
          />
        )
      case "phone-verify":
        return (
          <PhoneVerifyForm
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onBackToLogin={() => setCurrentView("login")}
          />
        )
      case "otp-verify":
        return (
          <OTPVerifyForm
            formData={formData}
            errors={errors}
            isLoading={isLoading}
            countdown={countdown}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onResendOTP={resendOTP}
            onBackToPhone={() => setCurrentView("phone-verify")}
          />
        )
      default:
        return null
    }
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <BrandingSection />

        {/* Right side - Auth Forms */}
        <div className="w-full">
          <Card className="border-none shadow-xl">
            <CardContent className="p-8 lg:p-12">

              {/* Message Display */}
              <MessageAlert type={message.type} text={message.text} />

              {/* Render Current Form */}
              {renderCurrentForm()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AuthSystem
