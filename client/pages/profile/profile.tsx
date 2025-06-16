"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  LogOut,
  Settings,
  Star,
  User,
  Video,
  CheckCircle,
  AlertCircle,
  Lock,
  Package,
  Activity,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

// Mock data
const mockUser = {
  id: "user_123",
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+91 9876543210",
  avatar: "/placeholder.svg?height=100&width=100",
  memberSince: "2022-05-15",
  healthScore: 85,
  nextCheckup: "2025-07-15",
}

const mockAppointments = [
  {
    id: "apt_1",
    doctorName: "Dr. Rajneesh Kant",
    specialty: "Physiotherapy",
    date: "2025-06-20T10:30:00",
    status: "upcoming",
    duration: 30,
    type: "in-person",
    doctorAvatar: "/placeholder.svg?height=40&width=40",
    location: "Main Clinic, 2nd Floor",
  },
  {
    id: "apt_2",
    doctorName: "Dr. Michael Chen",
    specialty: "Chiropractic Care",
    date: "2025-06-25T14:00:00",
    status: "upcoming",
    duration: 45,
    type: "in-person",
    doctorAvatar: "/placeholder.svg?height=40&width=40",
    location: "East Wing, Room 204",
  },
  {
    id: "apt_3",
    doctorName: "Dr. Emily Wilson",
    specialty: "Rehabilitation",
    date: "2025-07-03T11:15:00",
    status: "upcoming",
    duration: 60,
    type: "video",
    doctorAvatar: "/placeholder.svg?height=40&width=40",
  },
]

const mockCompletedSessions = [
  {
    id: "ses_1",
    doctorName: "Dr. Rajneesh Kant",
    specialty: "Physiotherapy",
    date: "2025-05-10T09:00:00",
    duration: 30,
    type: "in-person",
    rated: true,
    rating: 5,
    doctorAvatar: "/placeholder.svg?height=40&width=40",
    notes: "Lower back pain treatment - significant improvement",
  },
  {
    id: "ses_2",
    doctorName: "Dr. Lisa Wong",
    specialty: "Chiropractic Care",
    date: "2025-05-20T16:30:00",
    duration: 60,
    type: "in-person",
    rated: true,
    rating: 4,
    doctorAvatar: "/placeholder.svg?height=40&width=40",
    notes: "Neck adjustment and posture correction",
  },
  {
    id: "ses_3",
    doctorName: "Dr. James Miller",
    specialty: "Sports Rehabilitation",
    date: "2025-06-05T13:45:00",
    duration: 45,
    type: "video",
    rated: false,
    doctorAvatar: "/placeholder.svg?height=40&width=40",
    notes: "Follow-up on knee rehabilitation exercises",
  },
]

const mockOrders = [
  {
    id: "ord_1",
    date: "2025-06-01T08:15:00",
    items: [
      { name: "Posture Corrector Brace", quantity: 1, price: 2500 },
      { name: "Therapeutic Heat Pack", quantity: 2, price: 500 },
    ],
    status: "delivered",
    total: 3500,
  },
  {
    id: "ord_2",
    date: "2025-05-15T14:30:00",
    items: [
      { name: "Joint Support Supplements", quantity: 1, price: 800 },
      { name: "Massage Therapy Oil", quantity: 1, price: 1200 },
    ],
    status: "processing",
    total: 2000,
  },
  {
    id: "ord_3",
    date: "2025-04-28T11:45:00",
    items: [{ name: "Therapeutic Exercise Band Set", quantity: 1, price: 1500 }],
    status: "delivered",
    total: 1500,
  },
]

const mockTreatmentPlans = [
  {
    id: "plan_1",
    name: "Lower Back Pain Management",
    progress: 65,
    startDate: "2025-04-15",
    endDate: "2025-07-15",
    sessions: {
      completed: 6,
      total: 10,
    },
  },
  {
    id: "plan_2",
    name: "Neck Pain & Posture Correction",
    progress: 40,
    startDate: "2025-05-10",
    endDate: "2025-08-10",
    sessions: {
      completed: 4,
      total: 10,
    },
  },
]

const Profile = () => {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [rating, setRating] = useState(0)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" })
  const [isLoading, setIsLoading] = useState(false)

  const handleRatingClick = (appointment) => {
    setSelectedAppointment(appointment)
    setRating(appointment.rated ? appointment.rating : 0)
    setRatingDialogOpen(true)
  }

  const handleRatingSubmit = () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setRatingDialogOpen(false)
      // Update the rating in the mock data (in a real app, this would be an API call)
      const updatedSessions = mockCompletedSessions.map((session) => {
        if (session.id === selectedAppointment.id) {
          return { ...session, rated: true, rating }
        }
        return session
      })
      // In a real app, you would update state with the new data
      setSelectedAppointment(null)
    }, 1000)
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setPasswordMessage({ type: "", text: "" })

    // Simple validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "All fields are required" })
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters" })
      return
    }

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setPasswordMessage({ type: "success", text: "Password updated successfully" })
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }, 1500)
  }

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    console.log("Logging out...")
    // Redirect to login page
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-[#2686f3af] text-white py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <h1 className="text-xl font-bold">Patient Dashboard</h1>
          </div>
          <Button variant="outline" className="text-black border-white hover:bg-blue-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        {/* User Summary Card */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-300 to-blue-500 text-white overflow-hidden border-none shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-white/20">
                  <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                  <AvatarFallback className="bg-blue-700">{mockUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{mockUser.name}</h2>
                  <p className="text-blue-100">{mockUser.email}</p>
                  <p className="text-blue-100">{mockUser.phone}</p>
                  <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge className="bg-blue-700 hover:bg-blue-800">
                      Member since {format(new Date(mockUser.memberSince), "MMM yyyy")}
                    </Badge>
                    <Badge className="bg-green-600 hover:bg-green-700">Active Patient</Badge>
                  </div>
                </div>
                <div className="hidden md:block w-px h-24 bg-blue-400/30"></div>
                <div className="text-center md:text-left">
                  <div className="mb-4">
                    <p className="text-blue-100 mb-1">Health Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={mockUser.healthScore} className="h-2 w-32 bg-blue-300" />
                      <span className="font-bold">{mockUser.healthScore}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-100 mb-1">Next Checkup</p>
                    <p className="font-semibold">{format(new Date(mockUser.nextCheckup), "MMMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-8 bg-blue-100 p-1 rounded-xl">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <Activity className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Appointments</span>
              <span className="sm:hidden">Appts</span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Orders</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Next Appointment */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-2">
                  <CardTitle className="text-blue-800 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    Next Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {mockAppointments.length > 0 ? (
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 rounded-full p-3 flex-shrink-0">
                        <Calendar className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{mockAppointments[0].doctorName}</h3>
                        <p className="text-gray-600">{mockAppointments[0].specialty}</p>
                        <div className="mt-2 space-y-1">
                          <p className="flex items-center text-gray-700">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            {format(new Date(mockAppointments[0].date), "MMMM d, yyyy")}
                          </p>
                          <p className="flex items-center text-gray-700">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            {format(new Date(mockAppointments[0].date), "h:mm a")}
                          </p>
                          {mockAppointments[0].location && (
                            <p className="flex items-center text-gray-700">
                              <User className="h-4 w-4 mr-2 text-blue-500" />
                              {mockAppointments[0].location}
                            </p>
                          )}
                        </div>
                        <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                          {mockAppointments[0].type === "video" ? "Join Video Call" : "View Details"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No upcoming appointments</p>
                  )}
                </CardContent>
              </Card>

              {/* Treatment Plans */}
              <Card className="border-blue-100 shadow-md">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-2">
                  <CardTitle className="text-blue-800 flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-blue-600" />
                    Treatment Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {mockTreatmentPlans.map((plan) => (
                      <div key={plan.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{plan.name}</h3>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {plan.sessions.completed}/{plan.sessions.total} Sessions
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={plan.progress} className="h-2 flex-1 bg-blue-100" />
                          <span className="text-sm font-medium text-blue-700">{plan.progress}%</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(plan.startDate), "MMM d")} - {format(new Date(plan.endDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="bg-blue-50 border-t border-blue-100">
                  <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
                    View All Treatment Plans
                  </Button>
                </CardFooter>
              </Card>

              {/* Recent Sessions */}
              <Card className="border-blue-100 shadow-md md:col-span-2">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-blue-800 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                      Recent Sessions
                    </CardTitle>
                    <Button variant="link" className="text-blue-600 p-0" onClick={() => setActiveTab("completed")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {mockCompletedSessions.slice(0, 2).map((session) => (
                      <div key={session.id} className="flex items-start gap-4 p-4 rounded-lg bg-blue-50/50">
                        <Avatar>
                          <AvatarImage src={session.doctorAvatar || "/placeholder.svg"} alt={session.doctorName} />
                          <AvatarFallback className="bg-blue-200 text-blue-700">
                            {session.doctorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{session.doctorName}</h3>
                              <p className="text-sm text-gray-600">{session.specialty}</p>
                            </div>
                            <Badge
                              variant={session.type === "video" ? "default" : "outline"}
                              className={
                                session.type === "video"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "border-blue-200 text-blue-700"
                              }
                            >
                              {session.type === "video" ? (
                                <Video className="h-3 w-3 mr-1" />
                              ) : (
                                <User className="h-3 w-3 mr-1" />
                              )}
                              {session.type === "video" ? "Video" : "In-person"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{session.notes}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">
                              {format(new Date(session.date), "MMMM d, yyyy")} at{" "}
                              {format(new Date(session.date), "h:mm a")}
                            </p>
                            {session.rated && (
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < session.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-blue-800">Upcoming Appointments</CardTitle>
                    <CardDescription>
                      You have {mockAppointments.length} upcoming appointments scheduled.
                    </CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book New
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {mockAppointments.map((appointment) => (
                    <Card key={appointment.id} className="overflow-hidden border-blue-100">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 h-2"></div>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage
                                src={appointment.doctorAvatar || "/placeholder.svg"}
                                alt={appointment.doctorName}
                              />
                              <AvatarFallback className="bg-blue-200 text-blue-700">
                                {appointment.doctorName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{appointment.doctorName}</h3>
                              <p className="text-sm text-gray-500">{appointment.specialty}</p>
                            </div>
                          </div>
                          <Badge
                            variant={appointment.type === "video" ? "default" : "outline"}
                            className={
                              appointment.type === "video"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "border-blue-200 text-blue-700"
                            }
                          >
                            {appointment.type === "video" ? (
                              <Video className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {appointment.type === "video" ? "Video" : "In-person"}
                          </Badge>
                        </div>
                        <Separator className="my-4 bg-blue-100" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">{format(new Date(appointment.date), "MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">
                              {format(new Date(appointment.date), "h:mm a")} ({appointment.duration} min)
                            </span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center sm:col-span-2">
                              <User className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-sm">{appointment.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-blue-50 p-4 flex flex-wrap gap-2 justify-between">
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                          Reschedule
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          {appointment.type === "video" ? "Join Call" : "View Details"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Sessions Tab */}
          <TabsContent value="completed">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="text-blue-800">Treatment History</CardTitle>
                <CardDescription>Your past appointments and consultations.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {mockCompletedSessions.map((session) => (
                    <Card key={session.id} className="overflow-hidden border-blue-100">
                      <div
                        className={`h-2 ${
                          session.rated
                            ? "bg-gradient-to-r from-green-500 to-green-400"
                            : "bg-gradient-to-r from-amber-500 to-amber-400"
                        }`}
                      ></div>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={session.doctorAvatar || "/placeholder.svg"} alt={session.doctorName} />
                              <AvatarFallback className="bg-blue-200 text-blue-700">
                                {session.doctorName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{session.doctorName}</h3>
                              <p className="text-sm text-gray-500">{session.specialty}</p>
                            </div>
                          </div>
                          <Badge
                            variant={session.type === "video" ? "default" : "outline"}
                            className={
                              session.type === "video"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : "border-blue-200 text-blue-700"
                            }
                          >
                            {session.type === "video" ? (
                              <Video className="h-3 w-3 mr-1" />
                            ) : (
                              <User className="h-3 w-3 mr-1" />
                            )}
                            {session.type === "video" ? "Video" : "In-person"}
                          </Badge>
                        </div>
                        <Separator className="my-4 bg-blue-100" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">{format(new Date(session.date), "MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-blue-500" />
                            <span className="text-sm">
                              {format(new Date(session.date), "h:mm a")} ({session.duration} min)
                            </span>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-700">{session.notes}</p>
                        </div>
                        {session.rated && (
                          <div className="mt-4 flex items-center">
                            <span className="text-sm text-gray-500 mr-2">Your rating:</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < session.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="bg-blue-50 p-4 flex flex-wrap gap-2 justify-between">
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                          <FileText className="h-4 w-4 mr-2" />
                          View Summary
                        </Button>
                        {!session.rated && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleRatingClick(session)}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Rate Session
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-blue-800">Your Orders</CardTitle>
                    <CardDescription>View and track your medication and product orders.</CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Package className="mr-2 h-4 w-4" />
                    Visit Shop
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {mockOrders.map((order) => (
                    <Card key={order.id} className="overflow-hidden border-blue-100">
                      <CardHeader className="pb-2 bg-blue-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base text-blue-800">Order #{order.id}</CardTitle>
                            <CardDescription>{format(new Date(order.date), "MMMM d, yyyy")}</CardDescription>
                          </div>
                          <Badge
                            variant={order.status === "delivered" ? "default" : "outline"}
                            className={
                              order.status === "delivered"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ul className="space-y-3">
                          {order.items.map((item, index) => (
                            <li key={index} className="flex justify-between text-sm bg-blue-50/50 p-3 rounded-lg">
                              <span className="font-medium text-gray-800">
                                {item.name} x {item.quantity}
                              </span>
                              <span className="font-medium text-blue-700">₹{item.price.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-4 bg-blue-100" />
                        <div className="flex justify-between font-medium text-lg">
                          <span>Total</span>
                          <span className="text-blue-700">₹{order.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-blue-50 p-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          View Order Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="text-blue-800">Account Settings</CardTitle>
                <CardDescription>Manage your account settings and change your password.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-8">
                  {/* Change Password Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                      <Lock className="h-5 w-5 mr-2 text-blue-600" />
                      Change Password
                    </h3>

                    {passwordMessage.text && (
                      <div
                        className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                          passwordMessage.type === "success"
                            ? "bg-green-50 text-green-800 border border-green-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {passwordMessage.type === "success" ? (
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="text-sm">{passwordMessage.text}</span>
                      </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </form>
                  </div>

                  <Separator className="bg-blue-100" />

                  {/* Account Preferences */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                      <Settings className="h-5 w-5 mr-2 text-blue-600" />
                      Account Preferences
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-gray-500">Receive email about your appointments</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                          Configure
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50">
                        <div>
                          <h4 className="font-medium">SMS Notifications</h4>
                          <p className="text-sm text-gray-500">Receive text messages about your appointments</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                          Configure
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50/50">
                        <div>
                          <h4 className="font-medium">Health Data Sharing</h4>
                          <p className="text-sm text-gray-500">Manage how your health data is shared with doctors</p>
                        </div>
                        <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-blue-100" />

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4 flex items-center text-blue-800">
                      <User className="h-5 w-5 mr-2 text-blue-600" />
                      Personal Information
                    </h3>

                    <Button className="bg-blue-600 hover:bg-blue-700">Edit Profile</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-blue-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg">
            <DialogTitle className="text-blue-800">Rate Your Session</DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <>
                  Session with {selectedAppointment.doctorName} on{" "}
                  {format(new Date(selectedAppointment.date), "MMMM d, yyyy")}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex flex-col items-center space-y-4">
              {selectedAppointment && (
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedAppointment.doctorAvatar || "/placeholder.svg"}
                      alt={selectedAppointment.doctorName}
                    />
                    <AvatarFallback className="bg-blue-200 text-blue-700 text-xl">
                      {selectedAppointment.doctorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">{selectedAppointment.doctorName}</h3>
                    <p className="text-gray-500">{selectedAppointment.specialty}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm font-medium">How was your experience?</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <button key={i} type="button" onClick={() => setRating(i + 1)} className="focus:outline-none">
                      <Star
                        className={`h-10 w-10 ${
                          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        } hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full">
                <Label htmlFor="feedback" className="mb-2 block">
                  Additional Feedback (Optional)
                </Label>
                <textarea
                  id="feedback"
                  className="w-full h-24 p-3 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share your experience with the treatment..."
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex space-x-2 sm:justify-between bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <Button
              variant="outline"
              onClick={() => setRatingDialogOpen(false)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Submitting...
                </>
              ) : (
                "Submit Rating"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Profile
