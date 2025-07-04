"use client"

import { motion } from "framer-motion"
import { XCircle, Clock, Home, CreditCard } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface BookingFailedProps {
  patientName: string
  patientPhone: string
  selectedClinic: unknown
  selectedDate: string
  selectedTimeSlot: string
  selectedSessions: number
  finalAmount: number
  resetBooking: () => void
  setBookingStatus: (status: "booking" | "success" | "failed") => void
}



const BookingFailed = ({
  patientName,
  patientPhone,
  selectedClinic,
  selectedDate,
  selectedTimeSlot,
  selectedSessions,
  finalAmount,
  resetBooking,
  setBookingStatus,
}: BookingFailedProps) => {

  const Clinics = selectedClinic as { clinic_name: string } | null;
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-pink-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}
                className="mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                  <XCircle className="h-20 w-20 text-red-500 mx-auto relative z-10" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  Booking Failed 😔
                </h1>
                <p className="text-lg text-slate-600 mb-6">{`We couldn't process your payment. Please try again.`}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 mb-6 text-left shadow-inner"
              >
                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-2">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  Attempted Booking Details
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Patient:</span>
                      <span className="font-semibold text-slate-900 text-sm">{patientName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Phone:</span>
                      <span className="font-semibold text-slate-900 text-sm">+91-{patientPhone}</span>
                    </div>
                    {Clinics?.clinic_name && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                        <span className="text-slate-600 text-sm font-medium">Location:</span>
                        <span className="font-semibold text-slate-900 text-sm">{Clinics?.clinic_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Date:</span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {new Date(selectedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Time:</span>
                      <span className="font-semibold text-slate-900 text-sm">{selectedTimeSlot}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Sessions:</span>
                      <span className="font-semibold text-slate-900 text-sm">
                        {selectedSessions} session{selectedSessions > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                  <span className="text-base font-semibold text-slate-900">Amount:</span>
                  <span className="text-xl font-bold text-red-600">₹{finalAmount.toLocaleString()}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 mb-6 border border-red-200"
              >
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1 text-sm">Payment Failed</h4>
                    <p className="text-xs text-red-800 leading-relaxed">
                      Your payment could not be processed. Please check your payment details and try again. If the issue
                      persists, contact our support team.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 justify-center"
              >
                <Button
                  onClick={resetBooking}
                  variant="outline"
                  size="sm"
                  className="flex items-center border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-sm bg-transparent"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
                <Button
                  onClick={() => setBookingStatus("booking")}
                  size="sm"
                  className="flex items-center bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Try Payment Again
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default BookingFailed
