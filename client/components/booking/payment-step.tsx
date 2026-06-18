"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { format } from "date-fns";

import { useSettings } from "@/hooks/use-settings";
import { useGetAllClinic } from "@/hooks/common";
import { useService } from "@/hooks/use-service";

const API_ENDPOINT = "http://localhost:7900/api/v1";

const convertTo24Hour = (time: string): string => {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const useAddOns = () => {
  const [addOns, setAddOns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddOns = async () => {
      try {
        const response = await axios.get(`${API_ENDPOINT}/add-on`);
        if (response.data.success) {
          const activeAddOns = response.data.data
            .filter((addon: any) => addon.is_active)
            .sort((a: any, b: any) => a.position - b.position);
          setAddOns(activeAddOns);
        }
      } catch (error) {
        console.error("Failed to fetch add-ons:", error);
        setAddOns([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAddOns();
  }, []);

  return { addOns, loading };
};

export default function PaymentBookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { settings } = useSettings();
  const { data: clinicsData } = useGetAllClinic();
  const { services } = useService();
  const { addOns, loading: addOnsLoading } = useAddOns();

  const [bookingData, setBookingData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    clinic: "",
    date: "",
    time: "",
    sessions: 1,
    paymentMethod: "pay_at_clinic" as "razorpay" | "phonepe" | "pay_at_clinic",
    addons: [] as string[],
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Load data from URL query params
  useEffect(() => {
    const urlData = {
      name: searchParams.get("name") || "",
      phone: searchParams.get("phone") || "",
      email: searchParams.get("email") || "",
      service: searchParams.get("service") || "",
      clinic: searchParams.get("clinic") || "",
      date: searchParams.get("date") || "",
      time: searchParams.get("time") || "",
      sessions: parseInt(searchParams.get("sessions") || "1"),
      paymentMethod: (searchParams.get("paymentMethod") || "pay_at_clinic") as
        | "razorpay"
        | "phonepe"
        | "pay_at_clinic",
      addons: searchParams.get("addons")?.split(",").filter(Boolean) || [],
    };

    setBookingData(urlData);
  }, [searchParams]);

  const selectedClinic = clinicsData?.find((c: any) => c._id === bookingData.clinic);
  const selectedService = services?.find((s: any) => s._id === bookingData.service);

  const toggleAddon = (id: string) => {
    setBookingData((prev) => ({
      ...prev,
      addons: prev.addons.includes(id)
        ? prev.addons.filter((x) => x !== id)
        : [...prev.addons, id],
    }));
  };

  // Calculate Pricing
  const calculatePricing = useCallback(() => {
    const basePrice = selectedService?.service_per_session_discount_price ||
                     selectedService?.service_per_session_price || 10000;

    const subtotal = basePrice * bookingData.sessions;

    const addonsTotal = addOns
      .filter((a: any) => bookingData.addons.includes(a._id))
      .reduce((sum, a: any) => sum + (a.price || 0), 0);

    const taxPercentage = settings?.payment_config?.tax_percentage || 0;
    const creditCardFeePercentage = bookingData.paymentMethod === "razorpay" 
      ? (settings?.payment_config?.credit_card_fee || 0) 
      : 0;

    const taxAmount = (subtotal + addonsTotal) * (taxPercentage / 100);
    const creditCardFee = (subtotal + addonsTotal) * (creditCardFeePercentage / 100);

    const total = subtotal + addonsTotal + taxAmount + creditCardFee;

    return {
      subtotal: Math.round(subtotal),
      addonsTotal: Math.round(addonsTotal),
      tax: Math.round(taxAmount),
      creditCardFee: Math.round(creditCardFee),
      total: Math.round(total),
    };
  }, [bookingData, selectedService, addOns, settings]);

  const pricing = calculatePricing();

  const handleBookingSubmit = async () => {
    try {
      setIsProcessing(true);

      const token = Cookies.get("token");
      if (!token) {
        toast.error("Please login to continue");
        return;
      }

      const formattedDate = format(new Date(bookingData.date), "yyyy-MM-dd");
      const formattedTime = convertTo24Hour(bookingData.time);

      const payload = {
        service_id: bookingData.service,
        clinic_id: bookingData.clinic,
        date: formattedDate,
        time: formattedTime,
        sessions: bookingData.sessions,
        payment_method: bookingData.paymentMethod,
        patient_details: {
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
        },
        addons: bookingData.addons,
      };

      const response = await axios.post(
        `${API_ENDPOINT}/user/bookings/sessions`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Booking failed");
      }

      const { booking, gatewayData } = response.data.data || {};
      const bookingId = booking?.id;

      if (!bookingId) throw new Error("Booking ID not received");

      if (gatewayData?.method === "pay_at_clinic") {
        router.push(`/booking-success?bookingId=${bookingId}`);
        return;
      }

      if (gatewayData?.method === "razorpay") {
        // openRazorpayCheckout(gatewayData, bookingId);
        return;
      }

      if (gatewayData?.method === "phonepe" && gatewayData.redirect_url) {
        window.location.href = gatewayData.redirect_url;
        return;
      }

      toast.error("Invalid payment method response");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error?.response?.data?.message || error.message || "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#F8F7F4", 
      padding: "40px 16px", 
      fontFamily: "system-ui, -apple-system, sans-serif" 
    }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ 
            display: "inline-block", 
            background: "#E6F1FB", 
            color: "#185FA5", 
            fontSize: 12, 
            fontWeight: 500, 
            borderRadius: 20, 
            padding: "4px 14px", 
            marginBottom: 12, 
            border: "0.5px solid #85B7EB" 
          }}>
            Final Step
          </div>
          
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: "#2C2C2A", 
            margin: "0 0 8px 0" 
          }}>
            Complete Your Booking
          </h1>
          <p style={{ color: "#5F5E5A", fontSize: 15 }}>
            Review details, choose add-ons & payment method
          </p>
        </div>

        {/* Main Card */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 16, 
          border: "0.5px solid #D3D1C7", 
          overflow: "hidden" 
        }}>

          {/* Booking Summary Bar */}
          <div style={{ 
            background: "#FAFAF9", 
            padding: "20px 32px", 
            borderBottom: "0.5px solid #EAF3DE" 
          }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12, color: "#2C2C2A" }}>
              Booking Summary
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 14 }}>
              <div>
                <span style={{ color: "#5F5E5A" }}>Patient</span>
                <p style={{ fontWeight: 600 }}>{bookingData.name}</p>
              </div>
              <div>
                <span style={{ color: "#5F5E5A" }}>Service</span>
                <p style={{ fontWeight: 600 }}>{selectedService?.service_name}</p>
              </div>
              <div>
                <span style={{ color: "#5F5E5A" }}>Clinic</span>
                <p style={{ fontWeight: 600 }}>{selectedClinic?.clinic_name}</p>
              </div>
              <div>
                <span style={{ color: "#5F5E5A" }}>Schedule</span>
                <p style={{ fontWeight: 600 }}>
                  {bookingData.date ? format(new Date(bookingData.date), "dd MMM yyyy") : "—"} • {bookingData.time}
                </p>
                <p style={{ fontSize: 13, color: "#B4B2A9" }}>
                  {bookingData.sessions} session(s)
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: "32px 36px" }}>

            {/* Add-ons Section */}
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: "#2C2C2A", 
                marginBottom: 16 
              }}>
                Add-On Treatments (Optional)
              </h3>

              {addOnsLoading ? (
                <p style={{ textAlign: "center", color: "#B4B2A9", padding: "40px 0" }}>
                  Loading add-ons...
                </p>
              ) : addOns.length === 0 ? (
                <p style={{ textAlign: "center", color: "#B4B2A9", padding: "40px 0" }}>
                  No add-ons available
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {addOns.map((addon: any) => {
                    const isChecked = bookingData.addons.includes(addon._id);
                    return (
                      <div
                        key={addon._id}
                        onClick={() => toggleAddon(addon._id)}
                        style={{
                          padding: "16px 20px",
                          borderRadius: 12,
                          border: isChecked ? "1.5px solid #185FA5" : "0.5px solid #D3D1C7",
                          background: isChecked ? "#F0F7FF" : "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 20, 
                            height: 20, 
                            borderRadius: 4, 
                            border: isChecked ? "2px solid #185FA5" : "2px solid #B4B2A9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {isChecked && <CheckCircle2 size={14} style={{ color: "#185FA5" }} />}
                          </div>
                          <span style={{ fontWeight: 500 }}>{addon.title}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: "#185FA5" }}>
                          ₹{addon.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment Method & Total */}
            <div>
              <h3 style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                color: "#2C2C2A", 
                marginBottom: 16 
              }}>
                Payment Method
              </h3>

              <div 
                onClick={() => setBookingData(prev => ({ ...prev, paymentMethod: "pay_at_clinic" }))}
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  border: bookingData.paymentMethod === "pay_at_clinic" 
                    ? "2px solid #185FA5" 
                    : "0.5px solid #D3D1C7",
                  background: bookingData.paymentMethod === "pay_at_clinic" ? "#F0F7FF" : "#fff",
                  cursor: "pointer",
                  marginBottom: 24
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Clock size={28} style={{ color: "#185FA5" }} />
                  <div>
                    <p style={{ fontWeight: 600 }}>Pay at Clinic</p>
                    <p style={{ fontSize: 14, color: "#5F5E5A" }}>
                      Pay when you visit the clinic on the day of appointment
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Breakdown */}
              <div style={{ 
                background: "#FAFAF9", 
                borderRadius: 12, 
                padding: "24px", 
                border: "0.5px solid #EAF3DE" 
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "#5F5E5A" }}>Base Amount ({bookingData.sessions} sessions)</span>
                  <span>₹{pricing.subtotal}</span>
                </div>

                {pricing.addonsTotal > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "#5F5E5A" }}>Add-ons</span>
                    <span>₹{pricing.addonsTotal}</span>
                  </div>
                )}

                {pricing.tax > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ color: "#5F5E5A" }}>Tax</span>
                    <span>₹{pricing.tax}</span>
                  </div>
                )}

                <div style={{ 
                  borderTop: "1px solid #D3D1C7", 
                  paddingTop: 16, 
                  marginTop: 8,
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: 18, 
                  fontWeight: 700 
                }}>
                  <span>Total Payable</span>
                  <span style={{ color: "#185FA5" }}>₹{pricing.total}</span>
                </div>
              </div>

              <button
                onClick={handleBookingSubmit}
                disabled={isProcessing}
                style={{
                  width: "100%",
                  background: "#185FA5",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  height: 52,
                  fontSize: 16,
                  fontWeight: 600,
                  marginTop: 32,
                  cursor: isProcessing ? "not-allowed" : "pointer",
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? "Processing..." : `Confirm Booking - ₹${pricing.total}`}
              </button>
            </div>
          </div>
        </div>

        <div style={{ 
          textAlign: "center", 
          marginTop: 24, 
          fontSize: 13, 
          color: "#B4B2A9" 
        }}>
          Secure booking • Powered by Dr. Rajneesh Kant Clinic
        </div>
      </div>
    </div>
  );
}