"use client"

import type React from "react"

import { format } from "date-fns"
import { Calendar, Clock, MapPin, Stethoscope, Video } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Booking, SessionDate } from "@/types/bookings"
import Link from "next/link"

interface NextAppointmentCardProps {
  bookings: Booking[]
}

interface NextAppointmentData extends SessionDate {
  booking: Booking
}

export const NextAppointmentCard: React.FC<NextAppointmentCardProps> = ({ bookings }) => {
  const getNextAppointment = (): NextAppointmentData | null => {
    const today = new Date()
    let nextAppointment: NextAppointmentData | null = null
    let nearestDate: Date | null = null

    bookings.forEach((booking) => {
      booking.SessionDates?.forEach((session) => {
        if (["Pending", "Confirmed", "Rescheduled"].includes(session.status)) {
          const sessionDate = new Date(session.date)
          if (sessionDate >= today && (!nearestDate || sessionDate < nearestDate)) {
            nearestDate = sessionDate
            nextAppointment = {
              ...session,
              booking,
            }
          }
        }
      })
    })

    return nextAppointment
  }

  const nextAppointment = getNextAppointment()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Rescheduled":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 py-0 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
          <Calendar className="h-5 w-5 md:h-6 md:w-6" />
          Next Appointment
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 md:p-6">
        {nextAppointment ? (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Icon Section */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4 self-start shadow-md">
              <Stethoscope className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>

            {/* Content Section */}
            <div className="flex-1 space-y-4">
              {/* Doctor & Service Info */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-slate-800">
                  {nextAppointment.booking.session_booking_for_doctor.doctor_name}
                </h3>
                {nextAppointment.booking.treatment_id && (

                  <p className="text-slate-600 text-sm md:text-base">
                    {nextAppointment.booking.treatment_id.service_name}
                  </p>
                )}
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center text-slate-700 bg-slate-50 rounded-md px-4 py-2">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">
                    {format(new Date(nextAppointment.date), "EEEE, MMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center text-slate-700 bg-slate-50 rounded-md px-4 py-2">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">{nextAppointment.time}</span>
                </div>

                <div className="flex items-center text-slate-700 bg-slate-50 rounded-md px-4 py-2 col-span-full">
                  <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium truncate">
                    {nextAppointment.booking.session_booking_for_clinic.clinic_name}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getStatusColor(nextAppointment.status)}>
                  {nextAppointment.status}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Session {nextAppointment.sessionNumber}
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Video className="h-3 w-3 mr-1" />
                  In-Person
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  View Details
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Reschedule
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 sm:p-8">
            <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No Upcoming Appointments</h3>
            <p className="text-slate-600 mb-4 text-sm">
              Schedule your next appointment to continue your treatment.
            </p>
            <Link href={'/book-now-consultation'}>
            
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Book New Appointment
            </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>

  )
}
