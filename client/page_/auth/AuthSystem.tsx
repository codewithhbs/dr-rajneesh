"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
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

// ==================== TYPE DEFINITIONS ====================
type AuthView = "login" | "register" | "phone-verify" | "login-phone-otp" | "otp-verify"
type MessageType = "success" | "error" | ""

interface FormState {
  email: string
  password: string
  name: string
  phone: string
  otp: string
  termsAccepted: boolean
}

interface AuthState {
  currentView: AuthView
  isLoading: boolean
  countdown: number
  serverMessage: string
  sessionId: string
  flowType: "email" | "phone"
}

const AuthSystem = () => {
  const { isAuthenticated, setToken } = useAuth()
  const [lastRoute] = useState("/")

  // ==================== STATE MANAGEMENT ====================
  const [authState, setAuthState] = useState<AuthState>({
    currentView: "login",
    isLoading: false,
    countdown: 0,
    serverMessage: "",
    sessionId: "",
    flowType: "email",
  })

  const [formData, setFormData] = useState<FormState>({
    email: "",
    password: "",
    name: "",
    phone: "",
    otp: "",
    termsAccepted: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{
    type: MessageType
    text: string
  }>({
    type: "",
    text: "",
  })

  const validSteps: AuthView[] = ["login", "register", "phone-verify", "login-phone-otp", "otp-verify"]

  // ==================== URL MANAGEMENT ====================
  const getStepFromURL = useCallback((): AuthView => {
    if (typeof window === "undefined") return "login"
    const urlParams = new URLSearchParams(window.location.search)
    const step = urlParams.get("step") as AuthView
    return validSteps.includes(step) ? step : "login"
  }, [])

  const updateURLWithStep = useCallback((step: AuthView) => {
    if (typeof window === "undefined" || !validSteps.includes(step)) return
    const url = new URL(window.location.href)
    url.searchParams.set("step", step)
    window.history.replaceState({}, "", url.toString())
  }, [])

  const getMessageFromURL = useCallback(() => {
    if (typeof window === "undefined") return
    const urlParams = new URLSearchParams(window.location.search)
    const msg = urlParams.get("message") || ""
    if (msg) {
      setAuthState((prev) => ({ ...prev, serverMessage: msg }))
    }
  }, [])

  // ==================== EFFECTS ====================
  useEffect(() => {
    getMessageFromURL()
  }, [getMessageFromURL])

  useEffect(() => {
    if (authState.serverMessage) {
      alert(authState.serverMessage)
      const url = new URL(window.location.href)
      url.searchParams.delete("message")
      window.history.replaceState({}, document.title, url.pathname + url.search)
      setAuthState((prev) => ({ ...prev, serverMessage: "" }))
    }
  }, [authState.serverMessage])

  useEffect(() => {
    const stepFromURL = getStepFromURL()
    setAuthState((prev) => ({ ...prev, currentView: stepFromURL }))
  }, [getStepFromURL])

  useEffect(() => {
    updateURLWithStep(authState.currentView)
  }, [authState.currentView, updateURLWithStep])

  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      window.location.href = lastRoute
    }
  }, [isAuthenticated, lastRoute])

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (authState.countdown > 0) {
      timer = setTimeout(() => {
        setAuthState((prev) => ({ ...prev, countdown: prev.countdown - 1 }))
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [authState.countdown])

  // Browser back button handler
  useEffect(() => {
    const handlePopState = () => {
      const stepFromURL = getStepFromURL()
      setAuthState((prev) => ({ ...prev, currentView: stepFromURL }))
      setMessage({ type: "", text: "" })
      setErrors({})
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [getStepFromURL])

  // ==================== ERROR HANDLING ====================
  const handleApiError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>

      // Validation errors from 422
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

      // API error message
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message
      }

      // Network errors
      if (axiosError.code === "ECONNABORTED") return "Request timeout. Please try again."
      if (axiosError.code === "ERR_NETWORK") return "Network error. Please check your connection."

      // HTTP status codes
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

    if (error instanceof Error) {
      return error.message
    }

    return "An unexpected error occurred. Please try again."
  }

  // ==================== FORM HANDLERS ====================
  const handleInputChange = (field: keyof FormState, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    if (message.text) setMessage({ type: "", text: "" })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const { email, password, name, phone, otp, termsAccepted } = formData

    switch (authState.currentView) {
      case "login":
        if (!email.trim()) newErrors.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          newErrors.email = "Please enter a valid email address"
        if (!password) newErrors.password = "Password is required"
        break

      case "register":
        if (!name.trim()) newErrors.name = "Name is required"
        else if (name.trim().length < 2) newErrors.name = "Name must be at least 2 characters"

        if (!email.trim()) newErrors.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          newErrors.email = "Please enter a valid email address"

        if (!password) newErrors.password = "Password is required"
        else if (password.length < 8) newErrors.password = "Password must be at least 8 characters"
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=]).{8,}/.test(password))
          newErrors.password = "Password must contain uppercase, lowercase, number and special character"

        if (!phone.trim()) newErrors.phone = "Phone number is required"
        else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(phone.replace(/\s/g, "")))
          newErrors.phone = "Please enter a valid phone number"

        if (!termsAccepted) newErrors.termsAccepted = "You must accept the terms and conditions"
        break

      case "phone-verify":
      case "login-phone-otp":
        if (!phone.trim()) newErrors.phone = "Phone number is required"
        else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(phone.replace(/\s/g, "")))
          newErrors.phone = "Please enter a valid phone number"
        break

      case "otp-verify":
        if (!otp.trim()) newErrors.otp = "OTP is required"
        else if (!/^\d{6}$/.test(otp)) newErrors.otp = "OTP must be 6 digits"
        break

      default:
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ==================== AUTH HANDLERS ====================
  const handleLogin = async () => {
    try {
      const email = formData.email.trim().toLowerCase()
      const password = formData.password.trim()

      const response = await axios.post<AuthResponse>(
        `${API_ENDPOINT}/user/login-user`,
        { email, password },
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      )

      const { success, token, user, case: loginCase, message: resMessage } = response.data

      if (!success) throw new Error(resMessage || "Login failed")

      if (loginCase === "verify-otp") {
        setAuthState((prev) => ({
          ...prev,
          currentView: "otp-verify",
          flowType: "email",
        }))
        setMessage({ type: "success", text: "Please verify OTP sent to your Email." })
        return
      }

      if (token) setToken(token)
      if (user) localStorage.setItem("userData", JSON.stringify(user))

      setMessage({ type: "success", text: "Login successful! Redirecting..." })
      setTimeout(() => {
        window.location.href = lastRoute
      }, 1500)
    } catch (error) {
      throw error
    }
  }

const handleRegister = async () => {
  try {
    const sanitizedPhone = formData.phone
      .trim() // remove leading/trailing spaces
      .replace(/\s+/g, "") // remove all spaces
      .replace(/^\+91/, "") // remove +91 if present
      .replace(/^91(?=\d{10}$)/, ""); // remove 91 if user entered 919876543210

    const response = await axios.post<AuthResponse>(
      `${API_ENDPOINT}/user/register`,
      {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: sanitizedPhone,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
      },
      {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Registration failed");
    }

    if (response.data.sessionId) {
      setAuthState((prev) => ({
        ...prev,
        sessionId: response.data.sessionId || "",
      }));
    }

    setMessage({
      type: "success",
      text: "Registration successful! Please verify your email.",
    });

    setFormData((prev) => ({ ...prev, password: "" }));

    setTimeout(() => {
      setAuthState((prev) => ({
        ...prev,
        currentView: "otp-verify",
        flowType: "email",
      }));
      setMessage({ type: "", text: "" });
    }, 2000);
  } catch (error) {
    throw error;
  }
};

  const handleSendLoginOTP = async () => {
    try {
      const response = await axios.post<OTPResponse>(
        `${API_ENDPOINT}/user/login/send-otp`,
        { phone: formData.phone },
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      )

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to send OTP")
      }

      setAuthState((prev) => ({
        ...prev,
        sessionId: response.data.sessionId || "",
        currentView: "otp-verify",
        countdown: 120,
        flowType: "phone",
      }))
      setMessage({ type: "success", text: "OTP sent successfully to your phone!" })
    } catch (error) {
      setMessage({ type: "error", text: error.response.data.message })
      throw error
    }
  }

  const handleVerifyLoginOTP = async () => {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_ENDPOINT}/user/login/verify-otp`,
        {
          phone: formData.phone,
          otp: formData.otp,
          sessionId: authState.sessionId,
        },
        { timeout: 10000, headers: { "Content-Type": "application/json" } }
      )

      if (!response.data.success || !response.data.token) {
        throw new Error(response.data.message || "OTP verification failed")
      }

      setToken(response.data.token)
      if (response.data.user) localStorage.setItem("userData", JSON.stringify(response.data.user))

      setMessage({ type: "success", text: "Login successful! Redirecting..." })
      setTimeout(() => {
        window.location.href = lastRoute
      }, 1500)
    } catch (error) {
      throw error
    }
  }

  const handleResendOTP = async () => {
    if (authState.countdown > 0) return

    try {
      let endpoint = ""
      let payload: Record<string, string> = {}

      if (authState.flowType === "phone") {
        // Resend for phone login flow
        endpoint = `${API_ENDPOINT}/user/login/resend-otp`
        payload = { phone: formData.phone, sessionId: authState.sessionId }
      } else {
        // Resend for email registration flow
        endpoint = `${API_ENDPOINT}/user/resend-otp`
        payload = { email: formData.email, sessionId: authState.sessionId }
      }

      const response = await axios.post<OTPResponse>(endpoint, payload, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      })

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to resend OTP")
      }

      setAuthState((prev) => ({ ...prev, countdown: 120 }))
      setMessage({ type: "success", text: "OTP resent successfully!" })
    } catch (error) {
      throw error
    }
  }

  const handleOTPVerify = async () => {
    try {
      const endpoint =
        authState.flowType === "email"
          ? `${API_ENDPOINT}/user/verify-email-otp`
          : `${API_ENDPOINT}/user/login/verify-otp`

      const payload =
        authState.flowType === "email"
          ? { email: formData.email, otp: formData.otp, sessionId: authState.sessionId }
          : { phone: formData.phone, otp: formData.otp, sessionId: authState.sessionId }

      const response = await axios.post<AuthResponse>(endpoint, payload, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      })

      if (!response.data.success || !response.data.token) {
        throw new Error(response.data.message || "OTP verification failed")
      }

      setToken(response.data.token)
      if (response.data.user) localStorage.setItem("userData", JSON.stringify(response.data.user))

      setMessage({ type: "success", text: "Verified! Redirecting..." })
      setTimeout(() => {
        window.location.href = lastRoute
      }, 1500)
    } catch (error) {
      throw error
    }
  }

  // ==================== FORM SUBMIT ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setAuthState((prev) => ({ ...prev, isLoading: true }))
    setMessage({ type: "", text: "" })
    setErrors({})

    try {
      switch (authState.currentView) {
        case "login":
          await handleLogin()
          break
        case "register":
          await handleRegister()
          break
        case "phone-verify":
          // Handled by phone-verify form
          break
        case "login-phone-otp":
          await handleSendLoginOTP()
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
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const handleGoogleAuth = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))
    setMessage({ type: "", text: "" })
    try {
      const response = await axios.get<{ success: boolean; redirect: string }>(
        `${API_ENDPOINT}/user/auth/google`,
        { timeout: 10000 }
      )
      if (response.data.success && response.data.redirect) {
        window.location.href = response.data.redirect
      } else {
        throw new Error("Failed to initiate Google authentication")
      }
    } catch (error) {
      const errorMessage = handleApiError(error)
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const navigateToStep = (step: AuthView, flowType?: "email" | "phone") => {
    if (validSteps.includes(step)) {
      setAuthState((prev) => ({
        ...prev,
        currentView: step,
        flowType: flowType || prev.flowType,
      }))
      setMessage({ type: "", text: "" })
      setErrors({})
      setFormData((prev) => ({ ...prev, otp: "" })) // Clear OTP on navigation
    }
  }

  // ==================== RENDER ====================
  const renderCurrentForm = () => {
    switch (authState.currentView) {
      case "login":
        return (
          <LoginForm
            formData={formData}
            errors={errors}
            isLoading={authState.isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onGoogleAuth={handleGoogleAuth}
            onSwitchToRegister={() => {
              navigateToStep("register")
              setFormData({
                email: "",
                password: "",
                name: "",
                phone: "",
                otp: "",
                termsAccepted: true,
              })
            }}
            onSwitchToPhoneOTP={() => {
              navigateToStep("login-phone-otp", "phone")
              setFormData((prev) => ({
                ...prev,
                email: "",
                password: "",
                name: "",
                otp: "",
              }))
            }}
          />
        )
      case "register":
        return (
          <RegisterForm
            formData={formData}
            errors={errors}
            isLoading={authState.isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onGoogleAuth={handleGoogleAuth}
            onSwitchToLogin={() => {
              navigateToStep("login", "email")
              setFormData({
                email: "",
                password: "",
                name: "",
                phone: "",
                otp: "",
                termsAccepted: true,
              })
            }}
          />
        )
      case "phone-verify":
      case "login-phone-otp":
        return (
          <PhoneVerifyForm
            formData={formData}
            errors={errors}
            isLoading={authState.isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSendLoginOTP}
            onBackToLogin={() => {
              navigateToStep("login", "email")
              setFormData({
                email: "",
                password: "",
                name: "",
                phone: "",
                otp: "",
                termsAccepted: true,
              })
            }}
          />
        )
      case "otp-verify":
        return (
          <OTPVerifyForm
            formData={formData}
            errors={errors}
            isLoading={authState.isLoading}
            countdown={authState.countdown}
            flowType={authState.flowType}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onResendOTP={authState.sessionId ? handleResendOTP : null}
            onBackToPhone={() => {
              const targetStep = authState.flowType === "phone" ? "login-phone-otp" : "register"
              navigateToStep(targetStep as AuthView, authState.flowType)
            }}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
        <BrandingSection />
        <div className="w-full">
          <Card className="border border-blue-200/50 shadow-2xl bg-white/95 backdrop-blur-xl">
            <CardContent className="p-8 lg:p-12">
              <MessageAlert type={message.type} text={message.text} />
              {renderCurrentForm()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AuthSystem