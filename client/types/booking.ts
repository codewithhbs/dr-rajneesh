export interface Doctor {
  _id: string;
  doctor_name: string;
  doctor_images?: { url: string }[];
  specialization: string[];
  doctor_ratings: number;
  any_special_note?: string;
}

export interface Service {
  _id: string;
  service_name: string;
  service_small_desc: string;
  service_per_session_price: number;
  service_per_session_discount_price?: number;
  service_status: string;
  service_images?: { url: string }[];
  service_doctor: Doctor;
}

export interface Clinic {
  _id: string;
  clinic_name: string;
  clinic_contact_details: {
    clinic_address: string;
    phone?: string;
    email?: string;
  };
  BookingAvailabeAt?: {
    start_date: string;
    end_date: string;
  };
}

export interface BookingAvailability {
  available: boolean;
  bookedSlots: string[];
  message?: string;
}



export interface PaymentConfig {
  tax_percentage: number;
  convenience_fee: number;
  credit_card_fee: number;
}

export interface BookingConfig {
  slots_per_hour: number;
  working_hours: {
    start: string;
    end: string;
  };
}

export interface Settings {
  payment_config: PaymentConfig;
  booking_config: BookingConfig;
}

export interface BookingFormData {
  service_id: string;
  clinic_id: string;
  date: Date;
  time: string;
  sessions: number;
  payment_method: 'razorpay' | 'card';
  patient_details: {
    name: string;
    email: string;
    phone: string;
    aadhar: string;
  };
}

export interface BookingResponse {
  success: boolean;
  booking_id?: string;
  payment_order_id?: string;
  message: string;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  booking_id: string;
}

export interface PricingBreakdown {
  subtotal: number;
  tax: number;

  creditCard: number;
  total: number;
}



export interface BookingError {
  field?: string;
  message: string;
  code?: string;
}
