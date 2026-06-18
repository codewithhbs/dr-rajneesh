import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Stethoscope } from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_WEB_NAME } from "@/constants/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to send the user after a successful login.
  const redirectTo = location.state?.from || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/admin/login", { email, password });
      if (data.success === false) {
        toast.error(data.message || "Invalid credentials");
        return;
      }
      login(data.token, data.user);
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:grid-cols-2">
        {/* Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to manage {ADMIN_WEB_NAME}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clinic.com"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-4 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 py-3 pl-11 pr-11 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Side panel */}
        <div className="hidden flex-col justify-center bg-brand-600 p-12 text-white lg:flex">
          <h2 className="text-3xl font-bold leading-tight">Clinic Admin Dashboard</h2>
          <p className="mt-3 text-brand-100">
            Manage sessions, treatments, doctors, clinics and content — all from one place.
          </p>
        </div>
      </div>
    </div>
  );
}
