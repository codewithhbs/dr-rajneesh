"use client"

import { useState } from "react"
import { Activity, Calendar, CheckCircle, Package, Settings, Bell, Search, ChevronRight, Clock, MapPin, User, Phone, Mail, AlertCircle, TrendingUp, Heart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ErrorBoundary, ErrorFallback } from "@/components/ui/error-boundary"
import { LoadingCard } from "@/components/ui/loading-spinner"
import { useGetProfile } from "@/hooks/use-getprofile"
import { useGetBooking } from "@/hooks/booking-info"
import DashboardHeader from "./Header-Profile/dashboard-header"
import NextAppointmentCard from "./appointments/next-appointment-card"
import TreatmentProgressCard from "./appointments/treatment-progress-card"
import QuickStatsCard from "./appointments/quick-stats-card"
import { useAuth } from "@/context/authContext/auth"
import UserSummaryCard from "./appointments/user-summary-card"
import AppointmentsCard from "./appointments/AppointmentsCard"

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: bookingData, loading: bookingLoading, error: bookingError, fetchBooking: refetchBookings } = useGetBooking()
  const { setToken } = useAuth()
  const { data: user, loading: userLoading, error: userError, getProfile: refetch } = useGetProfile()

  const handleLogout = () => {
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
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <LoadingCard text="Loading your dashboard..." />
        </div>
      </div>
    )
  }

  // Error state
  if (userError || bookingError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <DashboardHeader onLogout={handleLogout} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Welcome back, {user?.name || 'Patient'}!
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Here's what's happening with your health today
                </p>
              </div>
              <div className="flex gap-3">
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {bookingData?.current?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Active Appointments</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {bookingData?.history?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Completed Visits</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Heart className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {bookingData?.summary?.totalAppointments || 0}
              </p>
              <p className="text-sm text-gray-600">Total Appointments</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {bookingData?.summary?.upcomingAppointments || 0}
              </p>
              <p className="text-sm text-gray-600">Upcoming</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border border-gray-100 p-4">
              <TabsList className="w-full bg-gray-50 rounded-lg p-1 grid grid-cols-5 gap-1">
                <TabsTrigger
                  value="dashboard"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 transition-all
                    data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>

                <TabsTrigger
                  value="appointments"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 transition-all
                    data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Appointments</span>
                </TabsTrigger>

                <TabsTrigger
                  value="history"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 transition-all
                    data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>

                <TabsTrigger
                  value="orders"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 transition-all
                    data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">Orders</span>
                </TabsTrigger>

                <TabsTrigger
                  value="settings"
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 transition-all
                    data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab Content */}
            <TabsContent value="dashboard" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                  <NextAppointmentCard bookings={bookingData.current ?? []} />
                  <TreatmentProgressCard bookings={bookingData.current ?? []} onViewAll={handleViewAllTreatments} />
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                  <UserSummaryCard user={user} />
                  
                  {/* Quick Actions Card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Book Appointment</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>

                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-50 rounded-lg">
                            <Package className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Order Medication</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>

                      <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors text-left">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <Phone className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">Contact Doctor</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* <QuickStatsCard summary={bookingData.summary} currentBookings={bookingData.current} /> */}
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="mt-6">
              <AppointmentsCard appointments={bookingData.current ?? []} type="appointments" />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="mt-6">
              <AppointmentsCard appointments={bookingData.history ?? []} type="history" />
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                <div className="text-center max-w-md mx-auto">
                  <div className="p-4 bg-orange-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Package className="h-10 w-10 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Orders</h3>
                  <p className="text-gray-600 mb-6">
                    View and manage your medication and product orders in one place.
                  </p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    View All Orders
                  </button>
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
                <div className="text-center max-w-md mx-auto">
                  <div className="p-4 bg-indigo-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <Settings className="h-10 w-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Settings</h3>
                  <p className="text-gray-600 mb-6">
                    Manage your profile, preferences, and security settings.
                  </p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                    Manage Settings
                  </button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default PatientDashboard