"use client";

import { useGetAllClinic } from "@/hooks/common";
import { useServiceBySlug } from "@/hooks/use-service";
import { useSettings } from "@/hooks/use-settings";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Clock,
    MapPin,
    User,
    CreditCard,
    CalendarIcon,
    Sparkles,
    Heart,
    Shield,

    Phone,
    Mail,
    UserCheck,
    CheckCircle,
    FileDigit,
} from "lucide-react";
import { API_ENDPOINT } from "@/constant/url";
import Cookies from "js-cookie";
import axios from "axios";

import { useBookingForm } from "@/hooks/use-booking-form";
import type {
    Clinic,
    BookingFormData,
    BookingAvailability,
    PricingBreakdown,
} from "@/types/booking";
import { PaymentStatusModal } from "@/components/models/payment-status-modal";
import Image from "next/image";
import { drImageurl } from "@/constant/Images";

interface EnhancedBookingsProps {
    searchParams: unknown;
}
export enum BookingStep {
    SELECTION = 1,
    CONFIRMATION = 2,
    PAYMENT = 3,
    SUCCESS = 4,
}
const EnhancedBookings = ({ searchParams }: EnhancedBookingsProps) => {
    const parsedParams = useMemo(() => {
        try {
            return typeof searchParams === "string"
                ? JSON.parse(searchParams)
                : searchParams;
        } catch (e) {
            console.error("Invalid searchParams:", e);
            return {};
        }
    }, [searchParams]);

    const sessions = Number.parseInt(parsedParams.sessions) || 1;
    const service = parsedParams.service || "N/A";

    // Your original hooks
    const { service: dbService, loading: serviceLoading } =
        useServiceBySlug(service);
    const { settings, loading: settingLoading } = useSettings();
    const { data: clinics, loading: isClinicLoading } = useGetAllClinic();

    // State management
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("razorpay");
    const [isProcessing, setIsProcessing] = useState(false);

    const [bookingStep, setBookingStep] = useState<BookingStep>(
        BookingStep.SELECTION
    );
    const [pastBookingData, setPastBookingData] =
        useState<BookingAvailability | null>(null);
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean;
        status: "success" | "failed" | "processing";
        error?: string;
    }>({ isOpen: false, status: "processing" });

    // Your original availability check function
    const checkAvailability = useCallback(async () => {
        if (
            !selectedDate ||
            !selectedTime ||
            !dbService?._id ||
            !selectedClinic?._id
        )
            return;

        const cookieToken = Cookies.get("token");
        setIsCheckingAvailability(true);
        const formattedDate = format(selectedDate, "yyyy-MM-dd");

        try {
            const response = await axios.post(
                `${API_ENDPOINT}/user/bookings/availability`,
                {
                    date: formattedDate,
                    time: selectedTime,
                    service_id: dbService._id,
                    clinic_id: selectedClinic._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${cookieToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setPastBookingData(response.data?.data);
        } catch (err: unknown) {
            console.log("err?.response?.data?.message", err);
            setPastBookingData({
                available: false,
                message: "Failed to check availability",
            });
        } finally {
            setIsCheckingAvailability(false);
        }
    }, [selectedDate, selectedTime, dbService?._id, selectedClinic?._id]);

    useEffect(() => {
        checkAvailability();
    }, []);

    // Your original time slot generation
    function timeToMinutes(timeString: string) {
        const [hours, minutes] = timeString.split(":").map(Number);
        return hours * 60 + minutes;
    }

    function generateTimeSlots(startTime: string, endTime: string) {
        if (!settings?.booking_config?.slots_per_hour) return [];

        const slots = [];
        const minutesPerSlot = 60 / settings.booking_config.slots_per_hour;

        let currentTime = timeToMinutes(startTime);
        const endTimeMinutes = timeToMinutes(endTime);

        while (currentTime < endTimeMinutes) {
            const hours = Math.floor(currentTime / 60);
            const minutes = currentTime % 60;
            const timeString = `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}`;
            slots.push(timeString);
            currentTime += minutesPerSlot;
        }

        return slots;
    }

    // Your original pricing calculation
    const calculatePricing = useCallback(
        (data: Partial<BookingFormData>): PricingBreakdown => {
            if (!dbService || !settings)
                return { subtotal: 0, tax: 0, creditCard: 0, total: 0 };

            const basePrice =
                dbService.service_per_session_discount_price ||
                dbService.service_per_session_price;
            const subtotal = basePrice * sessions;

            const taxAmount =
                (subtotal * (settings.payment_config?.tax_percentage || 0)) / 100;

            const creditCardAmount =
                data.payment_method === "card"
                    ? (subtotal * (settings.payment_config?.credit_card_fee || 0)) / 100
                    : 0;

            const total = subtotal + taxAmount + creditCardAmount;

            return {
                subtotal,
                tax: taxAmount,
                creditCard: creditCardAmount,
                total,
            };
        },
        [dbService, settings, sessions]
    );

    // Auto-select first available clinic and set default date/time
    useEffect(() => {
        if (clinics && clinics.length > 0 && !selectedClinic) {
            const firstClinic = clinics[0];
            setSelectedClinic(firstClinic);

            // Set default date based on clinic availability
            if (firstClinic.BookingAvailabeAt) {
                const startDate = new Date(firstClinic.BookingAvailabeAt.start_date);
                const today = new Date();
                const defaultDate = startDate > today ? startDate : today;
                setSelectedDate(defaultDate);
            } else {
                setSelectedDate(new Date());
            }
        }
    }, [clinics, selectedClinic]);

    // Auto-select current time slot if available
    useEffect(() => {
        if (settings && selectedDate && !selectedTime) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeInMinutes = currentHour * 60 + currentMinute;

            const availableSlots = generateTimeSlots("09:00", "18:00");
            const nearestSlot = availableSlots.find((slot) => {
                const slotMinutes = timeToMinutes(slot);
                return slotMinutes >= currentTimeInMinutes;
            });

            if (nearestSlot) {
                setSelectedTime(nearestSlot);
            } else if (availableSlots.length > 0) {
                setSelectedTime(availableSlots[0]);
            }
        }
    }, [settings, selectedDate, selectedTime]);

    // Check if selected date is available for the clinic
    const isDateAvailable = (date: Date) => {
        if (!selectedClinic?.BookingAvailabeAt) return true;

        const startDate = new Date(selectedClinic.BookingAvailabeAt.start_date);
        const endDate = new Date(selectedClinic.BookingAvailabeAt.end_date);

        return date >= startDate && date <= endDate;
    };





    const handleBookingSubmit = useCallback(
        async (data: BookingFormData) => {
            console.log("🚀 Booking submission started", {
                timestamp: new Date().toISOString(),
                formData: data,
                sessions,
            });

            setIsProcessing(true);
            const cookieToken = Cookies.get("token");
            let bookingId = null;
            let paymentId = null;

            try {
                // Format date
                const formattedDate = data?.date
                    ? format(new Date(data.date), "yyyy-MM-dd")
                    : "";

                console.log("📅 Date formatted", {
                    originalDate: data?.date,
                    formattedDate
                });

                // Calculate payment details
                const paymentDetails = calculatePricing(data);
                console.log("💰 Payment details calculated", paymentDetails);

                // Prepare complete payload
                const completeData = {
                    ...data,
                    date: formattedDate,
                    paymentDetails,
                    sessions,
                };

                console.log("📦 Complete payload prepared", {
                    dataKeys: Object.keys(completeData),
                    paymentAmount: paymentDetails?.amount || 'N/A'
                });

                // Make booking request
                console.log("🌐 Making booking API request to:", `${API_ENDPOINT}/user/bookings/sessions`);

                const response = await axios.post(
                    `${API_ENDPOINT}/user/bookings/sessions`,
                    completeData,
                    {
                        headers: {
                            Authorization: `Bearer ${cookieToken}`,
                        },
                    }
                );

                console.log("✅ Booking API response received", {
                    status: response.status,
                    success: response.data?.success,
                    dataKeys: Object.keys(response.data?.data || {}),
                });

                const { booking, payment } = response.data?.data;
                bookingId = booking?.id;
                paymentId = payment?.id;

                console.log("🎫 Booking and payment IDs extracted", {
                    bookingId,
                    paymentId,
                    paymentAmount: payment?.amount,
                    paymentKey: payment?.key
                });

                if (response.data.success) {
                    // Show processing modal
                    setPaymentModal({ isOpen: true, status: "processing" });
                    console.log("🔄 Payment modal set to processing");

                    // Construct callback URL with enhanced logging parameters
                    const callbackUrl = `${API_ENDPOINT}/user/bookings/verify-payment?&booking_id=${bookingId}&payment_id=${paymentId}`;

                    console.log("🔗 Callback URL constructed", { callbackUrl });

                    const options: unknown = {
                        key: payment?.key || "rzp_test_demo_key",
                        amount: payment?.amount * 100,
                        currency: "INR",
                        name: "🏥 Dr. Rajneesh Kant Clinic",
                        description: `${dbService?.service_name} - ${sessions} Session(s)`,
                        order_id: payment?.orderId || undefined,
                        redirect: true,
                        callback_url: callbackUrl,

                        prefill: {
                            name: data.patient_details.name,
                            email: data.patient_details.email,
                            contact: data.patient_details.phone,
                        },
                        theme: {
                            color: "#3B82F6",
                        },
                        handler: function (response: unknown) {
                            console.log("💳 Razorpay payment success handler", {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature ? "present" : "missing",
                                timestamp: new Date().toISOString()
                            });

                            // Log successful payment and redirect
                            console.log("🎉 Payment completed successfully, redirecting...");

                            // Redirect to success page or callback URL
                            window.location.href = callbackUrl + `&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}`;
                        },
                        modal: {
                            ondismiss: async () => {
                                console.log("❌ Payment modal dismissed by user", {
                                    bookingId,
                                    paymentId,
                                    timestamp: new Date().toISOString()
                                });

                                try {
                                    console.log("📡 Reporting payment cancellation to server");

                                    const cancellationResponse = await axios.post(
                                        `${API_ENDPOINT}/user/bookings/payment-failed`,
                                        {
                                            booking_id: bookingId,
                                            payment_id: paymentId,
                                            error_description: "Payment was cancelled by the user.",
                                            cancellation_reason: "user_dismissed_modal",
                                            timestamp: new Date().toISOString()
                                        },
                                        {
                                            headers: {
                                                Authorization: `Bearer ${cookieToken}`,
                                            },
                                        }
                                    );

                                    console.log("✅ Payment cancellation reported successfully", {
                                        status: cancellationResponse.status,
                                        data: cancellationResponse.data
                                    });

                                    setPaymentModal({
                                        isOpen: true,
                                        status: "failed",
                                        error: "Payment was cancelled by the user.",
                                    });
                                } catch (err: unknown) {
                                    console.error("🚨 Error reporting payment cancellation:", {
                                        error: err.message,
                                        status: err.response?.status,
                                        data: err.response?.data,
                                        timestamp: new Date().toISOString()
                                    });

                                    setPaymentModal({
                                        isOpen: true,
                                        status: "failed",
                                        error: "Payment cancelled. Could not notify server.",
                                    });
                                }
                            },
                            escape: false,
                            backdropclose: false
                        },
                        retry: {
                            enabled: true,
                            max_count: 3
                        },
                        timeout: 600, // 10 minutes timeout
                        remember_customer: false
                    };

                    // Restrict to card payment if selected
                    if (data.payment_method === "card") {
                        console.log("💳 Restricting payment to card only");
                        options.method = {
                            card: true,
                            netbanking: false,
                            upi: false,
                            wallet: false,
                            emi: false,
                            paylater: false,
                        };
                    }

                    console.log("🎛️ Razorpay options configured", {
                        key: options.key,
                        amount: options.amount,
                        currency: options.currency,
                        paymentMethod: data.payment_method,
                        hasOrderId: !!options.order_id,
                        callbackUrl: options.callback_url
                    });

                    // Add error handling for Razorpay initialization
                    try {
                        // Check if Razorpay is loaded
                        if (!(window as unknown).Razorpay) {
                            throw new Error("Razorpay SDK not loaded");
                        }

                        const rzp = new (window as unknown).Razorpay(options);

                        // Add error handler for Razorpay
                        rzp.on('payment.failed', function (response: unknown) {
                            console.error("💳 Razorpay payment failed", {
                                error: response.error,
                                timestamp: new Date().toISOString()
                            });

                            // Report payment failure
                            reportPaymentFailure(bookingId, paymentId, response.error.description || "Payment failed", cookieToken);
                        });

                        console.log("🚀 Opening Razorpay checkout");
                        rzp.open();

                    } catch (razorpayError: unknown) {
                        console.error("🚨 Razorpay initialization failed:", {
                            error: razorpayError.message,
                            timestamp: new Date().toISOString()
                        });

                        await reportPaymentFailure(bookingId, paymentId, "Razorpay initialization failed", cookieToken);

                        setPaymentModal({
                            isOpen: true,
                            status: "failed",
                            error: "Payment gateway failed to initialize. Please try again.",
                        });
                    }

                } else {
                    console.error("❌ Booking API returned unsuccessful response", response.data);
                    throw new Error(response.data?.message || "Booking request was not successful");
                }

            } catch (error: unknown) {
                console.error("🚨 Booking submission error:", {
                    message: error.message,
                    status: error.response?.status,
                    data: error.response?.data,
                    bookingId,
                    paymentId,
                    timestamp: new Date().toISOString(),
                    stack: error.stack
                });

                // Attempt to report payment failure to backend
                if (bookingId) {
                    await reportPaymentFailure(
                        bookingId,
                        paymentId,
                        error?.response?.data?.message || error.message || "Booking API failed.",
                        cookieToken
                    );
                }

                setPaymentModal({
                    isOpen: true,
                    status: "failed",
                    error: error?.response?.data?.message || error.message || "Something went wrong.",
                });

            } finally {
                setIsProcessing(false);
                console.log("🏁 Booking submission process completed", {
                    timestamp: new Date().toISOString(),
                    bookingId,
                    paymentId
                });
            }
        },
        [dbService, sessions, calculatePricing]
    );


    const reportPaymentFailure = async (
        bookingId: string | null,
        paymentId: string | null,
        errorDescription: string,
        token: string
    ) => {
        if (!bookingId) {
            console.warn("⚠️ Cannot report payment failure - no booking ID");
            return;
        }

        try {
            console.log("📡 Reporting payment failure", {
                bookingId,
                paymentId,
                errorDescription,
                timestamp: new Date().toISOString()
            });

            const response = await axios.post(
                `${API_ENDPOINT}/user/bookings/payment-failed`,
                {
                    booking_id: bookingId,
                    payment_id: paymentId,
                    error_description: errorDescription,
                    failure_timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    page_url: window.location.href
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("✅ Payment failure reported successfully", {
                status: response.status,
                data: response.data
            });

        } catch (reportError: unknown) {
            console.error("🚨 Failed to report payment failure:", {
                error: reportError.message,
                status: reportError.response?.status,
                data: reportError.response?.data,
                timestamp: new Date().toISOString()
            });
        }
    };

    // Optional: Add window event listeners for debugging redirect behavior
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', (event) => {
            console.log("🌐 Page is about to unload", {
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        });

        window.addEventListener('pagehide', (event) => {
            console.log("🌐 Page is hidden", {
                timestamp: new Date().toISOString(),
                persisted: event.persisted
            });
        });
    }


    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        setSelectedDate(normalized);
    };



    const {
        formData,
        errors,
        isSubmitting,
        updateField,
        handleSubmit,
        getFieldError,
        pricing,
        isValid,
    } = useBookingForm({
        onSubmit: handleBookingSubmit,
        calculatePricing,
    });

    // Auto-populate form data from selected values
    useEffect(() => {
        if (dbService?._id && !formData.service_id) {
            updateField("service_id", dbService._id);
        }
    }, [dbService, formData.service_id, updateField]);

    useEffect(() => {
        if (selectedClinic?._id && formData.clinic_id !== selectedClinic._id) {
            updateField("clinic_id", selectedClinic._id);
        }
    }, [selectedClinic, formData.clinic_id, updateField]);

    useEffect(() => {
        if (selectedDate && formData.date !== selectedDate) {
            updateField("date", selectedDate);
        }
    }, [selectedDate, formData.date, updateField]);

    useEffect(() => {
        if (selectedTime && formData.time !== selectedTime) {
            updateField("time", selectedTime);
        }
    }, [selectedTime, formData.time, updateField]);

    useEffect(() => {
        if (paymentMethod && formData.payment_method !== paymentMethod) {
            updateField("payment_method", paymentMethod);
        }
    }, [paymentMethod, formData.payment_method, updateField]);

    // Auto-update calendar month based on selected clinic
    useEffect(() => {
        if (selectedClinic?.BookingAvailabeAt) {
            const startDate = new Date(selectedClinic.BookingAvailabeAt.start_date);
            const today = new Date();
            const defaultDate = startDate > today ? startDate : today;

            if (!selectedDate || !isDateAvailable(selectedDate)) {
                setSelectedDate(defaultDate);
            }
        }
    }, [selectedClinic, selectedDate]);

    if (serviceLoading || settingLoading || isClinicLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="container mx-auto p-6 space-y-6">
                    <div className="text-center mb-8">
                        <Skeleton className="h-12 w-96 mx-auto mb-4" />
                        <Skeleton className="h-6 w-64 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-48 w-full" />
                        </div>
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (bookingStep === BookingStep.SUCCESS) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
                <div className="container mx-auto p-6 max-w-2xl">
                    <Card className="border-2 border-green-200 shadow-xl">
                        <CardHeader className="text-center bg-gradient-to-r from-green-50 to-blue-50">
                            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-4" />
                            <CardTitle className="text-3xl text-green-600 flex items-center justify-center gap-2">
                                <Sparkles className="w-8 h-8" />
                                Booking Confirmed!
                                <Heart className="w-8 h-8 text-red-500" />
                            </CardTitle>
                            <CardDescription className="text-lg">
                                🎉 Your wellness journey begins now! You will receive a
                                confirmation email shortly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl space-y-3">
                                <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Your Appointment Details
                                </h3>
                                <div className="space-y-2 text-gray-700">
                                    <p>
                                        <strong>🏥 Service:</strong> {dbService?.service_name}
                                    </p>
                                    <p>
                                        <strong>📅 Date:</strong> {selectedDate?.toDateString()}
                                    </p>
                                    <p>
                                        <strong>⏰ Time:</strong> {selectedTime}
                                    </p>
                                    <p>
                                        <strong>🔢 Sessions:</strong> {sessions}
                                    </p>
                                    <p>
                                        <strong>🏢 Clinic:</strong> {selectedClinic?.clinic_name}
                                    </p>
                                    <p>
                                        <strong>💰 Total Paid:</strong> ₹
                                        {pricing.total.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => (window.location.href = "/bookings")}
                                    className="w-full"
                                    size="lg"
                                >
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    View My Bookings
                                </Button>
                                <Button
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="w-full"
                                    size="lg"
                                >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Book Another Session
                                </Button>
                            </div>

                            <div className="text-center text-sm text-gray-600 space-y-1">
                                <p>📧 Confirmation email sent to your registered email</p>
                                <p>
                                    📱 SMS reminder will be sent 24 hours before your appointment
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <>
       
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="container mx-auto p-6">
                    {/* Header with catchy copy */}
                    {/* <div className="text-center mb-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-8 h-8 text-blue-500" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Your Wellness Journey Starts Here
                            </h1>
                            <Heart className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            ✨ Book your premium consultation with India's most trusted wellness experts.
                            <span className="font-semibold text-blue-600"> Secure, Simple, Swift!</span>
                        </p>
                        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>100% Secure</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span>Instant Confirmation</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span>Trusted by 50,000+ Patients</span>
                            </div>
                        </div>
                    </div> */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Booking Section */}
                        <div className="lg:col-span-2 mt-4 space-y-6">
                            {/* Service Information */}
                            <Card className="border-2 border-blue-100 shadow-lg">
                                <CardHeader className="">
                                    <div className="flex items-start gap-4">
                                        {dbService?.service_images?.[0] && (
                                            <Image
                                                src={
                                                    dbService.service_images[0].url || "/placeholder.svg"
                                                }
                                                alt={dbService.service_name}
                                                className="w-24 h-24 object-cover rounded-xl shadow-md"
                                                width={96}
                                                height={96}
                                            />
                                        )}
                                        <div className="flex-1">
                                            <CardTitle className="text-2xl text-blue-800 flex items-center gap-2">
                                                <Sparkles className="w-6 h-6" />
                                                {dbService?.service_name}
                                            </CardTitle>
                                            <CardDescription className="mt-2 text-base">
                                                {dbService?.service_small_desc}
                                            </CardDescription>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                                <Badge
                                                    variant="default"
                                                    className="bg-blue-500 text-sm sm:text-base"
                                                >
                                                    {sessions} Premium Session{sessions > 1 ? "s" : ""}
                                                </Badge>

                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-100 text-green-800 text-sm sm:text-base"
                                                >
                                                    ⭐ {dbService?.service_status}
                                                </Badge>

                                                {dbService?.service_per_session_discount_price && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-orange-600 border-orange-200 text-sm sm:text-base"
                                                    >
                                                        💰 Save ₹
                                                        {(
                                                            (dbService.service_per_session_price -
                                                                dbService.service_per_session_discount_price) *
                                                            sessions
                                                        ).toLocaleString()}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Doctor Information */}
                            {dbService?.service_doctor && (
                                <Card className="border-2 py-0 pb-4 border-purple-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-t-2xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <UserCheck className="w-7 h-7 text-purple-700" />
                                            <h2 className="text-lg sm:text-xl font-semibold text-purple-900">
                                                Meet Your Expert Doctor
                                            </h2>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="w-20 h-20 border-4 border-purple-200">
                                                <AvatarImage
                                                    src={
                                                        dbService.service_doctor.doctor_images?.[0]?.url ||
                                                        drImageurl
                                                    }
                                                />
                                                <AvatarFallback className="bg-purple-100 text-purple-800 text-xl font-bold">
                                                    {dbService.service_doctor.doctor_name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-xl text-gray-800">
                                                    {dbService.service_doctor.doctor_name}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {dbService.service_doctor.specialization?.map(
                                                        (spec, index) => (
                                                            <Badge
                                                                key={index}
                                                                variant="outline"
                                                                className="bg-purple-50 text-purple-700 border-purple-200"
                                                            >
                                                                {spec}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-2xl">⭐</span>
                                                        <span className="font-semibold text-lg">
                                                            {dbService.service_doctor.doctor_ratings}/5
                                                        </span>
                                                        <span className="text-gray-600">
                                                            (500+ Reviews) Total
                                                        </span>
                                                    </div>
                                                </div>
                                                {dbService.service_doctor.unknown_special_note && (
                                                    <p className="text-gray-600 mt-2 italic">
                                                        "💡 {dbService.service_doctor.unknown_special_note}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Patient Details */}
                            <Card className="border-2 py-0 border-green-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-green-100 to-teal-100 p-6 rounded-t-2xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <User className="w-7 h-7 text-green-700" />
                                            <h2 className="text-lg sm:text-xl font-semibold text-green-900">
                                                Patient Information
                                            </h2>
                                        </div>
                                        <p className="text-sm sm:text-base text-green-800 sm:text-right">
                                            Help us serve you better with your details
                                        </p>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6 py-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label
                                                htmlFor="patient-name"
                                                className="text-sm font-medium"
                                            >
                                                Full Name *
                                            </Label>
                                            <Input
                                                id="patient-name"
                                                placeholder="Enter your full name"
                                                value={formData.patient_details?.name || ""}
                                                onChange={(e) =>
                                                    updateField("patient_details.name", e.target.value)
                                                }
                                                className={
                                                    getFieldError("patient_details.name")
                                                        ? "border-red-500"
                                                        : ""
                                                }
                                            />
                                            {getFieldError("patient_details.name") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError("patient_details.name")}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label
                                                htmlFor="patient-phone"
                                                className="text-sm font-medium"
                                            >
                                                Phone Number *
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="patient-phone"
                                                    placeholder="10-digit mobile number"
                                                    value={formData.patient_details?.phone || ""}
                                                    onChange={(e) =>
                                                        updateField("patient_details.phone", e.target.value)
                                                    }
                                                    className={`pl-10 ${getFieldError("patient_details.phone")
                                                        ? "border-red-500"
                                                        : ""
                                                        }`}
                                                />
                                            </div>
                                            {getFieldError("patient_details.phone") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError("patient_details.phone")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label
                                                htmlFor="patient-email"
                                                className="text-sm font-medium"
                                            >
                                                Aadhar Number *
                                            </Label>
                                            <div className="relative">
                                                <FileDigit className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="patient-aadhar"
                                                    type="text"
                                                    placeholder="**** ***** ****"
                                                    value={formData.patient_details?.aadhar || ""}
                                                    onChange={(e) =>
                                                        updateField("patient_details.aadhar", e.target.value)
                                                    }
                                                    className={`pl-10 ${getFieldError("patient_details.aadhar")
                                                        ? "border-red-500"
                                                        : ""
                                                        }`}
                                                />
                                            </div>
                                            {getFieldError("patient_details.aadhar") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError("patient_details.aadhar")}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor="patient-email"
                                                className="text-sm font-medium"
                                            >
                                                Email Address *
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="patient-email"
                                                    type="email"
                                                    placeholder="your.email@example.com"
                                                    value={formData.patient_details?.email || ""}
                                                    onChange={(e) =>
                                                        updateField("patient_details.email", e.target.value)
                                                    }
                                                    className={`pl-10 ${getFieldError("patient_details.email")
                                                        ? "border-red-500"
                                                        : ""
                                                        }`}
                                                />
                                            </div>
                                            {getFieldError("patient_details.email") && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {getFieldError("patient_details.email")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Clinic Selection */}
                            <Card className="border-2 py-0 pb-4 border-orange-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-orange-100 to-yellow-100 p-6 rounded-t-2xl shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <MapPin className="w-7 h-7 text-orange-600" />
                                            <h2 className="text-lg sm:text-xl font-semibold text-orange-900">
                                                Choose Your Preferred Location
                                            </h2>
                                        </div>
                                        <p className="text-sm sm:text-base text-orange-700 sm:text-right">
                                            {` Select the clinic that's most convenient for you.`}
                                        </p>
                                    </div>
                                </CardHeader>

                              <CardContent className="pt-6">
  <div className="space-y-4">
    {clinics?.map((clinic) => (
      <div
        key={clinic._id}
        className={`flex items-start space-x-3 p-4 rounded-lg border-2 ${
          selectedClinic?._id === clinic._id ? "border-orange-300" : "border-gray-100"
        } hover:border-orange-200 transition-colors`}
      >
        <input
          type="checkbox"
          id={clinic._id}
          checked={selectedClinic?._id === clinic._id}
          onChange={() => {
            setSelectedClinic(
              selectedClinic?._id === clinic._id ? null : clinic
            ); // toggle off if already selected
          }}
          className="mt-1 accent-orange-500 w-5 h-5"
        />
        <label htmlFor={clinic._id} className="flex-1 cursor-pointer">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-lg">{clinic.clinic_name}</h4>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                ✅ Available
              </Badge>
            </div>
            <p className="text-gray-600 text-sm flex items-start gap-1">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
              {clinic?.clinic_contact_details.clinic_address}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {clinic.clinic_contact_details.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {clinic.clinic_contact_details.phone}
                </span>
              )}
              {clinic.clinic_contact_details.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {clinic.clinic_contact_details.email}
                </span>
              )}
            </div>
            {clinic.BookingAvailabeAt && (
              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                📅 Bookings available until{" "}
                {new Date(clinic.BookingAvailabeAt.end_date).toDateString()}
              </p>
            )}
          </div>
        </label>
      </div>
    ))}
  </div>

  {/* Error display */}
  {getFieldError("clinic_id") && (
    <p className="text-red-500 text-sm mt-2">
      {getFieldError("clinic_id")}
    </p>
  )}
</CardContent>

                            </Card>

                            {/* Date Selection */}
                            {selectedClinic && (
                                <Card className="border-2 py-0 pb-4 border-indigo-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-indigo-100 to-blue-100 p-6 rounded-t-2xl shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon className="w-7 h-7 text-indigo-700" />
                                                <h2 className="text-lg sm:text-xl font-semibold text-indigo-900">
                                                    Pick Your Perfect Date
                                                </h2>
                                            </div>
                                            <p className="text-sm sm:text-base text-indigo-800 sm:text-right">
                                                Choose a date that works best for your schedule
                                            </p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleDateSelect}
                                            disabled={(date) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return date < today || !isDateAvailable(date);
                                            }}
                                            className="rounded-lg border-2 border-indigo-100 w-[450px] mx-auto"
                                        />
                                        {getFieldError("date") && (
                                            <p className="text-red-500 text-sm mt-2 text-center">
                                                {getFieldError("date")}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Time Selection */}
                            {selectedDate && (
                                <Card className="border-2 py-0 pb-4 border-teal-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-teal-100 to-cyan-100 p-6 rounded-t-2xl shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-7 h-7 text-teal-700" />
                                                <h2 className="text-lg sm:text-xl font-semibold text-teal-900">
                                                    Select Your Time Slot
                                                </h2>
                                            </div>
                                            <p className="text-sm sm:text-base text-teal-800 sm:text-right">
                                                {isCheckingAvailability
                                                    ? "🔍 Checking availability..."
                                                    : "🕒 Choose your preferred appointment time"}
                                            </p>
                                        </div>
                                    </CardHeader>


                                    <CardContent className="pt-6">
                                        {selectedTime && (
                                            <>
                                                {pastBookingData?.time === selectedTime && pastBookingData?.available === false ? (
                                                    <div className="mt-4 mb-4 rounded-lg border border-orange-300 bg-orange-50 p-4 shadow-sm">
                                                        <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                                                            ⚠️ <span>Time slot <strong>{selectedTime}</strong> is <strong>not available</strong>. Please choose another.</span>
                                                        </p>
                                                    </div>
                                                ) : pastBookingData?.time === selectedTime && pastBookingData?.available === true ? (
                                                    <div className="mt-4 mb-4 rounded-lg border border-green-300 bg-green-50 p-4 shadow-sm">
                                                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                                                            ✅ <span>Time slot <strong>{selectedTime}</strong> is <strong>available and {pastBookingData?.availableSlots} </strong> and ready to book!</span>
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-sm">
                                                        <p className="text-sm text-blue-800 font-medium flex items-center gap-2 animate-pulse">
                                                            ⏱️ <span>Checking availability for <strong>{selectedTime}</strong>...</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}


                                        {getFieldError("time") && (
                                            <p className="text-red-500 text-sm mt-2">
                                                {getFieldError("time")}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {generateTimeSlots("09:00", "18:00").map((time) => {
                                                const isSlotUnavailable =
                                                    pastBookingData?.available === false &&
                                                    pastBookingData?.time === time;

                                                const isSelected = selectedTime === time;

                                                return (
                                                    <button
                                                        key={time}
                                                        onClick={() => setSelectedTime(time)}
                                                        disabled={
                                                            isSlotUnavailable || isCheckingAvailability
                                                        }
                                                        className={`relative cursor-grab w-full py-2 px-4 rounded-lg border text-sm font-medium transition-all duration-200 shadow-sm
            ${isSelected
                                                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                                                : isSlotUnavailable
                                                                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                                                    : "bg-white text-gray-800 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                                                            }`}
                                                    >
                                                        {time}

                                                        {isSlotUnavailable && (
                                                            <span
                                                                className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"
                                                                title="Unavailable"
                                                            />
                                                        )}

                                                        {!isSlotUnavailable && (
                                                            <span className={`block text-xs ${isSelected ? "text-gray-100" : "text-gray-500"} mt-1`}>
                                                                Tap a time slot to check its availability
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Method */}
                            {selectedDate && selectedTime && (
                                <Card className="border-2 py-0 pb-4 border-purple-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-t-2xl shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="w-7 h-7 text-purple-700" />
                                                <h2 className="text-lg sm:text-xl font-semibold text-purple-900">
                                                    Secure Payment Options
                                                </h2>
                                            </div>
                                            <p className="text-sm sm:text-base text-purple-800 sm:text-right">
                                                Choose your preferred payment method — all transactions are 100% secure
                                            </p>
                                        </div>
                                    </CardHeader>

                            <CardContent className="pt-6">
  <div className="space-y-4">
    {/* Razorpay Checkbox */}
    <div
      className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${
        paymentMethod === "razorpay" ? "border-blue-400" : "border-blue-100"
      } hover:border-blue-200 transition-colors`}
    >
      <input
        type="checkbox"
        id="razorpay"
        checked={paymentMethod === "razorpay"}
        onChange={() => setPaymentMethod("razorpay")}
        className="accent-blue-600 w-5 h-5"
      />
      <label htmlFor="razorpay" className="flex-1 cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">💳 UPI / Net Banking / Debit Card</p>
            <p className="text-sm text-gray-600">
              Powered by Razorpay - India's most trusted payment gateway
            </p>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800"
          >
            Recommended
          </Badge>
        </div>
      </label>
    </div>

    {/* Credit Card Checkbox */}
    <div
      className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${
        paymentMethod === "card" ? "border-gray-400" : "border-gray-100"
      } hover:border-gray-200 transition-colors`}
    >
      <input
        type="checkbox"
        id="card"
        checked={paymentMethod === "card"}
        onChange={() => setPaymentMethod("card")}
        className="accent-blue-600 w-5 h-5"
      />
      <label htmlFor="card" className="flex-1 cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">💎 Credit Card</p>
            <p className="text-sm text-gray-600">
              All major credit cards accepted
            </p>
          </div>
          {settings?.payment_config?.credit_card_fee > 0 && (
            <Badge
              variant="outline"
              className="text-orange-600 border-orange-200"
            >
              +{settings.payment_config.credit_card_fee}% fee
            </Badge>
          )}
        </div>
      </label>
    </div>
  </div>
</CardContent>

                                </Card>
                            )}

                            {/* Error Display */}
                            {errors.length > 0 && (
                                <Alert className="border-red-200 bg-red-50">
                                    <AlertDescription className="text-red-800">
                                        <div className="space-y-1">
                                            {errors
                                                .filter((error) => !error.field)
                                                .map((error, index) => (
                                                    <p key={index}>❌ {error.message}</p>
                                                ))}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Booking Summary Sidebar */}
                        <div className="space-y-6 mt-4">
                            <Card className="sticky py-0 pb-4 top-6 border-2 border-blue-200 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl shadow-md">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="w-7 h-7 text-white" />
                                            <h2 className="text-lg sm:text-xl font-semibold">Booking Summary</h2>
                                        </div>
                                        <p className="text-sm sm:text-base text-blue-100 sm:text-right">
                                            Your wellness investment breakdown
                                        </p>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{dbService?.service_name}</p>
                                                <p className="text-sm text-gray-600">
                                                    {sessions} premium session{sessions > 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 p-3 rounded-lg">
                                            <div className="flex justify-between text-sm">
                                                <span>Per session</span>
                                                <div className="text-right">
                                                    {dbService?.service_per_session_discount_price && (
                                                        <span className="line-through text-gray-500 text-xs">
                                                            ₹
                                                            {dbService.service_per_session_price.toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span className="ml-2 font-medium text-green-600">
                                                        ₹
                                                        {(
                                                            dbService?.service_per_session_discount_price ||
                                                            dbService?.service_per_session_price ||
                                                            0
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Subtotal</span>
                                            <span className="font-medium">
                                                ₹{pricing.subtotal.toLocaleString()}
                                            </span>
                                        </div>

                                        {pricing.tax > 0 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>
                                                    GST ({settings?.payment_config?.tax_percentage}%)
                                                </span>
                                                <span>₹{pricing.tax.toLocaleString()}</span>
                                            </div>
                                        )}

                                        {pricing.creditCard > 0 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>
                                                    Credit card fee (
                                                    {settings?.payment_config?.credit_card_fee}%)
                                                </span>
                                                <span>₹{pricing.creditCard.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between font-bold text-xl text-blue-600">
                                        <span>Total Amount</span>
                                        <span>₹{pricing.total.toLocaleString()}</span>
                                    </div>

                                    {selectedDate && selectedTime && selectedClinic && (
                                        <div className="pt-4 space-y-3">
                                            <Alert className="border-green-200 bg-green-50">
                                                <AlertDescription className="text-green-800">
                                                    <div className="space-y-1">
                                                        <p className="font-semibold">
                                                            🎯 Your Appointment Details:
                                                        </p>
                                                        <p>📅 {selectedDate.toDateString()}</p>
                                                        <p>⏰ {selectedTime}</p>
                                                        <p>🏥 {selectedClinic.clinic_name}</p>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>

                                            <Button
                                                onClick={handleSubmit}
                                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
                                                size="lg"
                                                disabled={isSubmitting || !isValid}
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Processing...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-5 h-5" />
                                                        Secure Pay ₹{pricing.total.toLocaleString()}
                                                    </div>
                                                )}
                                            </Button>

                                            <div className="text-center text-xs text-gray-500 space-y-1">
                                                <p>🔒 256-bit SSL encrypted payment</p>

                                            </div>
                                        </div>
                                    )}

                                    {(!selectedDate ||
                                        !selectedTime ||
                                        !selectedClinic ||
                                        !isValid) && (
                                            <Alert className="border-orange-200 bg-orange-50">
                                                <AlertDescription className="text-orange-800">
                                                    📝 Please complete all required fields to proceed with
                                                    booking
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Status Modal */}
            <PaymentStatusModal
                isOpen={paymentModal.isOpen}
                onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
                status={paymentModal.status}
                bookingDetails={
                    paymentModal.status === "success" &&
                        selectedDate &&
                        selectedTime &&
                        selectedClinic
                        ? {
                            service: dbService?.service_name || "",
                            date: selectedDate.toDateString(),
                            time: selectedTime,
                            clinic: selectedClinic.clinic_name,
                            amount: pricing.total,
                            bookingId: `BK${Date.now()}`,
                        }
                        : undefined
                }
                error={paymentModal.error}
            />

            <div className="fixed bottom-0 left-0 w-full z-50 p-4 bg-white border-t border-gray-200 sm:hidden">
                <Button
                    onClick={handleSubmit}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 text-lg shadow-lg"
                    size="lg"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Secure Pay ₹{pricing.total.toLocaleString()}
                        </div>
                    )}
                </Button>
            </div>

        </>
    );
};

export default EnhancedBookings;
