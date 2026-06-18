"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/authContext/auth";

const API_BASE_URL = "http://localhost:7900/api/v1/user";

/* ─── Icons ─── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7L5.5 10L11.5 4" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
    <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

/* ─── Validation ─── */
function getFieldStatus(name: string, value: string): boolean {
  switch (name) {
    case "name": return value.trim().length > 2;
    case "phone": return /^\d{10}$/.test(value);
    case "email": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    case "age": return value !== "" && !isNaN(Number(value)) && Number(value) >= 1;
    case "aadhhar": return /^\d{12}$/.test(value);
    default: return true;
  }
}

/* ─── Reusable Components ─── */
function Field({ label, required, hint, error, children }: any) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.req}> *</span>}
      </label>
      {children}
      {(hint || error) && (
        <span style={{ ...styles.hint, color: error ? "#A32D2D" : "#5F5E5A" }}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div style={{ ...styles.checkItem, color: done ? "#27500A" : "#888780" }}>
      <span style={{
        ...styles.checkDot,
        background: done ? "#639922" : "transparent",
        borderColor: done ? "#639922" : "#B4B2A9"
      }}>
        {done && <CheckIcon />}
      </span>
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  );
}

export default function PatientDetailsStep({

}: any) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, setToken } = useAuth();

  const [otp, setOtp] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [otpError, setOtpError] = useState("");

  const requiredFields = ["name", "phone", "email", "age", "aadhhar"];

  const fieldValid = useMemo(() => {
    const result: Record<string, boolean> = {};
    requiredFields.forEach((f) => {
      result[f] = getFieldStatus(f, formData[f] ?? "");
    });
    return result;
  }, [formData]);

  const allFieldsValid = requiredFields.every((f) => fieldValid[f]);

  // Step is valid if fields are filled + (user is logged in OR OTP is verified)
  const isStep1Valid = allFieldsValid && (isAuthenticated || otpVerify);

  // ────────────────────────────────────────────────
  // Load data from URL query params
  // ────────────────────────────────────────────────
  useEffect(() => {
    const params = {
      name: searchParams.get("name") || "",
      phone: searchParams.get("phone") || "",
      email: searchParams.get("email") || "",
      aadhhar: searchParams.get("aadhhar") || "",
      passport: searchParams.get("passport") || "",
      age: searchParams.get("age") || "",
      gender: searchParams.get("gender") || "male",
    };

    setFormData((prev: any) => ({ ...prev, ...params }));
  }, [searchParams, setFormData]);

  // Auto-send OTP only for **non-authenticated** users when form is complete
  useEffect(() => {
    if (
      isAuthenticated ||          // Skip if already logged in
      !allFieldsValid ||
      showOtpModal ||
      otpVerify ||
      isSubmitting
    ) return;

    const timer = setTimeout(sendRegistrationAndOtp, 800);
    return () => clearTimeout(timer);
  }, [allFieldsValid, showOtpModal, otpVerify, isSubmitting, isAuthenticated]);

  const updateField = (name: string, value: string) => {
    let processedValue = value;

    if (name === "phone") processedValue = value.replace(/\D/g, "").slice(0, 10);
    if (name === "age") processedValue = value.replace(/\D/g, "").slice(0, 3);
    if (name === "aadhhar") processedValue = value.replace(/\D/g, "").slice(0, 12);

    setFormData((prev: any) => ({ ...prev, [name]: processedValue }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Sync URL params
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, processedValue);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const fieldError = (name: string): string => {
    if (!touched[name] || fieldValid[name]) return "";

    const messages: Record<string, string> = {
      name: "Enter at least 3 characters",
      phone: "Enter a valid 10-digit mobile number",
      email: "Enter a valid email address",
      age: "Enter a valid age (1 or above)",
      aadhhar: "Enter a valid 12-digit Aadhaar number",
    };
    return messages[name] || "";
  };

  // Send OTP + Register (Only for guests)
  async function sendRegistrationAndOtp() {
    if (!allFieldsValid || isSubmitting || isAuthenticated) return;

    setIsSubmitting(true);
    setOtpError("");

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        aadhhar: formData.aadhhar,
        passport: formData.passport?.trim() || undefined,
        age: Number(formData.age),
        gender: formData.gender || "male",
        termsAccepted: true,
      };

      const res = await fetch(`${API_BASE_URL}/register-via-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setShowOtpModal(true);
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Verify OTP
  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6 || isSubmitting) return;

    setIsSubmitting(true);
    setOtpError("");

    try {
      const res = await fetch(`${API_BASE_URL}/verify-otp-via-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone, otp: otp.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        const { user, token } = data;

        if (user) localStorage.setItem("userData", JSON.stringify(user));
        setToken(token);   // Uncomment if you want to use auth context setter

        setOtpVerify(true);
        setShowOtpModal(false);
      } else {
        setOtpError(data.message || "Invalid or expired OTP");
      }
    } catch {
      setOtpError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatar}>RK</div>
        <div>
          <h2 style={styles.title}>Patient details</h2>
          <p style={styles.subtitle}>Dr. Rajneesh Kant · Back to Nature Spine Clinic</p>
        </div>
      </div>

      {/* Progress Checklist */}
      <div style={styles.checklist}>
        <p style={styles.checklistTitle}>Complete to continue</p>
        <div style={styles.checkGrid}>
          <CheckItem done={fieldValid.name} label="Full name" />
          <CheckItem done={fieldValid.phone} label="Mobile number" />
          <CheckItem done={fieldValid.email} label="Email address" />
          <CheckItem done={fieldValid.age} label="Age" />
          <CheckItem done={fieldValid.aadhhar} label="Aadhaar number" />
          <CheckItem done={isAuthenticated || otpVerify} label="Phone verified" />
        </div>
      </div>

      {/* Form */}
      <div style={styles.form}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Full name" required error={fieldError("name")}>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Patient's full name"
              style={inputStyle(fieldError("name"), touched.name && fieldValid.name)}
            />
          </Field>
        </div>

        <Field label="Mobile number" required error={fieldError("phone")}>
          <input
            type="tel"
            inputMode="numeric"
            value={formData.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="9876543210"
            maxLength={10}
            style={inputStyle(fieldError("phone"), touched.phone && fieldValid.phone)}
          />
        </Field>

        <Field label="Gender">
          <select
            value={formData.gender || "male"}
            onChange={(e) => updateField("gender", e.target.value)}
            style={styles.input}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="Age" required error={fieldError("age")}>
          <input
            type="tel"
            inputMode="numeric"
            value={formData.age || ""}
            onChange={(e) => updateField("age", e.target.value)}
            placeholder="e.g. 35"
            maxLength={3}
            style={inputStyle(fieldError("age"), touched.age && fieldValid.age)}
          />
        </Field>

        <Field label="Email address" required error={fieldError("email")}>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="patient@example.com"
            style={inputStyle(fieldError("email"), touched.email && fieldValid.email)}
          />
        </Field>

        <Field label="Aadhaar number" required error={fieldError("aadhhar")}>
          <input
            type="text"
            inputMode="numeric"
            value={formData.aadhhar || ""}
            onChange={(e) => updateField("aadhhar", e.target.value)}
            placeholder="1234 5678 9012"
            maxLength={12}
            style={inputStyle(fieldError("aadhhar"), touched.aadhhar && fieldValid.aadhhar)}
          />
        </Field>

        <Field label="Passport number" hint="Optional — for international patients">
          <input
            type="text"
            value={formData.passport || ""}
            onChange={(e) => updateField("passport", e.target.value)}
            placeholder="If applicable"
            style={styles.input}
          />
        </Field>
      </div>

      {/* Status Messages */}
      {isSubmitting && !showOtpModal && (
        <div style={styles.otpSending}>
          <SpinnerIcon />
          <span>Sending OTP to +91 {formData.phone}…</span>
        </div>
      )}

      {(isAuthenticated || otpVerify) && (
        <div style={styles.verifiedBadge}>
          <CheckIcon /> Phone number verified
        </div>
      )}

      {/* OTP Modal - Only shown for non-logged-in users */}
      {showOtpModal && !isAuthenticated && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Verify your phone</h3>
            <p style={styles.modalSub}>
              Enter the 6-digit OTP sent to <strong>+91 {formData.phone}</strong>
            </p>

            <form onSubmit={verifyOtp}>
              <input
                type="tel"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                }}
                placeholder="······"
                maxLength={6}
                autoFocus
                style={styles.otpInput}
              />

              {otpError && <p style={styles.otpError}>{otpError}</p>}

              <button
                type="submit"
                disabled={otp.length !== 6 || isSubmitting}
                style={{
                  ...styles.primaryBtn,
                  opacity: otp.length !== 6 || isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon /> Verifying…
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>

            <button
              onClick={sendRegistrationAndOtp}
              disabled={isSubmitting}
              style={styles.ghostBtn}
            >
              Resend OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Input Style Helper ─── */
function inputStyle(error: string, valid: boolean) {
  return {
    ...styles.input,
    borderColor: error ? "#E24B4A" : valid ? "#639922" : "#D3D1C7",
  };
}

/* ─── Styles ─── */
const styles: any = {
  page: { fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 940, margin: "0 auto", padding: "32px 20px", color: "#2C2C2A" },
  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "#E6F1FB", color: "#185FA5", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: 600, margin: 0 },
  subtitle: { fontSize: 13, color: "#888780", margin: "3px 0 0" },

  checklist: { background: "#F1EFE8", borderRadius: 12, padding: "14px 18px", marginBottom: 28, border: "0.5px solid #D3D1C7" },
  checklistTitle: { fontSize: 12, fontWeight: 600, color: "#5F5E5A", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" },
  checkGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 0" },
  checkItem: { display: "flex", alignItems: "center", gap: 7 },
  checkDot: { width: 20, height: 20, borderRadius: "50%", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center" },

  form: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 20px", marginBottom: 24 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 13, fontWeight: 500, color: "#444441" },
  req: { color: "#A32D2D" },
  hint: { fontSize: 12, minHeight: 16 },
  input: {
    height: 44, padding: "0 12px", fontSize: 14, border: "1.5px solid #D3D1C7",
    borderRadius: 8, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box"
  },

  otpSending: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#185FA5", marginBottom: 16 },
  verifiedBadge: { display: "inline-flex", alignItems: "center", gap: 6, background: "#EAF3DE", color: "#27500A", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 500, marginBottom: 16, border: "0.5px solid #97C459" },

  modalBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: "32px 28px", width: "100%", maxWidth: 400, boxShadow: "0 4px 32px rgba(0,0,0,0.18)" },
  modalTitle: { fontSize: 20, fontWeight: 600, margin: "0 0 6px" },
  modalSub: { fontSize: 14, color: "#5F5E5A", margin: "0 0 22px" },
  otpInput: { width: "100%", height: 60, fontSize: 28, textAlign: "center", letterSpacing: 10, border: "2px solid #D3D1C7", borderRadius: 10, outline: "none", fontFamily: "monospace", marginBottom: 6 },
  otpError: { fontSize: 13, color: "#A32D2D", marginBottom: 12 },
  primaryBtn: { width: "100%", height: 48, background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  ghostBtn: { width: "100%", background: "none", border: "none", color: "#185FA5", fontSize: 13, cursor: "pointer", padding: "8px 0" },
};