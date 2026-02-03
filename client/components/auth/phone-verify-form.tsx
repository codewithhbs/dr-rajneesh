"use client"

import type React from "react"

import { ArrowLeft, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PhoneVerifyFormProps {
  formData: any
  errors: any
  isLoading: boolean
  onInputChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
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
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phone Verification</h1>
        <p className="text-gray-600">Enter your phone number to continue</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
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
              onChange={(e) => onInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
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

      <Button onClick={onBackToLogin} variant="ghost" className="mt-6 w-full text-gray-600 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to login
      </Button>
    </div>
  )
}
