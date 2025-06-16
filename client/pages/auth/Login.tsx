"use client"
import { useState, useEffect, useContext } from "react"
import { ArrowLeft, Eye, EyeOff, Phone, Mail, User, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/context/authContext/auth"

// Mock API functions (replace with actual API calls)
const mockAPI = {
  validatePhone: async (phone) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Simple validation: must be 10 digits
    const phoneRegex = /^\d{10}$/
    return {
      success: phoneRegex.test(phone),
      message: phoneRegex.test(phone) ? "Valid phone number" : "Invalid phone number",
    }
  },

  sendOTP: async (phone) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    // Mock OTP is always 123456 for demo
    console.log(`Mock OTP sent to ${phone}: 123456`)
    return { success: true, message: "OTP sent successfully" }
  },

  verifyOTP: async (phone, otp) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // Mock OTP verification (123456 is correct)
    return { success: otp === "123456", message: otp === "123456" ? "OTP verified" : "Invalid OTP" }
  },

  googleAuth: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return { success: true, user: { name: "John Doe", email: "john@example.com" } }
  },
}

const AuthSystem = () => {
  const { isAuthenticated, loading: tokenCheckingLoading } = useAuth();
  const [currentView, setCurrentView] = useState("login")
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [lastRoute] = useState("/") // Mock previous route

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    otp: "",
  })

  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState({ type: "", text: "" })

  // OTP countdown timer
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (currentView === "register") {
      if (!formData.name.trim()) newErrors.name = "Name is required"
      if (!formData.email.trim()) newErrors.email = "Email is required"
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format"
      if (!formData.password) newErrors.password = "Password is required"
      else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setMessage({ type: "", text: "" })

    try {
      if (currentView === "login") {
        // Mock login
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setMessage({ type: "success", text: "Login successful! Redirecting..." })
        setTimeout(() => {
          // Redirect to last route or home
          window.location.href = lastRoute
        }, 1500)
      } else if (currentView === "register") {
        // Mock registration
        await new Promise((resolve) => setTimeout(resolve, 1500))
        setMessage({ type: "success", text: "Registration successful! Please login." })
        setTimeout(() => setCurrentView("login"), 2000)
      } else if (currentView === "phone-verify") {
        const result = await mockAPI.validatePhone(formData.phone)
        if (result.success) {
          const otpResult = await mockAPI.sendOTP(formData.phone)
          if (otpResult.success) {
            setMessage({ type: "success", text: "OTP sent successfully!" })
            setCurrentView("otp-verify")
            setCountdown(60)
          }
        } else {
          setMessage({ type: "error", text: result.message })
        }
      } else if (currentView === "otp-verify") {
        const result = await mockAPI.verifyOTP(formData.phone, formData.otp)
        if (result.success) {
          setMessage({ type: "success", text: "Phone verified! Redirecting..." })
          setTimeout(() => {
            window.location.href = lastRoute
          }, 1500)
        } else {
          setMessage({ type: "error", text: result.message })
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
      const result = await mockAPI.googleAuth()
      if (result.success) {
        setMessage({ type: "success", text: "Google authentication successful! Redirecting..." })
        setTimeout(() => {
          window.location.href = lastRoute
        }, 1500)
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
      await mockAPI.sendOTP(formData.phone)
      setMessage({ type: "success", text: "OTP resent successfully!" })
      setCountdown(60)
    } catch (error) {
      setMessage({ type: "error", text: "Failed to resend OTP" })
    } finally {
      setIsLoading(false)
    }
  }

  const renderLogin = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your healthcare account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={errors.password ? "border-red-500" : ""}
              placeholder="Enter your password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm text-gray-600">
              Remember me
            </Label>
          </div>
          <Button type="button" variant="link" className="text-sm text-blue-600 hover:text-blue-700 p-0">
            Forgot password?
          </Button>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={handleGoogleAuth} disabled={isLoading} variant="outline" className="w-full">
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>
          <Button onClick={() => setCurrentView("phone-verify")} variant="outline" className="w-full">
            <Phone className="h-5 w-5 mr-2" />
            Phone
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{" "}
        <Button
          onClick={() => setCurrentView("register")}
          variant="link"
          className="font-medium text-blue-600 hover:text-blue-700 p-0"
        >
          Sign up
        </Button>
      </p>
    </div>
  )

  const renderRegister = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-600">Join our healthcare community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="register-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
              placeholder="Enter your email"
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="Phone_Number">Phone Number</Label>
          <div className="relative">
            <Input
              id="Phone_Number"
              type={'text'}
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={errors.phone ? "border-red-500" : ""}
              placeholder="Write your Phone Number"
            />

          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <div className="relative">
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={errors.password ? "border-red-500" : ""}
              placeholder="Create a password"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">Toggle password visibility</span>
            </Button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
        </div>



        <div className="flex items-center space-x-2">
          <Checkbox id="terms" required />
          <Label htmlFor="terms" className="text-sm text-gray-600">
            I agree to the{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
            </a>
          </Label>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>
      <div className="relative mt-5">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3">
        <Button onClick={handleGoogleAuth} disabled={isLoading} variant="outline" className="w-full">
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>

      </div>
      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Button
          onClick={() => setCurrentView("login")}
          variant="link"
          className="font-medium text-blue-600 hover:text-blue-700 p-0"
        >
          Sign in
        </Button>
      </p>
    </div>
  )

  const renderPhoneVerify = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Verification</h1>
        <p className="text-gray-600">Enter your phone number to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
              <span className="text-gray-500 font-medium">+91</span>
              <div className="w-px h-6 bg-gray-300 ml-2 mr-3"></div>
            </div>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={`pl-16 ${errors.phone ? "border-red-500" : ""}`}
              placeholder="Enter 10-digit phone number"
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
          <p className="mt-1 text-sm text-gray-500">We'll send you a verification code</p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {isLoading ? "Validating..." : "Send OTP"}
        </Button>
      </form>

      <Button
        onClick={() => setCurrentView("login")}
        variant="ghost"
        className="mt-6 w-full text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to login
      </Button>
    </div>
  )

  const renderOTPVerify = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter OTP</h1>
        <p className="text-gray-600">
          We've sent a 6-digit code to
          <br />
          <span className="font-medium">+91 {formData.phone}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-center block">
            Enter 6-digit OTP
          </Label>
          <Input
            id="otp"
            type="text"
            value={formData.otp}
            onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`text-center text-2xl font-bold tracking-widest ${errors.otp ? "border-red-500" : ""}`}
            placeholder="000000"
            maxLength={6}
          />
          {errors.otp && <p className="mt-1 text-sm text-red-600 text-center">{errors.otp}</p>}
          <p className="mt-2 text-sm text-gray-500 text-center">
            Demo OTP: <span className="font-bold text-blue-600">123456</span>
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-4">Didn't receive the code?</p>
        <Button
          onClick={resendOTP}
          disabled={countdown > 0 || isLoading}
          variant="link"
          className="text-blue-600 hover:text-blue-700 font-medium p-0"
        >
          {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
        </Button>
      </div>

      <Button
        onClick={() => setCurrentView("phone-verify")}
        variant="ghost"
        className="mt-6 w-full text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Change phone number
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block">
          <div className="text-center lg:text-left">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Your Health,
                <br />
                <span className="text-blue-600">Our Priority</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Access personalized healthcare services, expert consultations, and comprehensive wellness solutions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Expert Care</h3>
                  <p className="text-gray-600">Professional healthcare services</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Platform</h3>
                  <p className="text-gray-600">Your data is safe and protected</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">24/7 Support</h3>
                  <p className="text-gray-600">Round-the-clock assistance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="w-full">
          <Card className="border-none shadow-xl">
            <CardContent className="p-8 lg:p-12">
              {/* Message Display */}
              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  )}
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              {/* Render Current View */}
              {currentView === "login" && renderLogin()}
              {currentView === "register" && renderRegister()}
              {currentView === "phone-verify" && renderPhoneVerify()}
              {currentView === "otp-verify" && renderOTPVerify()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AuthSystem
