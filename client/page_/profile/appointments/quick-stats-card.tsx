"use client"
import type React from "react"
import { Activity, Calendar, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BookingSummary, Booking } from "@/types/bookings"

interface QuickStatsCardProps {
  summary: BookingSummary
  currentBookings: Booking[]
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ summary, currentBookings }) => {
  const totalCompletedSessions = (currentBookings ?? []).reduce(
    (sum, booking) => sum + (booking.completedSessionsCount || 0),
    0,
  );


  const stats = [
    {
      label: "Total Bookings",
      value: summary?.totalBookings || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
    },
    {
      label: "Active Treatments",
      value: summary?.currentBookingsCount || 0,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500",
      lightBg: "bg-emerald-50",
    },
    {
      label: "Sessions Completed",
      value: totalCompletedSessions || 0,
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-500",
      lightBg: "bg-purple-50",
    },
    {
      label: "Today's Sessions",
      value: summary?.todaySessionsCount || 0,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-500",
      lightBg: "bg-orange-50",
    },
  ]

  return (
    <Card className="border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <CardTitle className="text-xl md:text-2xl font-bold text-white">
          Quick Stats
        </CardTitle>
      </CardHeader>

      {/* Stats Grid */}
     <CardContent className="p-6 sm:p-8">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {stats.map((stat, index) => {
      const Icon = stat.icon;
      const bgColors = ["#E4EFFE", "#DBFCF5", "#E7FDEE", "#D5FBFF"];
      const bgColor = bgColors[index % bgColors.length];

      return (
        <div
          key={index}
          className="group text-center p-6 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          style={{ backgroundColor: bgColor }}
        >
          <div
            className="rounded-full bg-white p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
          >
            <Icon className={`h-8 w-8 ${stat.color}`} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            {stat.value}
          </div>
          <div className="text-sm font-medium text-gray-600">
            {stat.label}
          </div>
        </div>
      );
    })}
  </div>
</CardContent>


    </Card>
  )
}

export default QuickStatsCard;