"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, Mail, Phone, User, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"

interface RegisterFormProps {
  formData: any
  errors: any
  isLoading: boolean
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: (e: React.FormEvent) => void
  onGoogleAuth: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({
  formData,
  errors,
  isLoading,
  onInputChange,
  onSubmit,
  onGoogleAuth,
  onSwitchToLogin,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = () => {
    const pwd = formData.password
    if (!pwd) return { score: 0, label: "", color: "" }

    let score = 0
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[@$!%*?&#^()_\-+=]/.test(pwd)) score++

    const strengths = [
      { score: 0, label: "Very Weak", color: "text-red-600" },
      { score: 1, label: "Weak", color: "text-orange-600" },
      { score: 2, label: "Fair", color: "text-yellow-600" },
      { score: 3, label: "Good", color: "text-blue-600" },
      { score: 4, label: "Strong", color: "text-green-600" },
      { score: 5, label: "Very Strong", color: "text-green-700" },
    ]

    return strengths[score] || strengths[5]
  }

  const strength = passwordStrength()

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-4 p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
          <User className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
          Create Account
        </h1>
        <p className="text-gray-600 text-sm">Join us to manage your health effectively</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Name Field */}
        <div className="space-y-2.5">
          <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
            Full Name
          </Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
            <div className="relative bg-white rounded-xl border border-green-200 focus-within:border-green-400 transition-colors">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400 pointer-events-none" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
                className={`pl-12 bg-transparent border-0 text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none ${
                  errors.name ? "text-red-600 placeholder-red-300" : ""
                }`}
                placeholder="John Doe"
                disabled={isLoading}
              />
            </div>
          </div>
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email Address
          </Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
            <div className="relative bg-white rounded-xl border border-green-200 focus-within:border-green-400 transition-colors">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onInputChange("email", e.target.value)}
                className={`pl-12 bg-transparent border-0 text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none ${
                  errors.email ? "text-red-600 placeholder-red-300" : ""
                }`}
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-2.5">
          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
            Phone Number
          </Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
            <div className="relative bg-white rounded-xl border border-green-200 focus-within:border-green-400 transition-colors">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400 pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => onInputChange("phone", e.target.value)}
                className={`pl-12 bg-transparent border-0 text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none ${
                  errors.phone ? "text-red-600 placeholder-red-300" : ""
                }`}
                placeholder="+1 (555) 000-0000"
                disabled={isLoading}
              />
            </div>
          </div>
          {errors.phone && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2.5">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
            Password
          </Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
            <div className="relative bg-white rounded-xl border border-green-200 focus-within:border-green-400 transition-colors">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => onInputChange("password", e.target.value)}
                className={`pr-12 bg-transparent border-0 text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none ${
                  errors.password ? "text-red-600 placeholder-red-300" : ""
                }`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Toggle password visibility</span>
              </Button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Password strength</span>
                <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.score <= 1
                      ? "bg-red-500 w-1/5"
                      : strength.score === 2
                        ? "bg-orange-500 w-2/5"
                        : strength.score === 3
                          ? "bg-blue-500 w-3/5"
                          : strength.score === 4
                            ? "bg-green-500 w-4/5"
                            : "bg-green-600 w-full"
                  }`}
                />
              </div>
            </div>
          )}

          {errors.password && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="terms"
            checked={formData.termsAccepted}
            onCheckedChange={(checked) => onInputChange("termsAccepted", checked === true)}
            disabled={isLoading}
            className="border-gray-300 bg-white data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 mt-1"
          />
          <Label htmlFor="terms" className="text-sm text-gray-600 font-normal cursor-pointer leading-relaxed">
            I agree to the{" "}
            <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.termsAccepted && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
            {errors.termsAccepted}
          </p>
        )}

        {/* Primary CTA */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 mt-6 flex items-center justify-center gap-2 shadow-lg"
        >
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {isLoading ? "Creating Account..." : "Create Account"}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        {/* Google Auth */}
        <Button
          type="button"
          variant="outline"
          onClick={onGoogleAuth}
          disabled={isLoading}
          className="w-full h-11 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Button
          onClick={onSwitchToLogin}
          variant="link"
          className="font-semibold text-green-600 hover:text-green-700 p-0 h-auto"
        >
          Sign in
        </Button>
      </p>
    </div>
  )
}