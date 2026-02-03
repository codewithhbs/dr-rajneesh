export interface PatientDetails {
  name: string
  email: string
  phone: string
}

export interface Cancellation {
  refundEligible: boolean
}

export interface ServiceImage {
  url: string
  public_id: string
  _id: string
}

export interface Treatment {
  _id: string
  service_name: string
  service_small_desc: string
  service_desc: string
  service_images: ServiceImage[]
  service_status: string
  service_session_allowed_limit: number
  service_per_session_price: number
  service_per_session_discount_price: number
  service_per_session_discount_percentage: number
  service_tag: string
  service_doctor: string
  service_available_at_clinics: string[]
  service_reviews: string[]
  position: number
  createdAt: string
  updatedAt: string
  __v: number
}

export interface SessionDate {
  sessionNumber: number
  date: string
  time: string
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled" | "Rescheduled"
  _id: string
  rescheduleHistory: any[]
  id: string
}

export interface ClinicContactDetails {
  email: string
  phone_numbers: string[]
  clinic_address: string
}

export interface ClinicTimings {
  open_time: string
  close_time: string
  off_day: string
}

export interface BookingAvailable {
  start_date: string
  end_date: string
}

export interface ClinicImage {
  url: string
  public_id: string
  _id: string
}

export interface Clinic {
  clinic_contact_details: ClinicContactDetails
  clinic_timings: ClinicTimings
  BookingAvailabeAt: BookingAvailable
  _id: string
  clinic_name: string
  clinic_images: ClinicImage[]
  clinic_map: string
  BookingAvailabePastHistory: any[]
  clinic_stauts: string
  clinic_ratings: number
  any_special_note: string
  createdAt: string
  updatedAt: string
  __v: number
}

export interface Doctor {
  _id: string
  doctor_name: string
  doctor_images: any[]
  specialization: string[]
  languagesSpoken: string[]
  doctor_status: string
  doctor_ratings: number
  any_special_note: string
  clinic_ids: string[]
  createdAt: string
  updatedAt: string
  __v: number
}

export interface PaymentDetails {
  subtotal: string
  tax: string
  creditCardFee: string
  total: string
}

export interface Payment {
  payment_details: PaymentDetails
  _id: string
  user_id: string
  amount: number
  paymentMethod: string
  status: string
  razorpay_order_id: string
  paidAt: string
  createdAt: string
  updatedAt: string
  __v: number
  bookingId: string
  completed_at: string
  razorpay_payment_id: string
  razorpay_signature: string
  verification_ip: string
  verification_timestamp: string
  verification_user_agent: string
}

export interface Booking {
  patient_details: PatientDetails
  cancellation: Cancellation
  _id: string
  treatment_id: Treatment
  no_of_session_book: number
  SessionDates: SessionDate[]
  session_booking_user: string
  session_booking_for_clinic: Clinic
  session_booking_for_doctor: Doctor
  session_status: string
  payment_id: Payment
  totalAmount: number
  amountPerSession: number
  bookingSource: string
  priority: string
  session_prescriptions: any[]
  createdAt: string
  updatedAt: string
  bookingNumber: string
  __v: number
  payment_verified_at: string
  completedSessionsCount: number
  nextSession?: SessionDate
  progressPercentage: number
  id: string
  completionPercent: number
  hasTodaySession: boolean
  pendingSessions: number
  isCurrentBooking: boolean
}

export interface BookingSummary {
  totalBookings: number
  currentBookingsCount: number
  historyBookingsCount: number
  todaySessionsCount: number
}

export interface BookingData {
  current: Booking[]
  history: Booking[]
  summary: BookingSummary
}

export interface User {
  _id: string
  name: string
  email: string
  phone?: string
  profileImage?: {
    url: string
    public_id: string
  }
  aadhhar?: string
  createdAt: string
  updatedAt: string
}
