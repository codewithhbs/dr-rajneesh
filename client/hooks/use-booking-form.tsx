import { useState, useCallback } from 'react';
import { BookingFormData, BookingError, PricingBreakdown } from '@/types/booking';

interface UseBookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>;
  calculatePricing: (data: Partial<BookingFormData>) => PricingBreakdown;
}

export function useBookingForm({ onSubmit, calculatePricing }: UseBookingFormProps) {
  const [formData, setFormData] = useState<Partial<BookingFormData>>({
    payment_method: 'razorpay',
    patient_details: {
      name: '',
      email: '',
      phone: '',
      aadhar: '' // Added Aadhar field
    }
  });

  const [errors, setErrors] = useState<BookingError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent as keyof typeof prev],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });

    // Clear field-specific errors
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const validateForm = useCallback((): BookingError[] => {
    const newErrors: BookingError[] = [];

    if (!formData.service_id) {
      newErrors.push({ field: 'service_id', message: 'Please select a service' });
    }

    if (!formData.clinic_id) {
      newErrors.push({ field: 'clinic_id', message: 'Please select a clinic' });
    }

    if (!formData.date) {
      newErrors.push({ field: 'date', message: 'Please select a date' });
    }

    if (!formData.time) {
      newErrors.push({ field: 'time', message: 'Please select a time slot' });
    }

    if (!formData.patient_details?.name?.trim()) {
      newErrors.push({ field: 'patient_details.name', message: 'Patient name is required' });
    }

    if (!formData.patient_details?.email?.trim()) {
      newErrors.push({ field: 'patient_details.email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(formData.patient_details.email)) {
      newErrors.push({ field: 'patient_details.email', message: 'Please enter a valid email' });
    }
    else if (!formData.patient_details.aadhar?.trim()) {
      newErrors.push({ field: 'patient_details.aadhar', message: 'Please enter a valid aadhar number' });
    }

    if (!formData.patient_details?.phone?.trim()) {
      newErrors.push({ field: 'patient_details.phone', message: 'Phone number is required' });
    } else if (!/^\d{10}$/.test(formData.patient_details.phone.replace(/\D/g, ''))) {
      newErrors.push({ field: 'patient_details.phone', message: 'Please enter a valid 10-digit phone number' });
    }

    return newErrors;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm();

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      await onSubmit(formData as BookingFormData);
    } catch (error: any) {
      setErrors([{ message: error.message || 'An unexpected error occurred' }]);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  const getFieldError = useCallback((field: string) => {
    return errors.find(error => error.field === field)?.message;
  }, [errors]);

  const pricing = calculatePricing(formData);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    getFieldError,
    pricing,
    isValid: errors.length === 0 && validateForm().length === 0
  };
}
