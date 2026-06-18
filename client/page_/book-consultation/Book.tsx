"use client";

import React, { useState } from "react";
import ServiceSelectStep from "./ServiceSelectStep";
import PatientDetailsStep from "./PatientDetailsStep";
import DateTimeStep from "./DateTimeStep";
import LocationStep from "./LocationStep";
import PaymentStep from "./PaymentStep";
import ConfirmationStep from "./ConfirmationStep";
import IncludedServicesStep from "./IncludedServicesStep";
import Cookies from "js-cookie";

const STEPS = [
  { key: "service", label: "Treatment" },
  { key: "included", label: "Included Services" },
  { key: "details", label: "Patient details" },
  { key: "datetime", label: "Date & time" },
  { key: "location", label: "Clinic location" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Confirmed" },
];

const Book = () => {
  const cookieToken = Cookies.get("token");
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    gender: "male",
    selectedIncludedServices: [],
  });

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="pt-20 pb-5">
      <ProgressBar steps={STEPS} current={step} />

      {step === 0 && (
        <ServiceSelectStep
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
        />
      )}

      {step === 1 && (
        <IncludedServicesStep
          formData={formData}
          token={cookieToken}
          setFormData={setFormData}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {step === 2 && (
        <PatientDetailsStep
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
          token={cookieToken}
          onBack={goBack}
        />
      )}

      {step === 3 && (
        <DateTimeStep
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
          token={cookieToken}
          onBack={goBack}
        />
      )}

      {step === 4 && (   // ← New step
        <LocationStep
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
          token={cookieToken}
          onBack={goBack}
        />
      )}

      {step === 5 && (
        <PaymentStep
          formData={formData}
          setFormData={setFormData}
          onNext={goNext}
          token={cookieToken}
          onBack={goBack}
        />
      )}

      {step === 6 && (
        <ConfirmationStep token={cookieToken} formData={formData} />
      )}
    </div>
  );
};

function ProgressBar({ steps, current }: any) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.track}>
        {steps.map((s: any, i: number) => {
          const done = i < current;
          const active = i === current;
          return (
            <React.Fragment key={s.key}>
              <div style={styles.stepItem}>
                <div
                  style={{
                    ...styles.dot,
                    background: done ? "#639922" : active ? "#185FA5" : "#fff",
                    borderColor: done ? "#639922" : active ? "#185FA5" : "#D3D1C7",
                    color: done || active ? "#fff" : "#888780",
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    ...styles.stepLabel,
                    color: active ? "#185FA5" : done ? "#27500A" : "#888780",
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    ...styles.connector,
                    background: i < current ? "#639922" : "#D3D1C7",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const styles: any = {
  wrapper: { maxWidth: 940, margin: "0 auto", padding: "0 20px 28px" },
  track: { display: "flex", alignItems: "center" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 64 },
  dot: { width: 30, height: 30, borderRadius: "50%", border: "1.5px solid", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 },
  stepLabel: { fontSize: 11.5, textAlign: "center", whiteSpace: "nowrap" },
  connector: { flex: 1, height: 2, marginBottom: 22 },
};

export default Book;