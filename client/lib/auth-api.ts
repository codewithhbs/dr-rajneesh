import axios from "axios"
import { API_ENDPOINT } from "@/constant/url"
import type { APIResponse } from "@/types/api.response"

export const authAPI = {
  validatePhone: async (phone: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const phoneRegex = /^\d{10}$/
    return {
      success: phoneRegex.test(phone),
      message: phoneRegex.test(phone) ? "Valid phone number" : "Invalid phone number",
    }
  },

  googleAuth: async (): Promise<APIResponse> => {
    try {
      const response = await axios.get(`${API_ENDPOINT}/user/auth/google`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Google auth error:", error.message)
        return {
          success: false,
          message: error.response?.data?.message || "Google authentication failed",
        }
      } else {
        return {
          success: false,
          message: "An unexpected error occurred during authentication",
        }
      }
    }
  },

  register: async (data: { name: string; email: string; phone: string; password: string }): Promise<APIResponse> => {
    try {
      const response = await axios.post(
        `${API_ENDPOINT}/user/auth/register`,
        {
          ...data,
          phone: `+91${data.phone}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      return response.data
    } catch (error: any) {
      console.error("Registration error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      }
    }
  },

  verifyEmailOTP: async (data: { email: string; otp: string }): Promise<APIResponse> => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/user/auth/verify-email`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error: any) {
      console.error("Email OTP verification error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "OTP verification failed",
      }
    }
  },

  loginViaEmail: async (data: { email: string; password: string }): Promise<APIResponse> => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/user/auth/login`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token)
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
      }

      return response.data
    } catch (error: any) {
      console.error("Email login error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  },

  loginViaPhone: async (data: { phone: string }): Promise<APIResponse> => {
    try {
      const response = await axios.post(
        `${API_ENDPOINT}/user/auth/phone-login`,
        {
          phone: `+91${data.phone}`,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      return response.data
    } catch (error: any) {
      console.error("Phone login error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Phone login failed",
      }
    }
  },

  verifyPhoneOTP: async (data: { phone: string; otp: string }): Promise<APIResponse> => {
    try {
      const response = await axios.post(
        `${API_ENDPOINT}/user/auth/verify-phone`,
        {
          phone: `+91${data.phone}`,
          otp: data.otp,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token)
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
      }

      return response.data
    } catch (error: any) {
      console.error("Phone OTP verification error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Phone OTP verification failed",
      }
    }
  },

  resendOTP: async (data: { email?: string; phone?: string; type: "email" | "phone" }): Promise<APIResponse> => {
    try {
      const payload =
        data.type === "email" ? { email: data.email, type: data.type } : { phone: `+91${data.phone}`, type: data.type }

      const response = await axios.post(`${API_ENDPOINT}/user/auth/resend-otp`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error: any) {
      console.error("Resend OTP error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to resend OTP",
      }
    }
  },

  forgotPassword: async (data: { email: string }): Promise<APIResponse> => {
    try {
      const response = await axios.post(`${API_ENDPOINT}/user/auth/forgot-password`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      return response.data
    } catch (error: any) {
      console.error("Forgot password error:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send reset email",
      }
    }
  },
}
