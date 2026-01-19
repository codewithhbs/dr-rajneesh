"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext/auth";
import Cookies from "js-cookie";

const API_BASE_URL = "https://drkm.api.adsdigitalmedia.com/api/v1/user";

interface PatientDetailsStepProps {
  next: () => void;
}

export default function PatientDetailsStep({
  next,
  setFormData,
  formData,
  setOtpVerify,
}: PatientDetailsStepProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, setToken, loading: authLoading, user } = useAuth();

  const [otp, setOtp] = useState("");

  const [openOtpModal, setOpenOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [choice, setChoice] = useState<"same" | "other">("");

  const isFormComplete =
    formData.name.trim() !== "" &&
    formData.phone.length === 10 &&
    formData.email.trim() !== "" &&
    formData.aadhhar.trim() !== "" &&
    formData.age.trim() !== "";

  const shouldSendOtp = !token

  useEffect(() => {
    if (isFormComplete && shouldSendOtp && !openOtpModal && !userId) {
      handleRegister();
    }
  }, [isFormComplete, shouldSendOtp, openOtpModal, userId]);

  useEffect(() => {

    if (!token || choice !== "same" || !user?._id) return;

    setFormData((prev) => ({
      ...prev,
      name: user.name || "",
      phone: user.phone || "",
      gender: user.gender || "male",
      age: String(user.age || ""),
      email: user.email || "",
      aadhhar: user.aadhhar || "",
    }));

    const params = new URLSearchParams();

    if (user.name) params.append("name", user.name);
    if (user.phone) params.append("phone", user.phone);
    params.append("gender", user.gender || "Male");
    params.append("age", String(user.age || 20));

    if (user.email) params.append("email", user.email);
    if (user.aadhhar) params.append("aadhhar", user.aadhhar);

    params.append("userId", user._id);

    const timer = setTimeout(() => {
      router.replace(`${pathname}?${params.toString()}`);
      const isFormComplete =
        formData.name &&
        formData.phone?.length === 10 &&
        formData.gender &&
        Number(formData.age) > 0 &&
        formData.email &&
        formData.aadhhar;
    }, 2000);

    return () => clearTimeout(timer);
  }, [choice, token, user, pathname, router]);

  useEffect(() => {
    if (token && choice === "other" && isFormComplete) {
      const params = new URLSearchParams({
        name: formData.name.trim(),
        phone: formData.phone,
        gender: formData.gender,
        age: formData.age,
        email: formData.email,
        passport:formData.passport,
        aadhhar: formData.aadhhar,
        userId: String(user?._id),
        guest: "true",
      });

      const isFormComplete =
        formData.name &&
        formData.phone?.length === 10 &&
        formData.gender &&
        Number(formData.age) > 0 &&
        formData.email &&
        formData.aadhhar;
    setOtpVerify(token ? true:false);

      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [isFormComplete, choice, token, formData, next, pathname, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "phone" || name === "age") {
      if (value && !/^\d*$/.test(value)) return;
    } 

    

    setFormData((prev) => ({
      ...prev,
      [name]: name === "phone" ? value.slice(0, 10) : value,
    }));
  };

  const handleRegister = async () => {
    if (!shouldSendOtp || !isFormComplete) return;

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/register-via-number`, {
        name: formData.name.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        passport:formData.passport.trim(),
        aadhhar: formData.aadhhar.trim(),
        age: formData.age,
        gender: formData.gender,
        termsAccepted: true,
      });

      if (response.data.success) {
        setUserId(response.data.userId);
        setOpenOtpModal(true);
        toast.success("OTP sent to your phone!");
      }
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message || "Failed to send OTP"
          : "Something went wrong";
      toast.error(message);
      setFormData((prev) => ({ ...prev, phone: "" }));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/verify-otp-via-number`,
        {
          phone: formData.phone,
          otp: otp.trim(),
        }
      );

      if (response.data.success) {
        toast.success("Login successful!");

        const newToken = response.data.token;

        if (newToken) {
          Cookies.set("token", newToken, { expires: 7 });
          setToken(newToken);
        }

        const params = new URLSearchParams({
          name: formData.name.trim(),
          phone: formData.phone,
          gender: formData.gender,
          age: formData.age,
                  passport:formData.passport,

          email: formData.email,
          aadhhar: formData.aadhhar,
          userId: response.data.userId || userId || "",
        });

        router.replace(`${pathname}?${params.toString()}`);
      }
      setOtpVerify(true);
      setOpenOtpModal(false);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.message || "Invalid or expired OTP"
          : "Verification failed";
      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    await handleRegister();
  };

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Patient Details
        </h2>

        {token && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
            <Label className="text-base font-medium mb-4 block">
              Who are you booking for?
            </Label>

            <RadioGroup
              value={choice}
              onValueChange={(val) => setChoice(val as "same" | "other")}
            >
              <div className="flex items-center space-x-3 mb-4">
                <RadioGroupItem value="other" id="same" />
                <Label htmlFor="other" className="text-base cursor-pointer">
                  Myself (use my existing details)
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="text-base cursor-pointer">
                  Someone else (new patient)
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label className="block text-sm text-gray-600">Full Name *</Label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
              disabled={token && choice === "same"}
            />
          </div>

          <div>
            <Label className="block text-sm text-gray-600">
              Mobile Number *
            </Label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10 digit mobile number"
              maxLength={10}
              type="tel"
              disabled={(token && choice === "same") || loading}
            />
          </div>

          <div>
            <Label className="block text-sm text-gray-600">Gender</Label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
     
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label className="block text-sm text-gray-600">Age *</Label>
            <Input
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter Your Age"
           
            />
          </div>

          <div>
            <Label className="block text-sm text-gray-600">Email *</Label>
            <Input
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            
            />
          </div>

          <div>
            <Label className="block text-sm text-gray-600">
              Aadhaar Number *
            </Label>
            <Input
              name="aadhhar"
              value={formData.aadhhar}
              type="password"
              onChange={handleChange}
              placeholder="XXXX-XXXX-1234"
              maxLength={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            
            />
          </div>
          <div>
            <Label className="block text-sm text-gray-600">
              Passport Number (Optional)
            </Label>
            <Input
              name="passport"
              value={formData.passport}
              type="password"
              onChange={handleChange}
              placeholder="XXXX-XXXX"
              maxLength={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            
            />
          </div>
        </div>

        {loading && (
          <p className="text-center text-blue-600 text-sm animate-pulse">
            Sending OTP to {formData.phone}...
          </p>
        )}

        {/* Auto proceed message for logged-in + other (no OTP) */}
        {/* {token && choice === "other" && isFormComplete && (
          <p className="text-center text-green-600 text-lg font-medium">
            Proceeding with new patient details...
          </p>
        )} */}
      </div>

      {/* OTP Modal - Only shows when OTP flow is active */}
      <Dialog open={openOtpModal} onOpenChange={() => setOpenOtpModal(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <p className="text-center text-sm text-gray-600">
              We've sent a 6-digit OTP to <strong>{formData.phone}</strong>
            </p>

            <form onSubmit={handleVerifyOtp}>
              <Input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                autoFocus
              />

              <Button type="submit" className="w-full mt-6">
                Verify & Continue
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600">
              Didn't receive OTP?{" "}
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-blue-600 font-medium hover:underline"
              >
                {loading ? "Sending..." : "Resend"}
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
