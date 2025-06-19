"use client"

import { useGetAllClinic } from "@/hooks/common"
import { useServiceBySlug } from "@/hooks/use-service"
import { useSettings } from "@/hooks/use-settings"
import { useMemo, useState, useEffect, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
    Clock,
    MapPin,
    User,
    CreditCard,
    CalendarIcon,
    Sparkles,
    Heart,
    Shield,
    Zap,
    Phone,
    Mail,
    UserCheck,
    CheckCircle,
} from "lucide-react"
import { API_ENDPOINT } from "@/constant/url"
import Cookies from "js-cookie"
import axios from "axios"

import { useBookingForm } from "@/hooks/use-booking-form"
import type { Clinic, BookingFormData, BookingAvailability, PricingBreakdown } from "@/types/booking"
import { PaymentStatusModal } from "@/components/models/payment-status-modal"
import Image from "next/image"
import { drImageurl } from "@/constant/Images"

interface EnhancedBookingsProps {
    searchParams: any
}
export enum BookingStep {
    SELECTION = 1,
    CONFIRMATION = 2,
    PAYMENT = 3,
    SUCCESS = 4
}
const EnhancedBookings = ({ searchParams }: EnhancedBookingsProps) => {
    const parsedParams = useMemo(() => {
        try {
            return typeof searchParams === "string" ? JSON.parse(searchParams) : searchParams
        } catch (e) {
            console.error("Invalid searchParams:", e)
            return {}
        }
    }, [searchParams])

    const sessions = Number.parseInt(parsedParams.sessions) || 1
    const service = parsedParams.service || "N/A"

    // Your original hooks
    const { service: dbService, loading: serviceLoading } = useServiceBySlug(service)
    const { settings, loading: settingLoading } = useSettings()
    const { data: clinics, loading: isClinicLoading } = useGetAllClinic()

    // State management
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState("")
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("razorpay")
    const [isProcessing, setIsProcessing] = useState(false)
    const [bookingStep, setBookingStep] = useState<BookingStep>(BookingStep.SELECTION)
    const [pastBookingData, setPastBookingData] = useState<BookingAvailability | null>(null)
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false)
    const [paymentModal, setPaymentModal] = useState<{
        isOpen: boolean
        status: "success" | "failed" | "processing"
        error?: string
    }>({ isOpen: false, status: "processing" })

    // Your original availability check function
    const checkAvailability = useCallback(async () => {
        if (!selectedDate || !selectedTime || !dbService?._id || !selectedClinic?._id) return

        const cookieToken = Cookies.get("token")
        setIsCheckingAvailability(true)
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        console.log("selectedDateselectedDate", formattedDate)
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
                },
            )


            setPastBookingData(response.data?.data)
        } catch (err: unknown) {
            console.log("err?.response?.data?.message", err)
            setPastBookingData({ available: false, message: "Failed to check availability" })
        } finally {
            setIsCheckingAvailability(false)
        }
    }, [selectedDate, selectedTime, dbService?._id, selectedClinic?._id])

    useEffect(() => {
        checkAvailability()
    }, [checkAvailability])

    // Your original time slot generation
    function timeToMinutes(timeString: string) {
        const [hours, minutes] = timeString.split(":").map(Number)
        return hours * 60 + minutes
    }

    function generateTimeSlots(startTime: string, endTime: string) {
        if (!settings?.booking_config?.slots_per_hour) return []

        const slots = []
        const minutesPerSlot = 60 / settings.booking_config.slots_per_hour

        let currentTime = timeToMinutes(startTime)
        const endTimeMinutes = timeToMinutes(endTime)

        while (currentTime < endTimeMinutes) {
            const hours = Math.floor(currentTime / 60)
            const minutes = currentTime % 60
            const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
            slots.push(timeString)
            currentTime += minutesPerSlot
        }

        return slots
    }

    // Your original pricing calculation
    const calculatePricing = useCallback(
        (data: Partial<BookingFormData>): PricingBreakdown => {
            if (!dbService || !settings) return { subtotal: 0, tax: 0, creditCard: 0, total: 0 }

            const basePrice = dbService.service_per_session_discount_price || dbService.service_per_session_price
            const subtotal = basePrice * sessions

            const taxAmount = (subtotal * (settings.payment_config?.tax_percentage || 0)) / 100

            const creditCardAmount =
                data.payment_method === "card" ? (subtotal * (settings.payment_config?.credit_card_fee || 0)) / 100 : 0

            const total = subtotal + taxAmount + creditCardAmount

            return {
                subtotal,
                tax: taxAmount,
                creditCard: creditCardAmount,
                total,
            }
        },
        [dbService, settings, sessions],
    )

    // Auto-select first available clinic and set default date/time
    useEffect(() => {
        if (clinics && clinics.length > 0 && !selectedClinic) {
            const firstClinic = clinics[0]
            setSelectedClinic(firstClinic)

            // Set default date based on clinic availability
            if (firstClinic.BookingAvailabeAt) {
                const startDate = new Date(firstClinic.BookingAvailabeAt.start_date)
                const today = new Date()
                const defaultDate = startDate > today ? startDate : today
                setSelectedDate(defaultDate)
            } else {
                setSelectedDate(new Date())
            }
        }
    }, [clinics, selectedClinic])

    // Auto-select current time slot if available
    useEffect(() => {
        if (settings && selectedDate && !selectedTime) {
            const now = new Date()
            const currentHour = now.getHours()
            const currentMinute = now.getMinutes()
            const currentTimeInMinutes = currentHour * 60 + currentMinute

            const availableSlots = generateTimeSlots("09:00", "18:00")
            const nearestSlot = availableSlots.find((slot) => {
                const slotMinutes = timeToMinutes(slot)
                return slotMinutes >= currentTimeInMinutes
            })

            if (nearestSlot) {
                setSelectedTime(nearestSlot)
            } else if (availableSlots.length > 0) {
                setSelectedTime(availableSlots[0])
            }
        }
    }, [settings, selectedDate, selectedTime])

    // Check if selected date is available for the clinic
    const isDateAvailable = (date: Date) => {
        if (!selectedClinic?.BookingAvailabeAt) return true

        const startDate = new Date(selectedClinic.BookingAvailabeAt.start_date)
        const endDate = new Date(selectedClinic.BookingAvailabeAt.end_date)

        return date >= startDate && date <= endDate
    }

    // Handle booking submission with your original Razorpay logic
    const handleBookingSubmit = useCallback(
        async (data: BookingFormData) => {
            setIsProcessing(true)
            const cookieToken = Cookies.get("token")
            try {
                const formattedDate = data?.date ? format(new Date(data.date), "yyyy-MM-dd") : "";
                const paymentDetails = calculatePricing(data);
                const completeData = {
                    ...data,
                    date: formattedDate,
                    paymentDetails,
                    sessions,
                };

                const response = await axios.post(`${API_ENDPOINT}/user/bookings/sessions`, completeData, {
                    headers: {
                        Authorization: `Bearer ${cookieToken}`
                    }
                })
                console.log("response", response.data)
                const { booking, payment } = response.data?.data

                if (response.data.success) {
                    setPaymentModal({ isOpen: true, status: "processing" })


                    let options = {
                        key: payment?.key || "rzp_test_demo_key",
                        amount: payment?.amount * 100,
                        currency: "INR",
                        name: "🏥 Dr. Rajneesh Kant Clinic",
                        description: `${dbService?.service_name} - ${sessions} Session(s)`,
                        handler: (response: any) => {
                            console.log("Payment successful:", response);
                            setPaymentModal({ isOpen: true, status: "success" });
                            setBookingStep(BookingStep.SUCCESS);
                        },
                        prefill: {
                            name: data.patient_details.name,
                            email: data.patient_details.email,
                            contact: data.patient_details.phone,
                        },
                        theme: {
                            color: "#3B82F6",
                        },
                        modal: {
                            ondismiss: () => {
                                setPaymentModal({
                                    isOpen: true,
                                    status: "failed",
                                    error: "Payment was cancelled",
                                });
                            },
                        },
                    };

                    // 👉 Conditionally restrict methods if "card" is selected
                    if (data.payment_method === "card") {
                        options.method = {
                            card: true,
                            netbanking: false,
                            upi: false,
                            wallet: false,
                            emi: false,
                            paylater: false,
                        };
                    }


                    const rzp = new (window as any).Razorpay(options)
                    rzp.open()
                }
            } catch (error: any) {
                console.error("Booking error:", error)
                setPaymentModal({
                    isOpen: true,
                    status: "failed",
                    error: error.message,
                })
            } finally {
                setIsProcessing(false)
            }
        },
        [dbService, sessions, calculatePricing],
    )
    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;

        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        setSelectedDate(normalized);
    };

    console.log("selectedDate", selectedDate)
    // Initialize booking form
    const { formData, errors, isSubmitting, updateField, handleSubmit, getFieldError, pricing, isValid } = useBookingForm(
        {
            onSubmit: handleBookingSubmit,
            calculatePricing,
        },
    )

    // Auto-populate form data from selected values
    useEffect(() => {
        if (dbService?._id && !formData.service_id) {
            updateField("service_id", dbService._id)
        }
    }, [dbService, formData.service_id, updateField])

    useEffect(() => {
        if (selectedClinic?._id && formData.clinic_id !== selectedClinic._id) {
            updateField("clinic_id", selectedClinic._id)
        }
    }, [selectedClinic, formData.clinic_id, updateField])

    useEffect(() => {
        if (selectedDate && formData.date !== selectedDate) {
            updateField("date", selectedDate)
        }
    }, [selectedDate, formData.date, updateField])

    useEffect(() => {
        if (selectedTime && formData.time !== selectedTime) {
            updateField("time", selectedTime)
        }
    }, [selectedTime, formData.time, updateField])

    useEffect(() => {
        if (paymentMethod && formData.payment_method !== paymentMethod) {
            updateField("payment_method", paymentMethod)
        }
    }, [paymentMethod, formData.payment_method, updateField])

    // Auto-update calendar month based on selected clinic
    useEffect(() => {
        if (selectedClinic?.BookingAvailabeAt) {
            const startDate = new Date(selectedClinic.BookingAvailabeAt.start_date)
            const today = new Date()
            const defaultDate = startDate > today ? startDate : today

            if (!selectedDate || !isDateAvailable(selectedDate)) {
                setSelectedDate(defaultDate)
            }
        }
    }, [selectedClinic, selectedDate])

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
        )
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
                                🎉 Your wellness journey begins now! You will receive a confirmation email shortly.
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
                                        <strong>💰 Total Paid:</strong> ₹{pricing.total.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button onClick={() => (window.location.href = "/bookings")} className="w-full" size="lg">
                                    <CalendarIcon className="w-5 h-5 mr-2" />
                                    View My Bookings
                                </Button>
                                <Button onClick={() => window.location.reload()} variant="outline" className="w-full" size="lg">
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Book Another Session
                                </Button>
                            </div>

                            <div className="text-center text-sm text-gray-600 space-y-1">
                                <p>📧 Confirmation email sent to your registered email</p>
                                <p>📱 SMS reminder will be sent 24 hours before your appointment</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
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
                                <span>Trusted by 10,000+ Patients</span>
                            </div>
                        </div>
                    </div> */}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Booking Section */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Service Information */}
                            <Card className="border-2 border-blue-100 shadow-lg">
                                <CardHeader className="">
                                    <div className="flex items-start gap-4">
                                        {dbService?.service_images?.[0] && (
                                            <Image
                                                src={dbService.service_images[0].url || "/placeholder.svg"}
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
                                            <CardDescription className="mt-2 text-base">{dbService?.service_small_desc}</CardDescription>
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                                                <Badge variant="default" className="bg-blue-500 text-sm sm:text-base">
                                                    {sessions} Premium Session{sessions > 1 ? 's' : ''}
                                                </Badge>

                                                <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm sm:text-base">
                                                    ⭐ {dbService?.service_status}
                                                </Badge>

                                                {dbService?.service_per_session_discount_price && (
                                                    <Badge variant="outline" className="text-orange-600 border-orange-200 text-sm sm:text-base">
                                                        💰 Save ₹
                                                        {(
                                                            (dbService.service_per_session_price - dbService.service_per_session_discount_price) * sessions
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
                                <Card className="border-2 border-purple-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                        <CardTitle className="flex items-center gap-2 text-purple-800">
                                            <UserCheck className="w-6 h-6" />
                                            Meet Your Expert Doctor
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="w-20 h-20 border-4 border-purple-200">
                                                <AvatarImage src={dbService.service_doctor.doctor_images?.[0]?.url || drImageurl} />
                                                <AvatarFallback className="bg-purple-100 text-purple-800 text-xl font-bold">
                                                    {dbService.service_doctor.doctor_name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-xl text-gray-800">{dbService.service_doctor.doctor_name}</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {dbService.service_doctor.specialization?.map((spec, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="bg-purple-50 text-purple-700 border-purple-200"
                                                        >
                                                            {spec}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-2xl">⭐</span>
                                                        <span className="font-semibold text-lg">{dbService.service_doctor.doctor_ratings}/5</span>
                                                        <span className="text-gray-600">(500+ Reviews) Total</span>
                                                    </div>
                                                </div>
                                                {dbService.service_doctor.any_special_note && (
                                                    <p className="text-gray-600 mt-2 italic">"💡 {dbService.service_doctor.any_special_note}"</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Patient Details */}
                            <Card className="border-2 border-green-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                                    <CardTitle className="flex mt-2 mb-1 items-center gap-2 text-green-800">
                                        <User className="w-6 h-6" />
                                        Patient Information
                                    </CardTitle>
                                    <CardDescription>Help us serve you better with your details</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="patient-name" className="text-sm font-medium">
                                                Full Name *
                                            </Label>
                                            <Input
                                                id="patient-name"
                                                placeholder="Enter your full name"
                                                value={formData.patient_details?.name || ""}
                                                onChange={(e) => updateField("patient_details.name", e.target.value)}
                                                className={getFieldError("patient_details.name") ? "border-red-500" : ""}
                                            />
                                            {getFieldError("patient_details.name") && (
                                                <p className="text-red-500 text-xs mt-1">{getFieldError("patient_details.name")}</p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="patient-phone" className="text-sm font-medium">
                                                Phone Number *
                                            </Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                                <Input
                                                    id="patient-phone"
                                                    placeholder="10-digit mobile number"
                                                    value={formData.patient_details?.phone || ""}
                                                    onChange={(e) => updateField("patient_details.phone", e.target.value)}
                                                    className={`pl-10 ${getFieldError("patient_details.phone") ? "border-red-500" : ""}`}
                                                />
                                            </div>
                                            {getFieldError("patient_details.phone") && (
                                                <p className="text-red-500 text-xs mt-1">{getFieldError("patient_details.phone")}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="patient-email" className="text-sm font-medium">
                                            Email Address *
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                            <Input
                                                id="patient-email"
                                                type="email"
                                                placeholder="your.email@example.com"
                                                value={formData.patient_details?.email || ""}
                                                onChange={(e) => updateField("patient_details.email", e.target.value)}
                                                className={`pl-10 ${getFieldError("patient_details.email") ? "border-red-500" : ""}`}
                                            />
                                        </div>
                                        {getFieldError("patient_details.email") && (
                                            <p className="text-red-500 text-xs mt-1">{getFieldError("patient_details.email")}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Clinic Selection */}
                            <Card className="border-2 border-orange-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                                    <CardTitle className="flex items-center gap-2 text-orange-800">
                                        <MapPin className="w-6 h-6" />
                                        Choose Your Preferred Location
                                    </CardTitle>
                                    <CardDescription>Select the clinic that's most convenient for you</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <RadioGroup
                                        value={selectedClinic?._id}
                                        onValueChange={(value) => {
                                            const clinic = clinics?.find((c) => c._id === value)
                                            setSelectedClinic(clinic || null)
                                        }}
                                    >
                                        {clinics?.map((clinic) => (
                                            <div
                                                key={clinic._id}
                                                className="flex items-start space-x-3 p-4 rounded-lg border-2 border-gray-100 hover:border-orange-200 transition-colors"
                                            >
                                                <RadioGroupItem value={clinic._id} id={clinic._id} className="mt-1" />
                                                <Label htmlFor={clinic._id} className="flex-1 cursor-pointer">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-lg">{clinic.clinic_name}</h4>
                                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
                                                                📅 Bookings available until {new Date(clinic.BookingAvailabeAt.end_date).toDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                    {getFieldError("clinic_id") && (
                                        <p className="text-red-500 text-sm mt-2">{getFieldError("clinic_id")}</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Date Selection */}
                            {selectedClinic && (
                                <Card className="border-2 border-indigo-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                                        <CardTitle className="flex items-center gap-2 text-indigo-800">
                                            <CalendarIcon className="w-6 h-6" />
                                            Pick Your Perfect Date
                                        </CardTitle>
                                        <CardDescription>Choose a date that works best for your schedule</CardDescription>
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
                                            className="rounded-lg border-2 border-indigo-100 w-fit mx-auto"
                                        />
                                        {getFieldError("date") && (
                                            <p className="text-red-500 text-sm mt-2 text-center">{getFieldError("date")}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Time Selection */}
                            {selectedDate && (
                                <Card className="border-2 border-teal-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                                        <CardTitle className="flex items-center gap-2 text-teal-800">
                                            <Clock className="w-6 h-6" />
                                            Select Your Time Slot
                                        </CardTitle>
                                        <CardDescription>
                                            {isCheckingAvailability ? "Checking availability..." : "Choose your preferred appointment time"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                            {generateTimeSlots("09:00", "18:00").map((time) => {
                                                const isSlotAvailable = pastBookingData?.available !== false
                                                const isSelected = selectedTime === time

                                                return (
                                                    <Button
                                                        key={time}
                                                        variant={isSelected ? "default" : "outline"}
                                                        onClick={() => setSelectedTime(time)}
                                                        disabled={!isSlotAvailable || isCheckingAvailability}
                                                        className={`text-sm relative ${isSelected
                                                            ? "bg-teal-500 hover:bg-teal-600"
                                                            : isSlotAvailable
                                                                ? "hover:bg-teal-50 hover:border-teal-300"
                                                                : "opacity-50"
                                                            }`}
                                                    >
                                                        {time}
                                                        {!isSlotAvailable && (
                                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                                        )}
                                                    </Button>
                                                )
                                            })}
                                        </div>

                                        {pastBookingData && !pastBookingData.available && (
                                            <Alert className="mt-4 border-orange-200 bg-orange-50">
                                                <AlertDescription className="text-orange-800">
                                                    ⚠️ {pastBookingData.message || "This time slot is not available"}
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {getFieldError("time") && <p className="text-red-500 text-sm mt-2">{getFieldError("time")}</p>}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Method */}
                            {selectedDate && selectedTime && (
                                <Card className="border-2 border-purple-100 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                        <CardTitle className="flex items-center gap-2 text-purple-800">
                                            <CreditCard className="w-6 h-6" />
                                            Secure Payment Options
                                        </CardTitle>
                                        <CardDescription>
                                            Choose your preferred payment method - all transactions are 100% secure
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-blue-100 hover:border-blue-200 transition-colors">
                                                <RadioGroupItem value="razorpay" id="razorpay" />
                                                <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">💳 UPI / Net Banking / Debit Card</p>
                                                            <p className="text-sm text-gray-600">
                                                                Powered by Razorpay - India's most trusted payment gateway
                                                            </p>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                            Recommended
                                                        </Badge>
                                                    </div>
                                                </Label>
                                            </div>

                                            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-100 hover:border-gray-200 transition-colors">
                                                <RadioGroupItem value="card" id="card" />
                                                <Label htmlFor="card" className="flex-1 cursor-pointer">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium">💎 Credit Card</p>
                                                            <p className="text-sm text-gray-600">All major credit cards accepted</p>
                                                        </div>
                                                        {settings?.payment_config?.credit_card_fee &&
                                                            settings.payment_config.credit_card_fee > 0 && (
                                                                <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                                    +{settings.payment_config.credit_card_fee}% fee
                                                                </Badge>
                                                            )}
                                                    </div>
                                                </Label>
                                            </div>
                                        </RadioGroup>
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
                        <div className="space-y-6">
                            <Card className="sticky top-6 border-2 border-blue-200 shadow-xl">
                                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                    <CardTitle className="flex mt-2 items-center gap-2">
                                        <Sparkles className="w-6 h-6" />
                                        Booking Summary
                                    </CardTitle>
                                    <CardDescription className="text-blue-100">Your wellness investment breakdown</CardDescription>
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
                                                            ₹{dbService.service_per_session_price.toLocaleString()}
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
                                            <span className="font-medium">₹{pricing.subtotal.toLocaleString()}</span>
                                        </div>

                                        {pricing.tax > 0 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>GST ({settings?.payment_config?.tax_percentage}%)</span>
                                                <span>₹{pricing.tax.toLocaleString()}</span>
                                            </div>
                                        )}



                                        {pricing.creditCard > 0 && (
                                            <div className="flex justify-between text-sm text-gray-600">
                                                <span>Credit card fee ({settings?.payment_config?.credit_card_fee}%)</span>
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
                                                        <p className="font-semibold">🎯 Your Appointment Details:</p>
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
                                                <p>💯 100% money-back guarantee</p>
                                            </div>
                                        </div>
                                    )}

                                    {(!selectedDate || !selectedTime || !selectedClinic || !isValid) && (
                                        <Alert className="border-orange-200 bg-orange-50">
                                            <AlertDescription className="text-orange-800">
                                                📝 Please complete all required fields to proceed with booking
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
                    paymentModal.status === "success" && selectedDate && selectedTime && selectedClinic
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

            {/* Razorpay Script */}
        </>
    )
}

export default EnhancedBookings
