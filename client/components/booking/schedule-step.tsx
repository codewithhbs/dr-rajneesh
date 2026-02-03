"use client";

import { motion } from "framer-motion";
import { CalendarIcon, Clock, Check, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { useSettings } from "@/hooks/use-settings";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { LOCAL_API_ENDPOINT } from "@/constant/url";

const convertTo24Hour = (time: string) => {
  const [timePart, modifier] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

interface BookingAvailability {
  available: boolean;
  message?: string;
}

const ScheduleStep = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { settings, loading: settingsLoading } = useSettings();

  // Extract from URL
  const urlDate = searchParams.get("date");
  const urlTime = searchParams.get("time");
  const urlSessions = searchParams.get("sessions");

  const serviceid = searchParams.get("service");
  const clinic = searchParams.get("clinic");

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSessions, setSelectedSessions] = useState<number>(1);

  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [generatedTimeSlots, setGeneratedTimeSlots] = useState<string[]>([]);

  // Helper to update URL without page reload
  const updateQueryParams = useCallback(
    (updates: { date?: string; time?: string; sessions?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.date !== undefined) {
        updates.date ? params.set("date", updates.date) : params.delete("date");
      }
      if (updates.time !== undefined) {
        updates.time ? params.set("time", updates.time) : params.delete("time");
      }
      if (updates.sessions !== undefined) {
        updates.sessions
          ? params.set("sessions", updates.sessions)
          : params.delete("sessions");
      }

      router.push(`${pathname}?${params.toString()}`, { shallow: true });
    },
    [pathname, router, searchParams]
  );

  // Sync URL → State on mount or when URL changes
  useEffect(() => {
    if (urlDate) {
      try {
        const parsedDate = parse(urlDate, "yyyy-MM-dd", new Date());
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
        }
      } catch (e) {
        console.warn("Invalid date in URL");
      }
    } else {
      setSelectedDate(undefined);
    }

    if (urlTime && generatedTimeSlots.includes(urlTime)) {
      setSelectedTime(urlTime);
    } else if (urlTime) {
      setSelectedTime(""); // Invalid time
    }

    if (urlSessions) {
      const num = parseInt(urlSessions);
      if (!isNaN(num) && num >= 1 && num <= 6) {
        setSelectedSessions(num);
      }
    }
  }, [urlDate, urlTime, urlSessions, generatedTimeSlots]);

  // Sync State → URL when selections change
  useEffect(() => {
    const formattedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

    updateQueryParams({
      date: formattedDate,
      time: selectedTime || undefined,
      sessions: selectedSessions > 1 ? selectedSessions.toString() : undefined, // Only set if >1
    });
  }, [selectedDate, selectedTime, selectedSessions, updateQueryParams]);

  // Generate time slots from settings
  useEffect(() => {
    if (!settings?.booking_config) return;

    const { start_time = "09:00", end_time = "18:00", slots_per_hour = 1 } = settings.booking_config;

    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const minutesTo12Hour = (timeMinutes: number): string => {
      const hours = Math.floor(timeMinutes / 60);
      const mins = timeMinutes % 60;
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")} ${period}`;
    };

    const slots: string[] = [];
    const minutesPerSlot = 60 / slots_per_hour;
    let current = timeToMinutes(start_time);
    const end = timeToMinutes(end_time);

    while (current < end) {
      slots.push(minutesTo12Hour(current));
      current += minutesPerSlot;
    }

    setGeneratedTimeSlots(slots);
  }, [settings?.booking_config]);

  // Check availability
  const checkAvailability = useCallback(async () => {
    if (!selectedDate || !selectedTime || !serviceid || !clinic) {
      setAvailability(null);
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setAvailability({ available: false, message: "Authentication required" });
      return;
    }

    setIsCheckingAvailability(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const time24 = convertTo24Hour(selectedTime);

    try {
      const response = await axios.post(
        `${LOCAL_API_ENDPOINT}/user/bookings/availability`,
        {
          date: formattedDate,
          time: time24,
          service_id: serviceid,
          clinic_id: clinic,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setAvailability(response.data?.data || { available: true });
    } catch (err: any) {
      console.error("Availability check failed:", err);
      setAvailability({
        available: false,
        message: err?.response?.data?.message || "Slot unavailable",
      });
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [selectedDate, selectedTime, serviceid, clinic]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const isSlotDisabled = () => availability && !availability.available;

  const getAvailabilityMessage = () => {
    if (isCheckingAvailability) return "Checking availability...";
    if (availability && !availability.available) return availability.message || "Slot not available";
    if (selectedDate && selectedTime) return "Slot available!";
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">
          Schedule Your Appointment
        </h2>
        <p className="text-sm text-slate-600">
          Select date, time & number of sessions
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* DATE */}
        <Card className="border border-slate-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <Label className="font-semibold">Select Date</Label>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || undefined)}
              disabled={(date) => date < new Date() || date > new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)}
              className="rounded-md border"
            />

            {selectedDate && (
              <p className="text-sm text-center text-slate-600">
                Selected: <span className="font-medium">{format(selectedDate, "dd MMM yyyy")}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* TIME */}
        <Card className="border border-slate-200">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <Label className="font-semibold">Select Time</Label>
            </div>

            {!selectedDate ? (
              <p className="text-sm text-slate-500 text-center">Please select a date first</p>
            ) : settingsLoading || generatedTimeSlots.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {generatedTimeSlots.map((slot) => {
                  const disabled = isSlotDisabled();
                  return (
                    <button
                      key={slot}
                      onClick={() => !disabled && setSelectedTime(slot)}
                      disabled={disabled || isCheckingAvailability}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-all relative",
                        selectedTime === slot
                          ? "bg-purple-600 text-white border-purple-600"
                          : disabled
                          ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                          : "bg-white border-slate-200 hover:border-purple-400 hover:bg-purple-50"
                      )}
                    >
                      {slot}
                      {selectedTime === slot && !disabled && (
                        <Check className="h-4 w-4 mx-auto mt-1" />
                      )}
                      {isCheckingAvailability && selectedTime === slot && (
                        <Loader2 className="h-4 w-4 mx-auto mt-1 animate-spin" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedDate && selectedTime && (
              <p
                className={cn(
                  "text-xs text-center mt-3 font-medium",
                  availability?.available ? "text-green-600" : "text-red-600"
                )}
              >
                {getAvailabilityMessage()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* SESSIONS */}
        <Card className="border border-slate-200">
          <CardContent className="p-5 space-y-4">
            <Label className="font-semibold">Number of Sessions</Label>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedSessions(num)}
                  disabled={!selectedDate || !selectedTime || !availability?.available}
                  className={cn(
                    "p-4 rounded-lg border font-semibold transition-all",
                    selectedSessions === num
                      ? "bg-green-600 text-white border-green-600"
                      : !selectedDate || !selectedTime || !availability?.available
                      ? "bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed"
                      : "bg-white border-slate-200 hover:border-green-400 hover:bg-green-50"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SUMMARY */}
      {selectedDate && selectedTime && availability?.available && (
        <div className="text-center bg-green-50 border border-green-200 rounded-lg py-4 px-6">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Ready to book:</span>{" "}
            {format(selectedDate, "dddd, dd MMM yyyy")} at{" "}
            <span className="font-medium">{selectedTime}</span> for{" "}
            <span className="font-medium">{selectedSessions}</span>{" "}
            {selectedSessions === 1 ? "session" : "sessions"}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ScheduleStep;