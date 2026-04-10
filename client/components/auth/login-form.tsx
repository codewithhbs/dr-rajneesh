"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, Mail, Loader2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

interface LoginFormProps {
  formData: any
  errors: any
  isLoading: boolean
  onInputChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onGoogleAuth: () => void
  onSwitchToRegister: () => void
  onSwitchToPhoneOTP: () => void
}

export function LoginForm({
  formData,
  errors,
  isLoading,
  onInputChange,
  onSubmit,
  onGoogleAuth,
  onSwitchToRegister,
  onSwitchToPhoneOTP,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your healthcare account</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
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
              onChange={(e) => onInputChange("password", e.target.value)}
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
          <Link href="/forget-password">
            <Button type="button" variant="link" className="text-sm text-blue-600 hover:text-blue-700 p-0">
              Forgot password?
            </Button>
          </Link>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>

        {/* New: Login with Phone OTP Button */}
        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToPhoneOTP}
          disabled={isLoading}
          className="w-full border-gray-300 hover:bg-gray-50"
        >
          <Phone className="h-5 w-5 mr-2" />
          Login with Phone Number
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Button
          onClick={onSwitchToRegister}
          variant="link"
          className="font-medium text-blue-600 hover:text-blue-700 p-0"
        >
          Sign up
        </Button>
      </p>
    </div>
  )
}