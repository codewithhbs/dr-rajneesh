"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MessageAlert } from "@/components/auth/message-alert"
import { BrandingSection } from "@/components/auth/branding-section"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { PhoneVerifyForm } from "@/components/auth/phone-verify-form"
import { OTPVerifyForm } from "@/components/auth/otp-verify-form"
import axios, { AxiosError } from "axios"
import { API_ENDPOINT } from "@/constant/url"
import { useAuth } from "@/context/authContext/auth"

interface ApiError {
  message: string
  errors?: Record<string, string[]>
  code?: string
}

interface AuthResponse {
  success: boolean
  message: string
  data?: unknown
  case?: string
  token?: string
  user?: unknown
}

interface OTPResponse {
  success: boolean
  message: string
  sessionId?: string
}

const AuthSystem = () => {
  const { isAuthenticated, setToken } = useAuth()
  const [currentView, setCurrentView] = useState("login")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [ServerMessage, setServerMessage] = useState('')
  const [sessionId, setSessionId] = useState<string>("")
  const [lastRoute] = useState("/")

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    otp: "",
    termsAccepted: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState({
    type: "" as "success" | "error" | "",
    text: ""
  })

  // Valid steps for URL query
  const validSteps = ["login", "register", "phone-verify", "otp-verify"]

  // Get step from URL query parameters
  const getStepFromURL = (): string => {
    if (typeof window === "undefined") return "login"

    const urlParams = new URLSearchParams(window.location.search)
    const step = urlParams.get("step")

    return validSteps.includes(step || "") ? step! : "login"
  }


  // Update URL with current step
  const updateURLWithStep = (step: string) => {
    if (typeof window === "undefined" || !validSteps.includes(step)) return

    const url = new URL(window.location.href)
    url.searchParams.set("step", step)

    // Update URL without triggering page reload
    window.history.replaceState({}, "", url.toString())
  }

const getMessageFromURL = () => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message') || '';
    setServerMessage(message);
  };

  useEffect(() => {
    getMessageFromURL();
  }, []);

useEffect(() => {
  if (ServerMessage) {
    alert(ServerMessage);
    
    const url = new URL(window.location.href);
    url.searchParams.delete('message');
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
}, [ServerMessage]);





  // Initialize step from URL on component mount
  useEffect(() => {
    const stepFromURL = getStepFromURL()
    setCurrentView(stepFromURL)
  }, [])



  // Update URL whenever currentView changes
  useEffect(() => {
    updateURLWithStep(currentView)
  }, [currentView])

  // Redirect authenticated users
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      window.location.href = "/"
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const stepFromURL = getStepFromURL()
      setCurrentView(stepFromURL)
      // Clear messages and errors when navigating
      setMessage({ type: "", text: "" })
      setErrors({})
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [getStepFromURL])

  // Error handling utility
  const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>

      // Handle validation errors
      if (axiosError.response?.status === 422 && axiosError.response.data?.errors) {
        const validationErrors = axiosError.response.data.errors
        const newErrors: Record<string, string> = {}

        Object.entries(validationErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            newErrors[field] = messages[0]
          }
        })

        setErrors(newErrors)
        return "Please fix the validation errors below"
      }

      // Handle other HTTP errors
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message
      }

      // Handle network errors
      if (axiosError.code === 'ECONNABORTED') {
        return "Request timeout. Please try again."
      }

      if (axiosError.code === 'ERR_NETWORK') {
        return "Network error. Please check your connection."
      }

      // Handle HTTP status codes
      switch (axiosError.response?.status) {
        case 400:
          return "Invalid request. Please check your input."
        case 401:
          return "Invalid credentials. Please try again."
        case 403:
          return "Access forbidden. Please contact support."
        case 404:
          return "Service not found. Please contact support."
        case 409:
          return "Account already exists with this email."
        case 429:
          return "Too many requests. Please wait before trying again."
        case 500:
          return "Server error. Please try again later."
        case 503:
          return "Service temporarily unavailable. Please try again later."
        default:
          return "An unexpected error occurred. Please try again."
      }
    }

    return "An unexpected error occurred. Please try again."
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear field-specific errors
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Clear general message when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentView === "register") {
      if (!formData.name.trim()) {
        newErrors.name = "Name is required"
      } else if (formData.name.trim().length < 2) {
        newErrors.name = "Name must be at least 2 characters"
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }

      if (!formData.password) {
        newErrors.password = "Password is required"
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = "Password must contain uppercase, lowercase, and number"
      }

      if (!formData.termsAccepted) {
        newErrors.termsAccepted = "You must accept the terms and conditions"
      }
    } else if (currentView === "login") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address"
      }

      if (!formData.password) {
        newErrors.password = "Password is required"
      }
    } else if (currentView === "phone-verify") {
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone number is required"
      } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = "Please enter a valid phone number"
      }
    } else if (currentView === "otp-verify") {
      if (!formData.otp.trim()) {
        newErrors.otp = "OTP is required"
      } else if (!/^\d{6}$/.test(formData.otp)) {
        newErrors.otp = "OTP must be 6 digits"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (): Promise<void> => {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_ENDPOINT}/user/login-user`,
        {
          email: formData.email,
          password: formData.password,
        },
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const { success, token, user, case: loginCase, message } = response.data

      if (!success) {
        throw new Error(message || "Login failed")
      }

      if (loginCase === "verify-otp") {
        setCurrentView("otp-verify")
        setMessage({ type: "success", text: "Please verify OTP sent to your Email." })
        return
      }

      if (token) {
        setToken(token)
      }

      if (user) {
        localStorage.setItem("userData", JSON.stringify(user))

      }

      setMessage({ type: "success", text: "Login successful! Redirecting..." })

      setTimeout(() => {
        window.location.href = lastRoute
      }, 1500)

    } catch (error) {
      throw error
    }
  }


  const handleRegister = async (): Promise<void> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_ENDPOINT}/user/register`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        termsAccepted: formData.termsAccepted
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Registration successful! Please check your email to verify your account."
        })

        // Clear form data
        setFormData(prev => ({ ...prev, password: "", name: "" }))

        setTimeout(() => {
          setCurrentView("otp-verify")
          setMessage({ type: "", text: "" })
        }, 3000)
      } else {
        throw new Error(response.data.message || "Registration failed")
      }
    } catch (error) {
      throw error
    }
  }

  const handlePhoneVerify = async (): Promise<void> => {
    try {
      const response = await axios.post<OTPResponse>(`${API_ENDPOINT}/auth/send-otp`, {
        phone: formData.phone
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setSessionId(response.data.sessionId || "")
        setMessage({ type: "success", text: "OTP sent successfully!" })
        setCurrentView("otp-verify")
        setCountdown(120) // 2 minutes countdown
      } else {
        throw new Error(response.data.message || "Failed to send OTP")
      }
    } catch (error) {
      throw error
    }
  }

  const handleOTPVerify = async (): Promise<void> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_ENDPOINT}/user/verify-email-otp`, {
        email: formData.email,
        otp: formData.otp,
        sessionId: sessionId
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success && response.data.token) {
        // Store token and user data
        setToken(response.data.token)
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user))
        }

        // Update auth context
        // authLogin(response.data.user, response.data.token)

        setMessage({ type: "success", text: "Email verified! Redirecting..." })

        setTimeout(() => {
          window.location.href = lastRoute
        }, 1500)
      } else {
        throw new Error(response.data.message || "OTP verification failed")
      }
    } catch (error) {
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setMessage({ type: "", text: "" })
    setErrors({})

    try {
      switch (currentView) {
        case "login":
          await handleLogin()
          break
        case "register":
          await handleRegister()
          break
        case "phone-verify":
          await handlePhoneVerify()
          break
        case "otp-verify":
          await handleOTPVerify()
          break
        default:
          throw new Error("Invalid form state")
      }
    } catch (error) {
      const errorMessage = handleApiError(error)
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async (): Promise<void> => {
    setIsLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const response = await axios.get<{ success: boolean; redirect: string }>(`${API_ENDPOINT}/user/auth/google`, {
        timeout: 10000
      })

      if (response.data.success && response.data.redirect) {
        window.location.href = response.data.redirect
      } else {
        throw new Error("Failed to initiate Google authentication")
      }
    } catch (error) {
      const errorMessage = handleApiError(error)
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async (): Promise<void> => {
    if (countdown > 0) return

    setIsLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const response = await axios.post<OTPResponse>(`${API_ENDPOINT}/user/resend-email-otp`, {
        email: formData.email,
        sessionId: sessionId
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setSessionId(sessionId)
        setMessage({ type: "success", text: "OTP resent successfully!" })
        setCountdown(120) // Reset countdown
      } else {
        throw new Error(response.data.message || "Failed to resend OTP")
      }
    } catch (error) {
      const errorMessage = handleApiError(error)
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  // Updated navigation handlers to use setCurrentView (which will automatically update URL)
  const navigateToStep = (step: string) => {
    if (validSteps.includes(step)) {
      setCurrentView(step)
      setMessage({ type: "", text: "" })
      setErrors({})
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
            onSwitchToRegister={() => navigateToStep("register")}
            onSwitchToPhone={() => navigateToStep("phone-verify")}
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
            onSwitchToLogin={() => navigateToStep("login")}
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
            onBackToLogin={() => navigateToStep("login")}
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
            onBackToPhone={() => navigateToStep("phone-verify")}
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