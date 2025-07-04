"use client"

import type React from "react"

import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface OTPVerifyFormProps {
  formData: any
  errors: any
  isLoading: boolean
  countdown: number
  onInputChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onResendOTP: () => void
  onBackToPhone: () => void
}

export function OTPVerifyForm({
  formData,
  errors,
  isLoading,
  countdown,
  onInputChange,
  onSubmit,
  onResendOTP,
  onBackToPhone,
}: OTPVerifyFormProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter OTP</h1>
        <p className="text-gray-600">
         {` We've sent a 6-digit code to`}
          <br />
          <span className="font-medium">{formData.email}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="otp" className="text-center block">
            Enter 6-digit OTP
          </Label>
          <Input
            id="otp"
            type="text"
            value={formData.otp}
            onChange={(e) => onInputChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`text-center text-2xl font-bold tracking-widest ${errors.otp ? "border-red-500" : ""}`}
            placeholder="000000"
            maxLength={6}
          />
          {errors.otp && <p className="mt-1 text-sm text-red-600 text-center">{errors.otp}</p>}
      
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-4">Didn't receive the code?</p>
        <Button
          onClick={onResendOTP}
          disabled={countdown > 0 || isLoading}
          variant="link"
          className="text-blue-600 hover:text-blue-700 font-medium p-0"
        >
          {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
        </Button>
      </div>

    </div>
  )
}
