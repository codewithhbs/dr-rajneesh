"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Check, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetAllClinic } from "@/hooks/common";

/* ================= TYPES ================= */

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
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  token?: string;
}

/* ================= COMPONENT ================= */

const formatDateRange = ({
  start_date,
  end_date,
}: BookingAvailableAt): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return `${new Date(start_date).toLocaleDateString(
    "en-US",
    options
  )} - ${new Date(end_date).toLocaleDateString("en-US", options)}`;
};

const LocationStep = ({
  formData,
  setFormData,
  onNext,
  onBack,
}: LocationStepProps) => {
  const { data } = useGetAllClinic();

  const [selectedLocation, setSelectedLocation] = useState(
    formData?.clinic?._id || ""
  );

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No clinic locations available
      </div>
    );
  }

  /* ================= HELPERS ================= */

  const isClinicAvailable = (clinic: Clinic) => {
    if (!clinic.BookingAvailabeAt) return false;

    const now = new Date();
    const start = new Date(clinic.BookingAvailabeAt.start_date);
    const end = new Date(clinic.BookingAvailabeAt.end_date);

    return now >= start && now <= end;
  };

  const getAvailabilityStatus = (clinic: Clinic) => {
    if (!clinic.BookingAvailabeAt) {
      return { type: "not_set", label: "Booking not configured" };
    }

    const now = new Date();
    const start = new Date(clinic.BookingAvailabeAt.start_date);
    const end = new Date(clinic.BookingAvailabeAt.end_date);

    if (now < start) return { type: "upcoming", label: "Booking opens soon" };
    if (now > end) return { type: "expired", label: "Booking closed" };

    return { type: "available", label: "Available for booking" };
  };

  const handleSelect = (clinic: Clinic) => {
    if (!isClinicAvailable(clinic)) return;
    setSelectedLocation(clinic._id);
    setFormData((prev: any) => ({ ...prev, clinic }));
  };

  const handleContinue = () => {
    if (!selectedLocation) return;
    onNext();
  };

  const availableClinics = Object.values(data).filter((clinic: any) =>
    isClinicAvailable(clinic)
  );

  /* ================= UI ================= */

  if (availableClinics.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        No clinics currently open for booking
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-4xl mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">
          Choose Clinic Location
        </h2>
        <p className="text-sm text-slate-600">
          Select the most convenient clinic for your consultation
        </p>
      </div>

      {/* Clinic List */}
      <RadioGroup
        value={selectedLocation}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {availableClinics.map((clinic: any, index: number) => {
          const isSelected = selectedLocation === clinic._id;
          const status = getAvailabilityStatus(clinic);

          return (
            <motion.div
              key={clinic._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <RadioGroupItem
                value={clinic._id}
                id={clinic._id}
                className="peer sr-only"
              />

              <Label
                htmlFor={clinic._id}
                onClick={() => handleSelect(clinic)}
                className={`relative block p-5 rounded-xl border cursor-pointer transition-all
                  bg-white border-slate-200 hover:border-blue-400 hover:shadow-md
                  ${
                    isSelected &&
                    "border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200"
                  }
                `}
              >
                {/* Title */}
                <div className="flex justify-between items-center mb-3">
                  <h3
                    className={`text-lg font-semibold ${
                      isSelected ? "text-green-900" : "text-slate-900"
                    }`}
                  >
                    {clinic.clinic_name}
                  </h3>
                  <MapPin
                    className={`h-4 w-4 ${
                      isSelected ? "text-green-600" : "text-blue-600"
                    }`}
                  />
                </div>

                {/* Address */}
                <p
                  className={`text-sm mb-3 ${
                    isSelected ? "text-green-700" : "text-slate-600"
                  }`}
                >
                  {clinic.clinic_contact_details.clinic_address}
                </p>

                {/* Status */}
                <Badge className="mb-3 bg-green-100 text-green-700">
                  {status.label}
                </Badge>

                {clinic.BookingAvailabeAt && (
                  <div
                    className={`text-xs ${
                      isSelected ? "text-green-700" : "text-slate-600"
                    }`}
                  >
                    <span className="font-medium">Available: </span>
                    {formatDateRange(clinic.BookingAvailabeAt)}
                  </div>
                )}

                {/* Phones */}
                {clinic.clinic_contact_details.phone_numbers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? "text-green-700" : "text-slate-600"
                      }`}
                    >
                      Phone:
                    </span>
                    {clinic.clinic_contact_details.phone_numbers.map(
                      (p: string, i: number) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className={
                            isSelected ? "bg-green-100 text-green-700" : ""
                          }
                        >
                          {p}
                        </Badge>
                      )
                    )}
                  </div>
                )}

                {/* Selected Tick */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg"
                  >
                    <Check className="h-5 w-5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </Label>
            </motion.div>
          );
        })}
      </RadioGroup>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleContinue}
          disabled={!selectedLocation}
          className="bg-[#185FA5] hover:bg-[#134b85] text-white disabled:opacity-50"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default LocationStep;