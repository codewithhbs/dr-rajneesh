"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

// This page must be hosted at the route configured as ICICI_RETURN_URL.
// e.g. https://drrajneeshkant.in/payment/return -> app/payment/return/page.tsx
export default function PaymentReturnPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Finishing up your payment…");

  useEffect(() => {
    const merchantTxnNo =
      searchParams.get("merchantTxnNo") ||
      searchParams.get("merchantTxnNo".toLowerCase()) ||
      "";

    if (window.opener) {
      window.opener.postMessage(
        { type: "ICICI_PAYMENT_RETURN", merchantTxnNo },
        "*"
      );
      setStatus("Payment received. You can close this window.");
      setTimeout(() => window.close(), 1200);
    } else {
      setStatus("Payment received. Please return to the booking tab.");
    }
  }, [searchParams]);

  return (
    <div style={styles.page}>
      <p style={styles.text}>{status}</p>
    </div>
  );
}

const styles: any = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" },
  text: { fontSize: 15, color: "#444441" },
};