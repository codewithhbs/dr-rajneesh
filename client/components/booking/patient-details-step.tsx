"use client";

import { useState, useEffect, useMemo } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext/auth";
import Cookies from "js-cookie";
import { Loader2, CheckCircle2 } from "lucide-react";

const API_BASE_URL = "https://api.drrajneeshkant.in/api/v1/user";

interface PatientDetailsStepProps {
  next: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  setOtpVerify: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PatientDetailsStep({
  next,
  formData,
  setFormData,
  setOtpVerify,
}: PatientDetailsStepProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, setToken, user } = useAuth();

  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userIdFromRegister, setUserIdFromRegister] = useState<string | null>(null);
  const [bookingFor, setBookingFor] = useState<"myself" | "someone-else">("");

  const isLoggedIn = !!token;

  const isFormFilledEnough = useMemo(() => {
    return (
      formData.name?.trim() &&
      formData.phone?.length === 10 &&
      /^\d{10}$/.test(formData.phone) &&
      formData.email?.trim() &&
      formData.aadhhar?.trim() &&
      formData.age?.trim() &&
      !isNaN(Number(formData.age)) &&
      Number(formData.age) >= 1
    );
  }, [formData]);

  // ────────────────────────────────────────────────
  //  Pre-fill logged-in user data when choosing "myself"
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || bookingFor !== "myself" || !user?._id) return;

    const updated = {
      name: user.name || "",
      phone: user.phone || "",
      gender: user.gender || "male",
      age: user.age ? String(user.age) : "",
      email: user.email || "",
      aadhhar: user.aadhhar || "",
      passport: user.passport || "",
    };

    setFormData(updated);

    const params = new URLSearchParams();
    Object.entries(updated).forEach(([key, val]) => {
      if (val) params.set(key, String(val));
    });
    params.set("userId", user._id);
    params.set("gender", updated.gender);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [bookingFor, isLoggedIn, user, pathname, router, setFormData]);

  // ────────────────────────────────────────────────
  //  Auto-advance for logged-in user choosing "someone else"
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || bookingFor !== "someone-else" || !isFormFilledEnough) return;

    const params = new URLSearchParams({
      name: formData.name.trim(),
      phone: formData.phone,
      gender: formData.gender || "male",
      age: formData.age,
      email: formData.email.trim(),
      aadhhar: formData.aadhhar.trim(),
      passport: formData.passport?.trim() || "",
      userId: user?._id || "",
      guest: "true",
    });

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setOtpVerify(true);
    // next(); // uncomment if you want to auto-go to next step
  }, [isFormFilledEnough, bookingFor, isLoggedIn, formData, user, pathname, router, setOtpVerify]);

  // ────────────────────────────────────────────────
  //  Auto-trigger registration + OTP when not logged in
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn || !isFormFilledEnough || showOtpModal || userIdFromRegister || isSubmitting) {
      return;
    }

    const timeout = setTimeout(() => {
      sendRegistrationAndOtp();
    }, 900);

    return () => clearTimeout(timeout);
  }, [isFormFilledEnough, isLoggedIn, showOtpModal, userIdFromRegister, isSubmitting]);

  const updateField = (name: string, value: string) => {
    let cleaned = value;

    if (name === "phone") {
      cleaned = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "age") {
      cleaned = value.replace(/\D/g, "").slice(0, 3);
    } else if (name === "aadhhar" || name === "passport") {
      cleaned = value.replace(/\D/g, "").slice(0, 12);
    }

    setFormData((prev: any) => ({ ...prev, [name]: cleaned }));
  };

  const sendRegistrationAndOtp = async () => {
    if (isLoggedIn || !isFormFilledEnough || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        aadhhar: formData.aadhhar.trim(),
        passport: formData.passport?.trim() || undefined,
        age: Number(formData.age),
        gender: formData.gender || "male",
        termsAccepted: true,
      };

      const resp = await axios.post(`${API_BASE_URL}/register-via-number`, payload);

      if (resp.data.success) {
        setUserIdFromRegister(resp.data.userId);
        setShowOtpModal(true);
        toast.success("OTP sent to your mobile number");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to send OTP. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const resp = await axios.post(`${API_BASE_URL}/verify-otp-via-number`, {
        phone: formData.phone,
        otp: otp.trim(),
      });

      if (resp.data.success) {
        const newToken = resp.data.token;
        if (newToken) {
          Cookies.set("token", newToken, { expires: 7 });
          setToken(newToken);
        }

        toast.success("Phone number verified successfully!");

        const params = new URLSearchParams({
          name: formData.name.trim(),
          phone: formData.phone,
          gender: formData.gender || "male",
          age: formData.age,
          email: formData.email.trim(),
          aadhhar: formData.aadhhar.trim(),
          passport: formData.passport?.trim() || "",
          userId: resp.data.userId || userIdFromRegister || "",
        });

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        setOtpVerify(true);
        setShowOtpModal(false);
        // next(); // optional auto-next
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Invalid or expired OTP";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLocked = isLoggedIn && bookingFor === "myself";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Patient Details</h2>
        <p className="text-gray-600">
          Please fill in the correct information for a smooth booking experience.
        </p>
      </div>

      {/* ─── Logged-in user choice ─── */}
      {isLoggedIn && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
          <p className="font-medium text-lg mb-5 text-gray-800">
            Who are you booking the consultation for?
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setBookingFor("myself")}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                bookingFor === "myself"
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <div className="font-semibold">Myself</div>
              <div className="text-sm text-gray-600 mt-1">Use my saved profile details</div>
            </button>

            <button
              type="button"
              onClick={() => setBookingFor("someone-else")}
              className={`p-5 rounded-xl border-2 text-left transition-all ${
                bookingFor === "someone-else"
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200"
                  : "border-gray-300 hover:border-blue-400"
              }`}
            >
              <div className="font-semibold">Someone else</div>
              <div className="text-sm text-gray-600 mt-1">New patient / family member</div>
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Form ─── */}
      <div className="bg-white rounded-xl border shadow-sm p-6 md:p-8 space-y-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Enter full name"
              disabled={isFormLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Mobile Number <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="10-digit mobile number"
              disabled={isFormLocked || isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
            <select
              value={formData.gender || "male"}
              onChange={(e) => updateField("gender", e.target.value)}
              disabled={isFormLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Age <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={3}
              value={formData.age}
              onChange={(e) => updateField("age", e.target.value)}
              placeholder="Enter age"
              disabled={isFormLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
            />
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="yourname@example.com"
              disabled={isFormLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
            />
          </div>

          {/* Aadhaar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Aadhaar Number <span className="text-red-600">*</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={12}
              value={formData.aadhhar}
              onChange={(e) => updateField("aadhhar", e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              disabled={isFormLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
            />
          </div>

          {/* Passport (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Passport Number (optional)
            </label>
            <input
              type="password"
              maxLength={12}
              value={formData.passport || ""}
              onChange={(e) => updateField("passport", e.target.value)}
              placeholder="Enter passport number if available"
              disabled={isFormLocked}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
            />
          </div>
        </div>

        {isSubmitting && !showOtpModal && (
          <div className="flex items-center justify-center gap-2 text-blue-600 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Sending OTP to {formData.phone}...</span>
          </div>
        )}
      </div>

      {/* ─── OTP Modal ─── */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Verify Phone Number</h3>
              <p className="mt-2 text-gray-600">
                Enter the 6-digit code sent to <strong>{formData.phone}</strong>
              </p>
            </div>

            <form onSubmit={verifyOtp} className="p-6 space-y-6">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="------"
                autoFocus
                className="w-full text-center text-4xl tracking-[1.2em] font-mono py-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />

              <button
                type="submit"
                disabled={isSubmitting || otp.length !== 6}
                className="w-full py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                Didn't receive code?{" "}
                <button
                  type="button"
                  onClick={sendRegistrationAndOtp}
                  disabled={isSubmitting}
                  className="text-blue-600 font-medium hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}