"use client";

import React, { useEffect, useRef, useState } from "react";

const API_BASE_URL = "http://localhost:7900/api/v1/full/user";

const SpinnerIcon = () => (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
        <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
);

type PayState = "idle" | "creating_booking" | "redirecting" | "verifying" | "failed" | "success";

export default function PaymentStep({ token, formData, setFormData, onNext, onBack }: any) {
    const [state, setState] = useState<PayState>("idle");
    const [error, setError] = useState("");
    const popupRef = useRef<Window | null>(null);

    const price = formData.serviceDiscountPrice > 0
        ? formData.serviceDiscountPrice
        : formData.servicePrice;

    // Listen for redirect-window postMessage when ICICI returns to our returnURL page
    useEffect(() => {
        function handleMessage(e: MessageEvent) {
            if (e.data?.type !== "ICICI_PAYMENT_RETURN") return;
            if (popupRef.current) popupRef.current.close();
            verifyPayment(e.data.merchantTxnNo);
        }
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [formData.bookingId]);

    async function createBookingIfNeeded(): Promise<string | null> {
        if (formData.bookingId) return formData.bookingId;

        setState("creating_booking");
        setError("");

        try {
            const res = await fetch(`${API_BASE_URL}/booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    serviceId: formData.serviceId,
                    appointmentDate: formData.appointmentDate,
                    appointmentTime: formData.appointmentTime,
                    chiefComplaint: formData.chiefComplaint || "",
                    notes: formData.notes || "",
                    clinic:formData?.clinic ||null,
                    selectedIncludedServices: formData.selectedIncludedServices || []
                }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.message || "Could not create booking. Please go back and recheck your slot.");
                setState("failed");
                return null;
            }

            setFormData((prev: any) => ({
                ...prev,
                bookingId: data.data._id,
                bookingRefId: data.data.bookingId,
            }));

            return data.data._id;
        } catch {
            setError("Network error while creating booking.");
            setState("failed");
            return null;
        }
    }

    async function startPayment() {
        setError("");
        const bookingId = await createBookingIfNeeded();
        if (!bookingId) return;

        setState("redirecting");

        try {
            const res = await fetch(`${API_BASE_URL}/payment/initiate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify({ bookingId, amount: price }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.message || "Could not start payment.");
                setState("failed");
                return;
            }

            setFormData((prev: any) => ({
                ...prev,
                merchantTxnNo: data.data.merchantTxnNo,
            }));

            const redirectURI = data.data.redirectURI;
            const tranCtx = data.data.tranCtx;

            if (!redirectURI) {
                setError("Payment gateway did not return a redirect link.");
                setState("failed");
                return;
            }
            const url = `${redirectURI}?tranCtx=${tranCtx}`

            const paymentUrl =
                `${redirectURI}?tranCtx=${tranCtx}`;

            window.location.assign(paymentUrl);

        } catch {
            setError("Network error while initiating payment.");
            setState("failed");
        }
    }

    async function verifyPayment(merchantTxnNo: string) {
        setState("verifying");
        setError("");

        try {
            const res = await fetch(`${API_BASE_URL}/payment/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify({
                    bookingId: formData.bookingId,
                    merchantTxnNo,
                }),
            });
            const data = await res.json();

            if (data.success && data.paymentSuccess) {
                setState("success");
                setFormData((prev: any) => ({ ...prev, paymentVerified: true }));
                setTimeout(() => onNext(), 800);
            } else {
                setError("Payment was not successful. You can try again.");
                setState("failed");
            }
        } catch {
            setError("Could not verify payment. If money was deducted, contact support with your booking ID.");
            setState("failed");
        }
    }

    const busy = state === "creating_booking" || state === "redirecting" || state === "verifying";

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.avatar}>RK</div>
                <div>
                    <h2 style={styles.title}>Confirm & pay</h2>
                    <p style={styles.subtitle}>Dr. Rajneesh Kant · Back to Nature Spine Clinic</p>
                </div>
            </div>

            <div style={styles.summaryCard}>
                <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Treatment</span>
                    <span style={styles.summaryValue}>{formData.serviceTitle}</span>
                </div>
                <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Patient</span>
                    <span style={styles.summaryValue}>{formData.name}</span>
                </div>
                <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Date</span>
                    <span style={styles.summaryValue}>{formData.appointmentDate}</span>
                </div>
                <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>Time</span>
                    <span style={styles.summaryValue}>{formData.appointmentTime}</span>
                </div>
                <div style={styles.divider} />
                <div style={styles.summaryRow}>
                    <span style={styles.summaryTotalLabel}>Amount payable</span>
                    <span style={styles.summaryTotalValue}>₹{price}</span>
                </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {state === "success" && (
                <div style={styles.successBox}>Payment verified. Confirming your booking…</div>
            )}

            <div style={styles.footer}>
                <button onClick={onBack} disabled={busy} style={styles.backBtn}>Back</button>
                <button
                    onClick={startPayment}
                    disabled={busy || state === "success"}
                    style={{ ...styles.payBtn, opacity: busy ? 0.7 : 1 }}
                >
                    {busy ? (
                        <>
                            <SpinnerIcon />
                            {state === "creating_booking" && "Creating booking…"}
                            {state === "redirecting" && "Opening payment…"}
                            {state === "verifying" && "Verifying payment…"}
                        </>
                    ) : (
                        `Pay ₹${price}`
                    )}
                </button>
            </div>

            <p style={styles.secureNote}>Payments are processed securely via ICICI Bank Orange PG.</p>
        </div>
    );
}

const styles: any = {
    page: { fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 940, margin: "0 auto", padding: "32px 20px", color: "#2C2C2A" },
    header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
    avatar: { width: 48, height: 48, borderRadius: "50%", background: "#E6F1FB", color: "#185FA5", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    subtitle: { fontSize: 13, color: "#888780", margin: "3px 0 0" },

    summaryCard: { border: "1.5px solid #D3D1C7", borderRadius: 14, padding: "20px 22px", marginBottom: 20, maxWidth: 460 },
    summaryRow: { display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 14 },
    summaryLabel: { color: "#888780" },
    summaryValue: { fontWeight: 500 },
    divider: { height: 1, background: "#E8E6DD", margin: "8px 0" },
    summaryTotalLabel: { fontWeight: 600, fontSize: 15 },
    summaryTotalValue: { fontWeight: 700, fontSize: 19, color: "#185FA5" },

    errorBox: { background: "#FBEAEA", border: "0.5px solid #E24B4A", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#A32D2D", marginBottom: 20, maxWidth: 460 },
    successBox: { background: "#EAF3DE", border: "0.5px solid #97C459", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#27500A", marginBottom: 20, maxWidth: 460 },

    footer: { display: "flex", justifyContent: "space-between", marginTop: 8, maxWidth: 460 },
    backBtn: { height: 48, padding: "0 24px", background: "transparent", color: "#5F5E5A", border: "1.5px solid #D3D1C7", borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: "pointer" },
    payBtn: { height: 48, padding: "0 32px", background: "#185FA5", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },

    secureNote: { fontSize: 12, color: "#A8A6A0", marginTop: 16 },
};