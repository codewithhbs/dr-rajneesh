"use client"

import type React from "react"
import { Loader2, ArrowLeft, ArrowRight, ShieldCheck, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRef } from "react"

interface OTPVerifyFormProps {
  formData: any
  errors: any
  isLoading: boolean
  countdown: number
  flowType: "email" | "phone"
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onResendOTP: (() => Promise<void>) | null
  onBackToPhone: () => void
}

export function OTPVerifyForm({
  formData,
  errors,
  isLoading,
  countdown,
  flowType,
  onInputChange,
  onSubmit,
  onResendOTP,
  onBackToPhone,
}: OTPVerifyFormProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus next input when digit is entered
  const handleOTPInput = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOTP = formData.otp.split("")
    newOTP[index] = value

    // Update the full OTP in form data
    if (value && index < 5) {
      // Auto-focus next input
      inputRefs.current[index + 1]?.focus()
    }

    // Update as complete string
    const otpString = newOTP.join("")
    onInputChange("otp", otpString)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  const handleResendClick = async () => {
    if (onResendOTP && countdown === 0) {
      await onResendOTP()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block mb-4 p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-transparent mb-2">
          Verify OTP
        </h1>
        <p className="text-gray-600 text-sm">
          {flowType === "email"
            ? `We've sent a code to ${formData.email}`
            : `We've sent a code to ${formData.phone}`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OTP Input Fields */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700">Enter 6-digit OTP</Label>
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={formData.otp[index] || ""}
                onChange={(e) => handleOTPInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-white ${
                  errors.otp
                    ? "border-red-500 focus:ring-red-500"
                    : "border-cyan-200 focus:border-cyan-400"
                }`}
                placeholder="0"
              />
            ))}
          </div>
          {errors.otp && (
            <p className="text-sm text-red-600 text-center flex items-center justify-center gap-1">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
              {errors.otp}
            </p>
          )}
        </div>

        {/* Resend OTP Section */}
        <div className="text-center border-t border-gray-300 pt-4">
          {countdown > 0 ? (
            <p className="text-sm text-gray-600">
              Resend OTP in{" "}
              <span className="font-semibold text-cyan-600">
                {countdown}s
              </span>
            </p>
          ) : (
            <Button
              type="button"
              onClick={handleResendClick}
              disabled={isLoading || !onResendOTP}
              variant="ghost"
              className="text-cyan-600 hover:text-cyan-700 gap-1 h-auto p-0 font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              Resend OTP
            </Button>
          )}
        </div>

        {/* Verify Button */}
        <Button
          type="submit"
          disabled={isLoading || formData.otp.length !== 6}
          className="w-full h-11 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-lg"
        >
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
          {isLoading ? "Verifying..." : "Verify OTP"}
          {!isLoading && <ArrowRight className="h-4 w-4" />}
        </Button>

        {/* Back Button */}
        <Button
          type="button"
          onClick={onBackToPhone}
          disabled={isLoading}
          variant="outline"
          className="w-full h-11 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Didn&apos;t receive the code? Check your{" "}
          {flowType === "email" ? "email spam folder" : "message folder"} or request a new code.
        </p>
      </div>
    </div>
  )
}