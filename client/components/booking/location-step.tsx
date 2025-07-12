"use client"

import { motion } from "framer-motion"
import { MapPin, Phone, Check, Calendar, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"

// Better type definition
interface BookingAvailableAt {
  start_date: string;
  end_date: string;
}

interface Clinic {
  _id: string;
  clinic_name: string;
  clinic_contact_details: {
    clinic_address: string;
    phone_numbers: string[];
  };
  BookingAvailabeAt?: BookingAvailableAt;
}

interface LocationStepProps {
  selectedLocation: string
  setSelectedLocation: (location: string) => void
  setSelectedClinic: (clinic: Clinic) => void
  data: Record<string, Clinic> | null
}

const LocationStep = ({ selectedLocation, setSelectedLocation, data, setSelectedClinic }: LocationStepProps) => {


  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500">No clinic locations available</p>
      </div>
    )
  }

  // Helper function to check if clinic is available for booking
  const isClinicAvailable = (clinic: Clinic): boolean => {
    if (!clinic.BookingAvailabeAt) return false;

    const currentDate = new Date();
    const startDate = new Date(clinic.BookingAvailabeAt
      .start_date);
    const endDate = new Date(clinic.BookingAvailabeAt
      .end_date);

    return currentDate >= startDate && currentDate <= endDate;
  }

  // Helper function to format date range
  const formatDateRange = (BookingAvailabeAt
    : BookingAvailableAt): string => {
    const startDate = new Date(BookingAvailabeAt
      .start_date);
    const endDate = new Date(BookingAvailabeAt
      .end_date);

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    return `${startDate.toLocaleDateString('en-US', formatOptions)} - ${endDate.toLocaleDateString('en-US', formatOptions)}`;
  }

  // Helper function to get availability status
  const getAvailabilityStatus = (clinic: Clinic): { status: 'available' | 'upcoming' | 'expired' | 'not_set', message: string } => {
    if (!clinic.BookingAvailabeAt
    ) {
      return { status: 'not_set', message: 'Booking dates not configured' };
    }

    const currentDate = new Date();
    const startDate = new Date(clinic.BookingAvailabeAt
      .start_date);
    const endDate = new Date(clinic.BookingAvailabeAt
      .end_date);

    if (currentDate < startDate) {
      return { status: 'upcoming', message: 'Booking opens soon' };
    } else if (currentDate > endDate) {
      return { status: 'expired', message: 'Booking period ended' };
    } else {
      return { status: 'available', message: 'Available for booking' };
    }
  }

  const handleSelected = (clinicId: string) => {
    const selectedClinicData = Object.values(data).find(clinic => clinic._id === clinicId);

    if (selectedClinicData && isClinicAvailable(selectedClinicData)) {
      setSelectedLocation(clinicId);
      setSelectedClinic(selectedClinicData);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-3">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Choose Your Location
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Select the clinic location that's most convenient for your consultation
        </p>
      </motion.div>

      <RadioGroup
        value={selectedLocation}
        onValueChange={handleSelected}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto"
        aria-label="Select clinic location"
      >
        {Object.entries(data).map(([key, clinic], index) => {
          const clinicId = clinic?._id || key;
          const isSelected = selectedLocation === clinicId;
          const isAvailable = isClinicAvailable(clinic);
          const availabilityStatus = getAvailabilityStatus(clinic);

          return (
            <motion.div
              key={clinicId}
              initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.15 + 0.3,
                duration: 0.5,
                ease: "easeOut",
              }}
              className="relative group"
            >
              <RadioGroupItem
                value={clinicId}
                id={clinicId}
                className="peer sr-only"
                disabled={!isAvailable}
              />
              <Label
                htmlFor={clinicId}
                className={`block h-full p-5 rounded-xl border shadow-sm transition-all duration-200 ${isAvailable
                    ? 'bg-white border-slate-200 cursor-pointer hover:border-blue-300 hover:shadow-md hover:scale-[1.02] peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-gradient-to-br peer-data-[state=checked]:from-blue-50 peer-data-[state=checked]:to-indigo-50 peer-data-[state=checked]:shadow-lg peer-data-[state=checked]:scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isAvailable ? 'text-slate-900' : 'text-slate-500'}`}>
                    {clinic?.clinic_name || 'Unnamed Clinic'}
                  </h3>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAvailable
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                      : 'bg-slate-400'
                    }`}>
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                </div>

                <p className={`text-sm mb-4 leading-relaxed ${isAvailable ? 'text-slate-600' : 'text-slate-500'}`}>
                  {clinic?.clinic_contact_details?.clinic_address || 'Address not available'}
                </p>

                {/* Booking Availability Status */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-900">Booking Status</span>
                  </div>

                  <div className="space-y-2">
                    <Badge
                      variant={availabilityStatus.status === 'available' ? 'default' : 'secondary'}
                      className={`text-xs px-2 py-1 rounded-full ${availabilityStatus.status === 'available'
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                          : availabilityStatus.status === 'upcoming'
                            ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200'
                            : availabilityStatus.status === 'expired'
                              ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
                              : 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200'
                        }`}
                    >
                      {availabilityStatus.status === 'available' && <Check className="h-3 w-3 mr-1" />}
                      {availabilityStatus.status !== 'available' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {availabilityStatus.message}
                    </Badge>

                    {clinic.BookingAvailabeAt
                      && (
                        <div className="text-xs text-slate-600">
                          <span className="font-medium">Available: </span>
                          {formatDateRange(clinic.BookingAvailabeAt
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* Contact Information */}
                {clinic?.clinic_contact_details?.phone_numbers &&
                  clinic.clinic_contact_details.phone_numbers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className={`text-sm font-medium flex items-center ${isAvailable ? 'text-slate-900' : 'text-slate-500'}`}>
                        <Phone className="h-3 w-3 mr-1 text-blue-500" />
                        Contact Numbers
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {clinic.clinic_contact_details.phone_numbers.map((phone, phoneIndex) => (
                          <Badge
                            key={`${clinicId}-phone-${phoneIndex}`}
                            variant="secondary"
                            className={`text-xs px-2 py-1 rounded-full transition-all duration-150 ${isAvailable
                                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200 hover:from-blue-200 hover:to-indigo-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                          >
                            {phone}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Disabled Overlay */}
                {!isAvailable && (
                  <div className="absolute inset-0 bg-slate-100/50 rounded-xl flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Currently Unavailable</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && isAvailable && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </motion.div>
                )}
              </Label>
            </motion.div>
          )
        })}
      </RadioGroup>

      {/* Summary of available clinics */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-center pt-4"
      >
        <div className="inline-flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>
            {Object.values(data).filter(clinic => isClinicAvailable(clinic)).length} of {Object.values(data).length} locations available for booking
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default LocationStep