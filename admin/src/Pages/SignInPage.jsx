import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import axiosInstance from "@/lib/axios";
import appointmentImg from "../assets/appointment-1.png"; // ideally replace with B&W version
import Cookies from "js-cookie";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: null, text: null });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: null, text: null });
    setIsLoading(true);

    try {
      const res = await axiosInstance.post("/admin/login", { email, password });

      if (res.data.success) {
        Cookies.set("token", res.data.token, { expires: 7, secure: true });
        Cookies.set("user", JSON.stringify(res.data.user), { expires: 7 });

        setMessage({ type: "success", text: "Authentication successful. Redirecting..." });
        setTimeout(() => navigate("/"), 1400);
      } else {
        setMessage({ type: "error", text: res.data.message || "Invalid credentials" });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Connection error. Please try again.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 shadow-sm">
        {/* Left: Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Admin Login
            </h1>
            <p className="mt-3 text-gray-600 text-base">
              Secure access to patient records and scheduling
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mb-8 p-4 rounded-lg border text-sm flex items-center gap-3 ${message.type === "error"
                  ? "bg-gray-100 border-gray-300 text-gray-800"
                  : "bg-gray-100 border-gray-300 text-gray-800"
                }`}
            >
              <div className="h-5 w-5 rounded-full bg-gray-300 text-gray-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {message.type === "error" ? "!" : "✓"}
              </div>
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@clinic.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-400 focus:outline-none transition-all duration-150"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-400 focus:outline-none transition-all duration-150"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-600">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-400 text-gray-700 focus:ring-gray-500"
                />
                <span>Remember this device</span>
              </label>

              <a
                href="#"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                w-full flex items-center justify-center gap-2.5
                bg-gray-900 hover:bg-gray-800 
                text-white font-medium py-3.5 rounded-lg
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
              `}
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            For support contact{" "}
            <a href="mailto:it@clinic.local" className="text-gray-700 hover:underline">
              it@clinic.local
            </a>
          </p>
        </div>

        {/* Right: Illustration (hidden on small/medium screens) */}
        <div className="hidden lg:flex items-center justify-center bg-gray-50 p-12 xl:p-16">
          <img
            src={appointmentImg}
            alt="Clinic administration dashboard"
            className="w-full max-w-md xl:max-w-lg object-contain  contrast-125" // ← makes it B&W-ish even if original is colored
          />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;