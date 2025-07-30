"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Heart, Sparkles } from "lucide-react"
import { useGetAllClinic } from "@/hooks/common"
import { useAuth } from "@/context/authContext/auth"
import { useGetProfile } from "@/hooks/use-getprofile"

import LocationStep from "@/components/booking/location-step"
import SessionStep from "@/components/booking/session-step"
import ScheduleStep from "@/components/booking/schedule-step"
import PaymentStep from "@/components/booking/payment-step"
import BookingSuccess from "@/components/booking/booking-success"
import BookingFailed from "@/components/booking/booking-failed"
import ProgressBar from "@/components/booking/progress-bar"
import { useSettings } from "@/hooks/use-settings"

const BookNowConsultations = ({ searchParams }) => {
  const router = useRouter()
  // const searchParams = useSearchParams()

  // Initialize step from URL or default to 1
  const initialStep = parseInt(searchParams.get('step') || '1', 10)
  const [currentStep, setCurrentStep] = useState(initialStep)

  // Initialize other states from URL params
  const [bookingStatus, setBookingStatus] = useState<"booking" | "success" | "failed">(
    searchParams.get('status') as "booking" | "success" | "failed" || "booking"
  )
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get('location') || "")
  const [selectedSessions, setSelectedSessions] = useState<number>(
    parseInt(searchParams.get('sessions') || '1', 10)
  )
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get('date') || "")
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(searchParams.get('time') || "")
  const [patientName, setPatientName] = useState<string>(searchParams.get('name') || "")
  const [patientPhone, setPatientPhone] = useState<string>(searchParams.get('phone') || "")
  const [patientEmail, setPatientEmail] = useState<string>(searchParams.get('email') || "")
  const [patientAadhhar, setPatientAadhhar] = useState<string>(searchParams.get('aadhhar') || "")
  const [otp, setOtp] = useState<string>("")
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false)
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(
    searchParams.get('verified') === 'true'
  )
  const [paymentMethod, setPaymentMethod] = useState<string>(searchParams.get('payment') || "online")
  const [bookingId, setBookingId] = useState<string>(searchParams.get('booking_id') || "")
  const [availableDates, setAvailableDates] = useState([])
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)

  const { settings } = useSettings()
  const { data } = useGetAllClinic()
  const containerRef = useRef<HTMLDivElement>(null)
  const { data: user, loading: userLoading } = useGetProfile()
  const { isAuthenticated, setToken } = useAuth()

  const sessionPrice = 10000
  const sessionMRP = 12000
  const cardFeePercentage = settings?.payment_config.credit_card_fee || 0
  const tax = settings?.payment_config?.tax_percentage > 0 ? settings?.payment_config?.tax_percentage : 0

  const totalAmount = selectedSessions * sessionPrice
  const cardFee = paymentMethod === "card" ? (totalAmount * cardFeePercentage) / 100 : 0
  const taxAmount = ((totalAmount) * tax) / 100;

  const finalAmount = totalAmount + cardFee + taxAmount;
  const progress = (currentStep / 4) * 100

  // Function to update URL with current state
  const updateURLParams = (updates: Record<string, string | number | boolean>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value))
      } else {
        params.delete(key)
      }
    })

    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Update URL when step changes
  useEffect(() => {
    updateURLParams({ step: currentStep })
  }, [currentStep])

  // Update URL when booking status changes
  useEffect(() => {
    if (bookingStatus !== "booking") {
      updateURLParams({ status: bookingStatus })
    }
  }, [bookingStatus])

  // Update URL when form data changes
  useEffect(() => {
    const updates: Record<string, string | number | boolean> = {}

    if (selectedLocation) updates.location = selectedLocation
    if (selectedSessions > 1) updates.sessions = selectedSessions
    if (selectedDate) updates.date = selectedDate
    if (selectedTimeSlot) updates.time = selectedTimeSlot
    if (patientName) updates.name = patientName
    if (patientPhone) updates.phone = patientPhone
    if (isOtpVerified) updates.verified = isOtpVerified
    if (paymentMethod !== "online") updates.payment = paymentMethod
    if (bookingId) updates.booking_id = bookingId

    updateURLParams(updates)
  }, [selectedLocation, selectedSessions, selectedDate, selectedTimeSlot, patientName, patientPhone, isOtpVerified, paymentMethod, bookingId])

  // Initialize user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user && !userLoading) {
      if (!patientName && user.name) {
        setPatientName(user.name)
      }
      if (!patientPhone && user.phone) {
        setPatientPhone(user.phone)
      }
      if (user.phone && !isOtpVerified) {
        setIsOtpVerified(true)
      }
    }
  }, [isAuthenticated, user])


  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => setRazorpayLoaded(true)
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Scroll to top when step changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [currentStep])

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return selectedLocation !== ""
      case 2:
        return selectedSessions > 0
      case 3:
        return (
          selectedDate !== "" && selectedTimeSlot !== "" && patientName !== "" && (isAuthenticated || isOtpVerified)
        )
      case 4:
        return paymentMethod !== ""
      default:
        return false
    }
  }

  const resetBooking = () => {
    setBookingStatus("booking")
    setCurrentStep(1)
    setSelectedLocation("")
    setSelectedSessions(1)
    setSelectedDate("")
    setSelectedTimeSlot("")
    if (!isAuthenticated) {
      setPatientName("")
      setPatientPhone("")
      setIsOtpVerified(false)
    }
    setOtp("")
    setIsOtpSent(false)
    setPaymentMethod("online")
    setBookingId("")

    // Clear URL params
    router.push(window.location.pathname, { scroll: false })
  }

  const stepProps = {
    selectedLocation,
    setSelectedLocation,
    selectedSessions,
    setSelectedSessions,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    patientName,
    setPatientName,
    patientPhone,
    setPatientPhone,
    patientEmail,
    setPatientEmail,
    patientAadhhar,
    setPatientAadhhar,
    otp,
    setOtp,
    isOtpSent,
    setIsOtpSent,
    isOtpVerified,
    setIsOtpVerified,
    taxAmount,
    paymentMethod,
    setPaymentMethod,
    availableDates,
    setAvailableDates,
    selectedClinic,
    setSelectedClinic,
    isLoadingSlots,
    setIsLoadingSlots,
    isRegistering,
    setIsRegistering,
    isVerifyingOtp,
    setIsVerifyingOtp,
    data,
    sessionPrice,
    sessionMRP,
    totalAmount,
    cardFee,
    finalAmount,
    isAuthenticated,
    user,
    setToken,
    setBookingStatus,
    setBookingId,
    razorpayLoaded,
  }


  if (bookingStatus === "success") {
    return (
      <BookingSuccess
        bookingId={bookingId}
        patientName={patientName}
        patientPhone={patientPhone}
        selectedClinic={selectedClinic}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        finalAmount={finalAmount}
        resetBooking={resetBooking}
      />
    )
  }

  if (bookingStatus === "failed") {
    return (
      <BookingFailed
        patientName={patientName}
        patientPhone={patientPhone}
        selectedClinic={selectedClinic}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        selectedSessions={selectedSessions}
        finalAmount={finalAmount}
        resetBooking={resetBooking}
        setBookingStatus={setBookingStatus}
      />
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <LocationStep {...stepProps} />
      case 2:
        return <SessionStep {...stepProps} />
      case 3:
        return <ScheduleStep {...stepProps} />
      case 4:
        return <PaymentStep {...stepProps} />
      default:
        return null
    }
  }

  const stepTitles = ["Choose Location", "Select Sessions", "Schedule & Details", "Payment & Confirmation"]

  return (
    <div ref={containerRef} className="min-h-screen mt-5 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-600 via-blue-600 to-indigo-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-600/10 to-indigo-600/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-center space-y-3"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Book Your Consultation</CardTitle>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <CardDescription className="text-blue-100 text-sm">
                    Step {currentStep} of 4 - {stepTitles[currentStep - 1]}
                  </CardDescription>
                </motion.div>

                <ProgressBar progress={progress} currentStep={currentStep} />
              </div>
            </CardHeader>

            <CardContent className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </CardContent>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex justify-between items-center p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-t border-slate-200"
            >
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                size="sm"
                className="flex items-center border border-slate-300 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50 text-sm bg-transparent"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: 4 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.05 + 0.4, duration: 0.2 }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${i + 1 === currentStep
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 scale-125"
                      : i + 1 < currentStep
                        ? "bg-green-500"
                        : "bg-slate-300"
                      }`}
                  />
                ))}
              </div>

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedFromStep(currentStep)}
                  size="sm"
                  className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    /* Payment logic will be in PaymentStep component */
                  }}
                  disabled={!canProceedFromStep(currentStep)}
                  size="sm"
                  className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 text-sm"
                >
                  Complete Payment
                </Button>
              )}
            </motion.div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default BookNowConsultations