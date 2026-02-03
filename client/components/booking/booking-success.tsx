"use client"

import { motion } from "framer-motion"
import { CheckCircle, Calendar, Award, Shield, Home, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface BookingSuccessProps {
  bookingId: string
  patientName: string
  patientPhone: string
  selectedClinic: any
  selectedDate: string
  selectedTimeSlot: string
  finalAmount: number
  resetBooking: () => void
}

const BookingSuccess = ({
  bookingId,
  patientName,
  patientPhone,
  selectedClinic,
  selectedDate,
  selectedTimeSlot,
  finalAmount,
  resetBooking,
}: BookingSuccessProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
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
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                  <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto relative z-10" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="absolute -top-1 -right-1 z-20"
                  >
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  Booking Confirmed! 🎉
                </h1>
                <p className="text-lg text-slate-600 mb-6">Your consultation has been successfully booked.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-6 mb-6 text-left shadow-inner"
              >
                <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-2">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  Booking Details
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Booking ID:</span>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                        {bookingId}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Patient:</span>
                      <span className="font-semibold text-slate-900 text-sm">{patientName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Phone:</span>
                      <span className="font-semibold text-slate-900 text-sm">+91-{patientPhone}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg shadow-sm">
                      <span className="text-slate-600 text-sm font-medium">Location:</span>
                      <span className="font-semibold text-slate-900 text-sm">{selectedClinic?.clinic_name}</span>
                    </div>
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
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
                  <div className="flex items-center">
                    <Award className="h-5 w-5 text-emerald-600 mr-2" />
                    <span className="text-base font-semibold text-slate-900">Total Paid:</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-600">₹{finalAmount.toLocaleString()}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200"
              >
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">Important Instructions</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Please arrive 15 minutes before your appointment time. Bring a valid ID and any relevant medical
                      documents. You'll receive a confirmation SMS shortly.
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
                  Book Another
                </Button>
                <Button
                  size="sm"
                  className="flex items-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Add to Calendar
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default BookingSuccess
