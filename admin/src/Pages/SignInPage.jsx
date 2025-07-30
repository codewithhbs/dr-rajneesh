import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { MessageSquare, Shield, Eye, EyeOff, Lock, Mail, ChevronRight } from "lucide-react";
import axiosInstance from "@/lib/axios";

const SignInPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/admin/login', { email, password });
      alert(res.data.message);
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-normal filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-100 rounded-full mix-blend-normal filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Image and Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 relative overflow-hidden bg-gradient-to-br from-slate-100 to-blue-100">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 to-blue-600/10"></div>
          
          {/* Admin illustration/image */}
          <img 
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Admin Dashboard"
            className="w-full h-full object-cover opacity-75"
          />
          
          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col justify-center items-center text-slate-700 p-12">
            <div className="max-w-lg text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/80 backdrop-blur-sm rounded-2xl mb-6 shadow-lg">
                  <Shield className="w-10 h-10 text-slate-600" />
                </div>
                <h1 className="text-5xl font-bold mb-4 text-slate-700">
                  Admin Portal
                </h1>
                <p className="text-xl text-slate-600 mb-8">
                  Secure access to your management dashboard
                </p>
              </div>
              
              {/* Feature highlights */}
              <div className="space-y-4 text-left bg-white/30 backdrop-blur-sm rounded-xl p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-600">Advanced Analytics & Reporting</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span className="text-slate-600">Real-time Data Management</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                  <span className="text-slate-600">Secure User Administration</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-2/5 xl:w-1/3 flex items-center justify-center p-6 lg:p-12 bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-md">
            {/* Mobile header (visible only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-500 to-blue-500 rounded-2xl mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-700 mb-2">Admin Portal</h1>
              <p className="text-slate-600">Secure dashboard access</p>
            </div>

            <Card className="backdrop-blur-xl bg-white/90 border border-slate-200 shadow-xl">
              <CardHeader className="text-center space-y-2 pb-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-to-r from-slate-500 to-blue-500 p-3 rounded-xl shadow-md">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-slate-700">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Sign in to <span className="font-semibold text-blue-600">Rajneesh Kanth Dashboard</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 hover:bg-slate-100 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-slate-700 font-medium">
                        Password
                      </Label>
                      <Link 
                        to="#" 
                        className="text-sm text-blue-600 hover:text-blue-700 transition-colors flex items-center"
                      >
                        Forgot password?
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20 h-12 hover:bg-slate-100 transition-colors"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      className="w-4 h-4 text-blue-600 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="remember" className="text-sm text-slate-600">
                      Remember me for 30 days
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.01] shadow-md hover:shadow-lg h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        Access Dashboard
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Security Badge */}
                <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-center text-sm text-slate-600">
                    <Shield className="w-4 h-4 mr-2 text-green-600" />
                    Secured with 256-bit SSL encryption
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-slate-500">
              © 2024 Rajneesh Kanth Dashboard. All rights reserved.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default SignInPage;