"use client"

import { CheckCircle, AlertCircle } from "lucide-react"

interface MessageAlertProps {
  type: "success" | "error" | ""
  text: string
}

export function MessageAlert({ type, text }: MessageAlertProps) {
  if (!text) return null

  return (
    <div
      className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
        type === "success"
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 flex-shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
      )}
      <span className="font-medium">{text}</span>
    </div>
  )
}
