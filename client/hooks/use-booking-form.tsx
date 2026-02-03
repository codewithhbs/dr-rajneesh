import { useState, useCallback, useMemo } from 'react';
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
      aadhar: '',
    },
  });

  const [errors, setErrors] = useState<BookingError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fixed: More stable updateField function
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const parentObj = (prev[parent as keyof typeof prev] || {}) as Record<string, any>;
        
        // Only update if the value actually changed
        if (parentObj[child] === value) {
          return prev;
        }
        
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value,
          },
        };
      }
      
      // Only update if the value actually changed
      if (prev[field as keyof typeof prev] === value) {
        return prev;
      }
      
      return { ...prev, [field]: value };
    });

    // Clear field-specific errors only when value changes
    setErrors(prev => {
      const filtered = prev.filter(error => error.field !== field);
      return filtered.length === prev.length ? prev : filtered;
    });
  }, []);

  // ✅ Memoize validation function to prevent unnecessary recalculations
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

    const { name, email, phone, aadhar } = formData.patient_details || {};

    if (!name?.trim()) {
      newErrors.push({ field: 'patient_details.name', message: 'Patient name is required' });
    }

    if (!email?.trim()) {
      newErrors.push({ field: 'patient_details.email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.push({ field: 'patient_details.email', message: 'Please enter a valid email' });
    }

    if (!aadhar?.trim()) {
      newErrors.push({ field: 'patient_details.aadhar', message: 'Please enter a valid Aadhar number' });
    }

    if (!phone?.trim()) {
      newErrors.push({ field: 'patient_details.phone', message: 'Phone number is required' });
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
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

  const getFieldError = useCallback(
    (field: string) => errors.find(error => error.field === field)?.message,
    [errors]
  );

  // ✅ Memoize pricing calculation to prevent unnecessary recalculations
  const pricing = useMemo(() => calculatePricing(formData), [calculatePricing, formData]);

  // ✅ Memoize validation result
  const isValid = useMemo(() => validateForm().length === 0, [validateForm]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit,
    getFieldError,
    pricing,
    isValid,
  };
}