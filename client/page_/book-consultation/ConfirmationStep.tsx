"use client";

import React from "react";

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7L5.5 10L11.5 4" />
  </svg>
);

export default function ConfirmationStep({ formData }: any) {
  return (
    <div style={styles.page}>
      <div style={styles.center}>
        <div style={styles.successCircle}>
          <CheckIcon />
        </div>

        <h2 style={styles.title}>Booking confirmed</h2>
        <p style={styles.subtitle}>
          Your appointment with Dr. Rajneesh Kant has been booked successfully.
        </p>

        <div style={styles.card}>
          <div style={styles.row}>
            <span style={styles.label}>Booking ID</span>
            <span style={styles.value}>{formData.bookingRefId}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Treatment</span>
            <span style={styles.value}>{formData.serviceTitle}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Date</span>
            <span style={styles.value}>{formData.appointmentDate}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Time</span>
            <span style={styles.value}>{formData.appointmentTime}</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>Patient</span>
            <span style={styles.value}>{formData.name}</span>
          </div>
        </div>

        <p style={styles.note}>
          A confirmation has been sent to {formData.email}. Please arrive 10 minutes early.
        </p>

        <a href="/" style={styles.homeBtn}>Back to home</a>
      </div>
    </div>
  );
}

const styles: any = {
  page: { fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 940, margin: "0 auto", padding: "48px 20px", color: "#2C2C2A" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" },
  successCircle: { width: 64, height: 64, borderRadius: "50%", background: "#639922", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700, margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "#5F5E5A", margin: "0 0 28px", maxWidth: 380 },

  card: { border: "1.5px solid #D3D1C7", borderRadius: 14, padding: "20px 26px", width: "100%", maxWidth: 420, marginBottom: 24, textAlign: "left" },
  row: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, borderBottom: "1px solid #F1EFE8" },
  label: { color: "#888780" },
  value: { fontWeight: 600 },

  note: { fontSize: 13, color: "#888780", marginBottom: 28, maxWidth: 380 },
  homeBtn: { height: 46, padding: "0 32px", background: "#185FA5", color: "#fff", borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" },
};