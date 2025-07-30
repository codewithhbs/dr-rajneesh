"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarIcon,
  Clock,
  User,
  UserCheck,
  Phone,
  Shield,
  Send,
  Check,
  CheckCircle,
  Sun,
  Users,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import axios from "axios"
import Cookies from "js-cookie"
import { format, isAfter, isBefore, isToday, startOfDay, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

interface ScheduleStepProps {
  selectedDate: string
  setSelectedDate: (date: string) => void
  selectedTimeSlot: string
  setSelectedTimeSlot: (slot: string) => void
  patientName: string
  setPatientName: (name: string) => void
  patientPhone: string
  setPatientPhone: (phone: string) => void
  otp: string
  setOtp: (otp: string) => void
  isOtpSent: boolean
  setIsOtpSent: (sent: boolean) => void
  isOtpVerified: boolean
  setIsOtpVerified: (verified: boolean) => void
  availableDates: []
  setAvailableDates: (dates: []) => void
  selectedClinic: unknown
  selectedLocation: string
  isLoadingSlots: boolean
  setIsLoadingSlots: (loading: boolean) => void
  isRegistering: boolean
  setIsRegistering: (registering: boolean) => void
  isVerifyingOtp: boolean
  setIsVerifyingOtp: (verifying: boolean) => void
  isAuthenticated: boolean
  user: unknown
  setToken: (token: string) => void
}

const ScheduleStep = (props: ScheduleStepProps) => {
  const {
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,

    setSelectedTimeSlot,
    selectedLocation,
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
    availableDates,
    setAvailableDates,
    selectedClinic,
    isLoadingSlots,
    setIsLoadingSlots,
    isRegistering,
    setIsRegistering,
    isVerifyingOtp,
    setIsVerifyingOtp,
    isAuthenticated,
    user,
    setToken,
  } = props

  const [calendarDate, setCalendarDate] = useState<Date | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [bookingWindow, setBookingWindow] = useState<{ start_date: string; end_date: string } | null>(null)
  const [serverOtp, setServerOtp] = useState('')
  // New checkbox states
  const [isBookingForSelf, setIsBookingForSelf] = useState(true)
  const [needsDetailedConsultation, setNeedsDetailedConsultation] = useState(false)

  const fetchAvailableDates = useCallback(
    async (clinicId) => {
      if (!clinicId) return
      setIsLoadingSlots(true)
      try {
        const response = await fetch(`https://drkm.api.adsdigitalmedia.com/api/v1/get-available-date?_id=${clinicId}`)
        const result = await response.json()

        if (result.availableDates) {
          setAvailableDates(result.availableDates)
        }

        if (result.BookingAvailableAt) {

          const today = new Date()
          const startDate = parseISO(result.BookingAvailableAt.start_date)
          const endDate = parseISO(result.BookingAvailableAt.end_date)

          let bestDate = null
          if (isAfter(today, startDate) || isToday(startDate)) {
            bestDate = today
          } else {
            bestDate = startDate
          }

          const bestDateStr = format(bestDate, "yyyy-MM-dd")
          const dateWithSlots = result.availableDates?.find((d) => d.date === bestDateStr)

          if (dateWithSlots && dateWithSlots.slots?.some((slot) => slot.status === "Available")) {
            setCalendarDate(bestDate)
            setSelectedDate(bestDateStr)
          } else {
            const nextAvailableDate = result.availableDates?.find((d) => {
              const dateObj = parseISO(d.date)
              return isAfter(dateObj, today) && d.slots?.some((slot) => slot.status === "Available")
            })

            if (nextAvailableDate) {
              const nextDate = parseISO(nextAvailableDate.date)
              setCalendarDate(nextDate)
              setSelectedDate(nextAvailableDate.date)
            }
          }
        }


      } catch (error) {
        console.error("Error fetching available dates:", error)
        toast.error("Failed to load available dates")
      } finally {
        setIsLoadingSlots(false)
      }
    },
    [setAvailableDates, setIsLoadingSlots, setSelectedDate],
  )

  useEffect(() => {
    if (selectedClinic) {
      setBookingWindow(selectedClinic?.BookingAvailabeAt)
    }
  }, [selectedClinic])


  useEffect(() => {
    if (selectedLocation) {
      fetchAvailableDates(selectedLocation)
    }
  }, [selectedLocation, fetchAvailableDates])

  // Initialize user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name) setPatientName(user.name)
      if (user.phone) setPatientPhone(user.phone)
      if (user.email) setPatientEmail(user.email)
      if (user.aadhhar) setPatientAadhhar(user.aadhhar)
    }
  }, [isAuthenticated, user, setPatientName, setPatientPhone])

  const handleSendOtp = async () => {
    if (patientPhone.length !== 10) return
    setIsRegistering(true)

    try {
      const { data } = await axios.post("https://drkm.api.adsdigitalmedia.com/api/v1/user/register-via-number", {
        phone: patientPhone,
        name: patientName,
        email: patientEmail,
        aadhhar: patientAadhhar,
      })
      console.log(data)
      setServerOtp(data?.otp)
      setIsOtpSent(true)
      toast.success(`OTP sent to +91-${patientPhone}`)

      return { response: true, result: data }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Failed to send OTP"
      toast.error(errorMessage)
      console.error("Error sending OTP:", error)
      return { response: null, result: null }
    } finally {
      setIsRegistering(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setIsVerifyingOtp(true)
    try {
      const response = await axios.post("https://drkm.api.adsdigitalmedia.com/api/v1/user/verify-email-otp", {
        number: patientPhone,
        otp: otp,
      })
      const result = response.data
      setIsOtpVerified(true)
      toast.success("Phone number verified successfully!")
      if (result.token) {
        Cookies.set("token", result.token, { expires: 7 })
        setToken(result.token)
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || "Invalid OTP")
      } else {
        toast.error("Failed to verify OTP")
      }
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    try {
      const { response, result } = await handleSendOtp()
      if (response && response.ok) {
        toast.success("OTP resent successfully")
      } else {
        toast.error(result?.message || "Failed to resend OTP")
      }
    } catch (error) {
      toast.error("Failed to resend OTP")
    }
  }

  const isDateDisabled = (date: Date) => {
    if (!bookingWindow) return true

    const startDate = parseISO(bookingWindow.start_date)
    const endDate = parseISO(bookingWindow.end_date)
    const today = startOfDay(new Date())

    if (isBefore(date, today) || isBefore(date, startDate) || isAfter(date, endDate)) {
      return true
    }

    const dateStr = format(date, "yyyy-MM-dd")
    const dateData = availableDates.find((d) => d.date === dateStr)

    if (!dateData || !dateData.slots?.some((slot) => slot.status === "Available")) {
      return true
    }

    return false
  }

  const getAvailableDates = () => {
    return availableDates
      .filter((d) => d.slots?.some((slot) => slot.status === "Available"))
      .map((d) => parseISO(d.date))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isDateDisabled(date)) {
      setCalendarDate(date)
      setSelectedDate(format(date, "yyyy-MM-dd"))
      setSelectedTimeSlot("")
      setIsCalendarOpen(false)
    }
  }

  const selectedDateData = availableDates.find((d) => d.date === selectedDate)

  const canProceed =
    selectedDate && selectedTimeSlot && patientName && patientPhone && (isAuthenticated || isOtpVerified)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
          <CalendarIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Schedule Your Appointment
        </h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Select your preferred date and time, then provide your contact information to complete the booking
        </p>
      </motion.div>

      {/* Booking Preferences */}

      <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {/* Date & Time Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="space-y-6"
        >
          {/* Date Selection */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <CalendarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-lg font-bold text-slate-900 block">Select Date</Label>
                  <p className="text-sm text-slate-600">Choose your appointment date</p>
                </div>
              </div>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-14 justify-start text-left font-normal border-2 rounded-xl transition-all duration-200 hover:shadow-md flex-col items-start py-2",
                      !calendarDate && "text-muted-foreground",
                      calendarDate
                        ? "border-blue-400 bg-blue-50 hover:bg-blue-100"
                        : "border-slate-300 hover:border-blue-400",
                    )}
                  >
                    <div className="flex items-center w-full">
                      <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                      {calendarDate ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{format(calendarDate, "EEEE, MMMM do")}</span>
                          <span className="text-xs text-slate-600">{format(calendarDate, "yyyy")}</span>
                        </div>
                      ) : (
                        <span>Click to select a date</span>
                      )}
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 shadow-2xl border-2 border-blue-200" align="start">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border-b border-blue-200">
                    <h3 className="font-semibold text-slate-900 text-center">Available Dates</h3>
                    {bookingWindow && (
                      <p className="text-xs text-slate-600 text-center mt-1">
                        {format(parseISO(bookingWindow.start_date), "MMM d")} -{" "}
                        {format(parseISO(bookingWindow.end_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    initialFocus
                    defaultMonth={calendarDate || (bookingWindow ? parseISO(bookingWindow.start_date) : new Date())}
                    className="rounded-md"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: cn(
                        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7",
                      ),
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: cn(
                        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                      ),
                      day_range_end: "day-range-end",
                      day_selected:
                        "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 focus:bg-gradient-to-r focus:from-blue-500 focus:to-indigo-500 focus:text-white shadow-md",
                      day_today: "bg-accent text-accent-foreground font-semibold ring-2 ring-blue-400",
                      day_outside:
                        "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    modifiers={{
                      available: getAvailableDates(),
                    }}
                    modifiersClassNames={{
                      available: "bg-green-100 text-green-800 font-semibold hover:bg-green-200 ring-1 ring-green-300",
                    }}
                    fromMonth={bookingWindow ? parseISO(bookingWindow.start_date) : undefined}
                    toMonth={bookingWindow ? parseISO(bookingWindow.end_date) : undefined}
                  />
                </PopoverContent>
              </Popover>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-white/70 rounded-lg border border-blue-300"
                >
                  <p className="text-sm text-slate-700 text-center font-medium">
                    Selected: {format(parseISO(selectedDate), "EEEE, MMMM do, yyyy")}
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <Label className="text-lg font-bold text-slate-900 block">Select Time</Label>
                  <p className="text-sm text-slate-600">Pick your convenient time</p>
                </div>
              </div>

              {selectedDate && selectedDateData?.slots ? (
                <div>
                  <div className="flex items-center mb-4">
                    <Sun className="h-5 w-5 text-yellow-500 mr-2" />
                    <h4 className="text-sm font-semibold text-slate-900">
                      Available Slots for {format(parseISO(selectedDate), "MMM d")}
                    </h4>
                  </div>
                  {isLoadingSlots ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                      <p className="text-sm text-slate-500 mt-3">Loading time slots...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                      {selectedDateData.slots
                        .filter((slot) => slot.status === "Available")
                        .map((slot, index) => (
                          <motion.div
                            key={slot.time}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <input
                              type="radio"
                              id={slot.time}
                              name="timeSlot"
                              value={slot.time}
                              checked={selectedTimeSlot === slot.time}
                              onChange={() => setSelectedTimeSlot(slot.time)}
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor={slot.time}
                              className={cn(
                                "block p-4 text-center text-sm rounded-xl border-2 cursor-pointer transition-all duration-200 relative overflow-hidden hover:shadow-md",
                                selectedTimeSlot === slot.time
                                  ? "bg-gradient-to-r from-purple-500 to-pink-500 border-transparent text-white shadow-lg transform scale-105"
                                  : "border-slate-200 hover:border-purple-400 hover:bg-purple-50 bg-white",
                              )}
                            >
                              <div className="font-semibold">{slot.time}</div>
                              <div className="text-xs mt-1 opacity-90">
                                {slot.available > 0 ? `${slot.available} slots` : "Available"}
                              </div>
                              {selectedTimeSlot === slot.time && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute top-2 right-2"
                                >
                                  <Check className="h-4 w-4 text-white" />
                                </motion.div>
                              )}
                            </Label>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Please select a date first</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Information */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-xl ">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {isAuthenticated ? "Your Information" : "Patient Information"}
                  </h3>
                  <p>{serverOtp && `& Your Otp is ${serverOtp} it only shows in Developmet`}</p>
                  <p className="text-sm text-slate-600">
                    {isAuthenticated
                      ? "We've pre-filled your details from your account"
                      : "Enter your contact details to complete the booking"}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Patient Name */}
                <div>
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700 mb-3 block flex items-center">
                    <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                    {isBookingForSelf ? "Your Name" : "Patient Name"}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder={isBookingForSelf ? "Enter your full name" : "Enter patient's full name"}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}

                    className="w-full h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white disabled:bg-slate-50 shadow-sm"
                  />
                  {isAuthenticated && user?.name && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified from your account
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-3 block flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-green-600" />
                    Phone Number
                  </Label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter 10-digit number"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}

                        className="w-full h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white pl-14 disabled:bg-slate-50 shadow-sm"
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-sm font-semibold">
                        +91
                      </div>
                    </div>
                    {!isAuthenticated && (
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={patientPhone.length !== 10 || isOtpSent || isRegistering}
                        size="lg"
                        className={cn(
                          "h-12 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md",
                          isOtpSent
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg",
                        )}
                      >
                        {isRegistering ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : isOtpSent ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    )}
                  </div>
                  {isAuthenticated && user?.phone && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified from your account
                    </p>
                  )}
                </div>
                {/* Email Address */}
                <div>
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-3 block flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-green-600" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white shadow-sm"
                  />
                  {isAuthenticated && user?.email && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified from your account
                    </p>
                  )}
                </div>
                {/* Aadhhar Number */}
                <div>
                  <Label htmlFor="aadhhar" className="text-sm font-semibold text-slate-700 mb-3 block flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-600" />
                    Aadhhar Number
                  </Label>
                  <Input
                    id="aadhhar"
                    type="text"
                    placeholder="Enter your 12-digit Aadhhar number"
                    value={patientAadhhar}
                    onChange={(e) => setPatientAadhhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    className="w-full h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white shadow-sm"
                  />
                  {isAuthenticated && user?.aadhhar && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified from your account
                    </p>
                  )}
                </div>


                {/* OTP Verification */}
                {!isAuthenticated && (
                  <AnimatePresence>
                    {isOtpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Label
                          htmlFor="otp"
                          className="text-sm font-semibold text-slate-700 mb-3 block flex items-center"
                        >
                          <Shield className="h-4 w-4 mr-2 text-green-600" />
                          Enter OTP
                        </Label>
                        <div className="flex gap-3">
                          <Input
                            id="otp"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="flex-1 h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-green-500 transition-colors duration-200 bg-white text-center font-mono tracking-widest shadow-sm"
                            disabled={isOtpVerified}
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyOtp}
                            disabled={otp.length !== 6 || isOtpVerified || isVerifyingOtp}
                            size="lg"
                            className={cn(
                              "h-12 px-6 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md",
                              isOtpVerified
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg",
                            )}
                          >
                            {isVerifyingOtp ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : isOtpVerified ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <Shield className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                        {isOtpSent && !isOtpVerified && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="mt-2 text-center"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={handleResendOtp}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              Resend OTP
                            </Button>
                          </motion.div>
                        )}

                        {isOtpVerified && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg"
                          >
                            <p className="text-green-800 text-sm font-medium flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Phone number verified successfully!
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* Appointment Summary */}
                {canProceed && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 p-6 bg-white rounded-xl border-2 border-green-300 shadow-lg"
                  >
                    <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                      Appointment Summary
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-slate-600 text-sm font-medium">Date:</span>
                          <span className="font-semibold text-slate-900 text-sm">
                            {format(parseISO(selectedDate), "EEE, MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-slate-600 text-sm font-medium">Time:</span>
                          <span className="font-semibold text-slate-900 text-sm">{selectedTimeSlot}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-slate-600 text-sm font-medium">Patient:</span>
                          <span className="font-semibold text-slate-900 text-sm">{patientName}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <span className="text-slate-600 text-sm font-medium">Phone:</span>
                          <span className="font-semibold text-slate-900 text-sm">+91-{patientPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking preferences summary */}
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex flex-wrap gap-2">
                        {isBookingForSelf && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Users className="h-3 w-3 mr-1" />
                            Self Booking
                          </span>
                        )}
                        {needsDetailedConsultation && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Detailed Consultation
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>


            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ScheduleStep
