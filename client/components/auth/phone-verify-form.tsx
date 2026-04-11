"use client"

import type React from "react"
import { Phone, Loader2, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PhoneVerifyFormProps {
  formData: any
  errors: any
  isLoading: boolean
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: () => Promise<void>
  onBackToLogin: () => void
}

export function PhoneVerifyForm({
  formData,
  errors,
  isLoading,
  onInputChange,
  onSubmit,
  onBackToLogin,
}: PhoneVerifyFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-4 p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
          <Phone className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
          Phone Verification
        </h1>
        <p className="text-gray-600 text-sm">We'll send an OTP to verify your number</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phone Number Field */}
        <div className="space-y-2.5">
          <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
            Phone Number
          </Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur" />
            <div className="relative bg-white rounded-xl border border-purple-200 focus-within:border-purple-400 transition-colors">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-400 pointer-events-none" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => onInputChange("phone", e.target.value)}
                className={`pl-12 bg-transparent border-0 text-gray-900 placeholder-gray-400 focus:ring-0 focus:outline-none ${
                  errors.phone ? "text-red-600 placeholder-red-300" : ""
                }`}
                placeholder="+91 99898 989659"
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
          <p className="text-xs text-gray-500">
            Enter your phone number with country code. We'll send you a 6-digit code.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            {isLoading ? "Sending OTP..." : "Send OTP"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </Button>

          <Button
            type="button"
            onClick={onBackToLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full h-11 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </div>
      </form>
    </div>
  )
}