"use client"

import { useState } from "react"
import { Activity, Calendar, CheckCircle, Package, Settings } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorBoundary, ErrorFallback } from "@/components/ui/error-boundary"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { useGetProfile } from "@/hooks/use-getprofile"
import { useGetBooking } from "@/hooks/booking-info"
import { DashboardHeader } from "./Header-Profile/dashboard-header"
import { UserSummaryCard } from "./appointments/user-summary-card"
import { NextAppointmentCard } from "./appointments/next-appointment-card"
import { TreatmentProgressCard } from "./appointments/treatment-progress-card"
import { QuickStatsCard } from "./appointments/quick-stats-card"
import { useAuth } from "@/context/authContext/auth"


const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard")

  const { data: bookingData, loading: bookingLoading, error: bookingError, fetchBooking: refetchBookings } = useGetBooking()
  const { setToken } = useAuth()
  const { data: user, loading: userLoading, error: userError, getProfile: refetch } = useGetProfile()

  const handleLogout = () => {

    console.log("Logging out...")
    sessionStorage.clear()
    localStorage.clear()
    setToken('')
    
    window.location.href = "/login"
  }

  const handleViewAllTreatments = () => {
    setActiveTab("appointments")
  }

  // Loading state
  if (userLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DashboardHeader onLogout={handleLogout} />
        <div className="container mx-auto py-8 px-4">
          <LoadingCard text="Loading your dashboard..." />
        </div>
      </div>
    )
  }

  // Error state
  if (userError || bookingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DashboardHeader onLogout={handleLogout} />
        <div className="container mx-auto py-8 px-4">
          <ErrorFallback
            error={userError || bookingError || undefined}
            onRetry={() => {
              refetch()
              refetchBookings()
            }}
          />
        </div>
      </div>
    )
  }

  // No data state
  if (!user || !bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DashboardHeader onLogout={handleLogout} />
        <div className="container mx-auto py-8 px-4">
          <ErrorFallback
            error="No data available"
            onRetry={() => {
              refetch()
              refetchBookings()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <DashboardHeader onLogout={handleLogout} />

        <div className="container mx-auto py-8 px-4 space-y-8">
          {/* User Summary */}
          <UserSummaryCard user={user} />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-4 pb-4">
            <TabsList className="flex overflow-x-auto scrollbar-hide gap-1 p-1.5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 shadow-lg border border-gray-200/50 mb-8 backdrop-blur-sm">
              <TabsTrigger
                value="dashboard"
                className="flex-shrink-0 inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-300 ease-out
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 
    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/25
    data-[state=active]:scale-105 data-[state=active]:transform
    hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102 hover:transform
    active:scale-100"
              >
                <Activity className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Home</span>
              </TabsTrigger>

              <TabsTrigger
                value="appointments"
                className="flex-shrink-0 inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-300 ease-out
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 
    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-500/25
    data-[state=active]:scale-105 data-[state=active]:transform
    hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102 hover:transform
    active:scale-100"
              >
                <Calendar className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span className="hidden sm:inline">Appointments</span>
                <span className="sm:hidden">Appts</span>
              </TabsTrigger>

              <TabsTrigger
                value="history"
                className="flex-shrink-0 inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-300 ease-out
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 
    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25
    data-[state=active]:scale-105 data-[state=active]:transform
    hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102 hover:transform
    active:scale-100"
              >
                <CheckCircle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>History</span>
              </TabsTrigger>

              <TabsTrigger
                value="orders"
                className="flex-shrink-0 inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-300 ease-out
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 
    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25
    data-[state=active]:scale-105 data-[state=active]:transform
    hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102 hover:transform
    active:scale-100"
              >
                <Package className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Orders</span>
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="flex-shrink-0 inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-gray-600 transition-all duration-300 ease-out
    data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 
    data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-500/25
    data-[state=active]:scale-105 data-[state=active]:transform
    hover:bg-white/80 hover:text-gray-800 hover:shadow-md hover:scale-102 hover:transform
    active:scale-100"
              >
                <Settings className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <NextAppointmentCard bookings={bookingData.current} />
                <TreatmentProgressCard bookings={bookingData.current} onViewAll={handleViewAllTreatments} />
              </div>

              <QuickStatsCard summary={bookingData.summary} currentBookings={bookingData.current} />
            </TabsContent>

            {/* Other tabs content would go here */}
            <TabsContent value="appointments">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Appointments View</h3>
                <p className="text-gray-600">This section will show all your appointments.</p>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Treatment History</h3>
                <p className="text-gray-600">This section will show your treatment history.</p>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Orders</h3>
                <p className="text-gray-600">This section will show your medication and product orders.</p>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-12">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Account Settings</h3>
                <p className="text-gray-600">This section will show your account settings.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default PatientDashboard
