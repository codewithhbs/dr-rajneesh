"use client";

import React, { useState, useCallback, useMemo } from "react";

import LocationStep from "@/components/booking/location-step";
import PatientDetailsStep from "@/components/booking/patient-details-step";
import PaymentStep from "@/components/booking/payment-step";
import ProgressBar from "@/components/booking/progress-bar";
import ScheduleStep from "@/components/booking/schedule-step";
import ServiceStep from "@/components/booking/service-step";

const TOTAL_STEPS = 5;

export default function BookNowConsultations() {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    aadhhar: "",
    passport: "",
    gender: "male",
    age: "",
    guest: false,
  });

  const [otpVerify, setOtpVerify] = useState(false);

  /* ---------------- Step Navigation ---------------- */

  const next = useCallback(() => {
    setCurrentStep((prev) =>
      prev < TOTAL_STEPS ? prev + 1 : prev
    );
  }, []);

  const prev = useCallback(() => {
    setCurrentStep((prev) =>
      prev > 1 ? prev - 1 : prev
    );
  }, []);

  /* ---------------- Form Validation ---------------- */

  const isFormComplete = useMemo(() => {
    return (
      formData.name.trim() !== "" &&
      formData.phone.length === 10 &&
      formData.email.trim() !== "" &&
      formData.aadhhar.trim() !== "" &&
      formData.age.trim() !== ""
    );
  }, [formData]);

  /* ---------------- Render Step ---------------- */

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PatientDetailsStep
            formData={formData}
            setFormData={setFormData}
            otpVerify={otpVerify}
            setOtpVerify={setOtpVerify}
            next={next}
          />
        );

      case 2:
        return <ServiceStep />;

      case 3:
        return <LocationStep />;

      case 4:
        return <ScheduleStep />;

      case 5:
        return <PaymentStep />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <ProgressBar currentStep={currentStep} />

        {renderStep()}

        {/* ---------------- Navigation Buttons ---------------- */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prev}
            disabled={currentStep === 1}
            className="px-4 py-2 rounded bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>

          <button
            onClick={next}
            disabled={
              currentStep === TOTAL_STEPS ||
              (currentStep === 1 && (!isFormComplete || !otpVerify))
            }
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
