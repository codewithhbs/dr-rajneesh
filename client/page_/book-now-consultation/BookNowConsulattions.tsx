"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import ProgressBar from "@/components/booking/progress-bar";
import PatientDetailsStep from "@/components/booking/patient-details-step";
import ServiceStep from "@/components/booking/service-step";
import LocationStep from "@/components/booking/location-step";
import ScheduleStep from "@/components/booking/schedule-step";
import PaymentStep from "@/components/booking/payment-step";

const TOTAL_STEPS = 5;

export default function BookNowConsultations() {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    aadhhar: "",
    passport: "",
    gender: "male" as "male" | "female" | "other",
    age: "",
    guest: false,
  });

  const [otpVerify, setOtpVerify] = useState(false);

  /* ---------------- Step Navigation ---------------- */
  const next = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const prev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  /* ---------------- Form Validation ---------------- */
  const isStep1Valid = useMemo(() => {
    return (
      formData.name.trim().length > 2 &&
      formData.phone.length === 10 &&
      formData.email.trim().includes("@") &&
      formData.aadhhar.trim().length >= 12 &&
      formData.age.trim() !== "" &&
      otpVerify
    );
  }, [formData, otpVerify]);

  /* ---------------- Render Current Step ---------------- */
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PatientDetailsStep
            formData={formData}
            setFormData={setFormData}
            otpVerify={otpVerify}
            setOtpVerify={setOtpVerify}
            onNext={next}
          />
        );
      case 2:
        return <ServiceStep onNext={next} />;
      case 3:
        return <LocationStep onNext={next} />;
      case 4:
        return <ScheduleStep onNext={next} />;
      case 5:
        return <PaymentStep />;
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8F7F4", padding: "40px 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        
        {/* Top Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ 
            display: "inline-block", 
            background: "#E6F1FB", 
            color: "#185FA5", 
            fontSize: 12, 
            fontWeight: 500, 
            borderRadius: 20, 
            padding: "4px 12px", 
            marginBottom: 8, 
            border: "0.5px solid #85B7EB" 
          }}>
            Back to Nature Spine Clinic
          </div>
          
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            margin: 0, 
            color: "#2C2C2A" 
          }}>
            Book Your Consultation
          </h1>
          <p style={{ color: "#5F5E5A", marginTop: 6 }}>
            with Dr. Rajneesh Kant
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} />

        {/* Main Card */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 16, 
          border: "0.5px solid #D3D1C7", 
          overflow: "hidden",
          marginTop: 24 
        }}>
          
          {/* Card Body */}
          <div style={{ padding: "32px 36px" }}>
            {renderStep()}
          </div>

          {/* Card Footer - Navigation */}
          <div style={{ 
            borderTop: "0.5px solid #EAF3DE", 
            padding: "16px 36px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            background: "#FAFAF9" 
          }}>
            
            <button
              onClick={prev}
              disabled={currentStep === 1}
              style={{ 
                background: "none", 
                border: "none", 
                fontSize: 14, 
                color: "#5F5E5A", 
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
                padding: "10px 0",
                opacity: currentStep === 1 ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <ArrowLeft size={18} />
              Previous
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={next}
          
                style={{ 
                  background: "#185FA5", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 8, 
                  height: 44, 
                  padding: "0 28px", 
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: (currentStep === 1 && !isStep1Valid) ? "not-allowed" : "pointer",
                  opacity: (currentStep === 1 && !isStep1Valid) ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={() => alert("Proceeding to Payment...")} // Replace with real payment flow
                style={{ 
                  background: "#185FA5", 
                  color: "#fff", 
                  border: "none", 
                  borderRadius: 8, 
                  height: 44, 
                  padding: "0 32px", 
                  fontSize: 14, 
                  fontWeight: 600, 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                Proceed to Payment
              </button>
            )}
          </div>
        </div>

        {/* Step Counter */}
        <div style={{ 
          textAlign: "center", 
          fontSize: 13, 
          color: "#B4B2A9", 
          marginTop: 16 
        }}>
          Step {currentStep} of {TOTAL_STEPS}
        </div>
      </div>
    </div>
  );
}