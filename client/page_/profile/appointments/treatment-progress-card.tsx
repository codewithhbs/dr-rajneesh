"use client"

import type React from "react"

import { Activity, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Booking } from "@/types/bookings"

interface TreatmentProgressCardProps {
  bookings?: Booking[] // Made optional with default
  onViewAll: () => void
}

const TreatmentProgressCard: React.FC<TreatmentProgressCardProps> = ({ 
  bookings = [], // Default to empty array
  onViewAll 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Safe check for bookings array
  if (!bookings || bookings.length === 0) {
    return <div>No Bookings </div>
  }

  return (
    <Card className="border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300 py-0 rounded-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
          <Activity className="h-5 w-5 md:h-6 md:w-6" />
          Treatment Progress
        </CardTitle>
      </CardHeader>

      {/* Body */}
      <CardContent className="p-4 md:p-6">
        {Array.isArray(bookings) && bookings.length > 0 ? (
          <div className="space-y-5">
            {bookings.slice(0, 2).map((booking) => (
              <div
                key={booking._id}
                className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4 md:p-5"
              >
                {/* Title + Session Count */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <div>
                    {booking.treatment_id && (
                      <h3 className="text-base md:text-lg font-semibold text-slate-800">
                        {booking.treatment_id.service_name}
                      </h3>
                    )}
                    <p className="text-sm text-slate-600">
                      Dr. {booking.session_booking_for_doctor?.doctor_name || 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                    {booking.completedSessionsCount || 0}/{booking.no_of_session_book} Sessions
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-2">
                  <Progress
                    value={booking.completionPercent || 0}
                    className="h-3 w-full bg-purple-100"
                  />
                  <span className="text-sm font-bold text-purple-700 min-w-[50px] text-right">
                    {booking.completionPercent || 0}%
                  </span>
                </div>

                {/* Remaining & Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    {booking.pendingSessions || 0} sessions remaining
                  </div>
                  <Badge variant="outline" className={getStatusColor(booking.session_status)}>
                    {booking.session_status}
                  </Badge>
                </div>
              </div>
            ))}

            {bookings.length > 2 && (
              <p className="text-center text-sm text-slate-600">
                +{bookings.length - 2} more active treatments
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8">
            <div className="bg-purple-100 rounded-full p-5 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Activity className="h-8 w-8 text-purple-400"/>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">No Active Treatments</h3>
            <p className="text-slate-600 text-sm">Start your health journey with us today.</p>
          </div>
        )}
      </CardContent>


      {/* Footer Button */}
      {Array.isArray(bookings) && bookings.length > 0 ? (
      <CardFooter className="bg-purple-50 border-t border-purple-200 p-4 rounded">
            <Button
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-purple-200 hover:text-purple-800 font-medium transition-all duration-300 rounded-lg shadow-sm hover:shadow-md"
              onClick={onViewAll}
            >
              View All Treatment Plans
            </Button>
          </CardFooter>

      ) : null}

    </Card>

  )
}

export default TreatmentProgressCard