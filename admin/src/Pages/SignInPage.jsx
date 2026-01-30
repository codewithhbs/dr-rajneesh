import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import axiosInstance from "@/lib/axios";
import appointmentImg from '../assets/appointment-1.png';
import Cookies from "js-cookie";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axiosInstance.post("/admin/login", { email, password });
      console.log("Drrajneesh@Admin",res.data)
      setMessage(res.data.message);
      // Cookies.set('')
      // navigate("/");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        {/* Left side - Form */}
        <div className="p-12 md:p-16 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center md:text-left">
            Empower Your Patient Care
          </h2>
          <p className="text-gray-500 mb-8 text-center md:text-left">
            Access patient records, track treatments, and manage appointments effortlessly to provide exceptional care.
          </p>

          {message && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
              {message}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-[#155DFC] focus:outline-none text-gray-700"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
               <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-[#0092B8] focus:outline-none text-gray-700"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded"
                />
                <span>Remember Me</span>
              </label>
             
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full  bg-gradient-to-r from-[#155DFC] to-[#0092B8] 
                                        border-[#155DFC]  text-white py-3 rounded font-semibold shadow-lg transition duration-200"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          
        </div>

        {/* Right side - Illustration */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100 p-8">
          <img
            src={appointmentImg}
            alt="Login Illustration"
            className="w-full h-full object-cover rounded-3xl"
          />
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
