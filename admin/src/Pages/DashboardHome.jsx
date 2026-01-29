import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity,
  Users,
  TrendingUp,
  Calendar,
  ClipboardList   ,
  UserCheck,
} from "lucide-react";
import { Stethoscope, Heart, Award, Clock } from "lucide-react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  else if (hour < 18) return "Good Afternoon";
  else return "Good Evening";
};

const DashboardHome = () => {
  
 const [services, setServices] = useState([]);
const [statsData, setStatsData] = useState({
  bookings: 0,
  clinics: 0,
  doctors: 0,
  users: 0,
  blogs: 0,
  treatments: 0,
});

useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Include /get-user-count API again
      const [
        bookingsRes,
        clinicsRes,
        doctorsRes,
        usersRes,
        blogsRes,
         servicesRes,
      ] = await Promise.all([
        axios.get("https://api.drrajneeshkant.in/api/v1/get-booking-count", { headers }),
        axios.get("https://api.drrajneeshkant.in/api/v1/get-clinic-count", { headers }),
        axios.get("https://api.drrajneeshkant.in/api/v1/get-doctor-count", { headers }),
        axios.get("https://api.drrajneeshkant.in/api/v1/get-user-count", { headers }),
        axios.get("https://api.drrajneeshkant.in/api/v1/get-blogs-count", { headers }),
         axios.get("https://api.drrajneeshkant.in/api/v1/get-service-count", { headers }),
      ]);

      setStatsData({
        bookings: bookingsRes.data?.count || 0,
        clinics: clinicsRes.data?.count || 0,
        doctors: doctorsRes.data?.count || 0,
        users: usersRes.data?.count || 0, 
        blogs: blogsRes.data?.count || 0,
        treatments: servicesRes.data?.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  fetchStats();
}, []);

const stats = [
  {
    icon: Calendar,
    label: "Bookings",
    value: statsData.bookings,
    iconColor: "text-blue-500",
    bgGradient: "from-blue-50 to-blue-100",
    accentColor: "text-blue-600",
  },
  {
    icon: Stethoscope,
    label: "Clinics",
    value: statsData.clinics,
    iconColor: "text-cyan-500",
    bgGradient: "from-cyan-50 to-cyan-100",
    accentColor: "text-cyan-600",
  },
  {
    icon: Users,
    label: "Doctors",
    value: statsData.doctors,
    iconColor: "text-purple-500",
    bgGradient: "from-purple-50 to-purple-100",
    accentColor: "text-purple-600",
  },
  {
    icon: Users,
    label: "Users",
    value: statsData.users,
    iconColor: "text-pink-500",
    bgGradient: "from-pink-50 to-pink-100",
    accentColor: "text-pink-600",
  },
  {
    icon: Activity,
    label: "Blogs",
    value: statsData.blogs,
    iconColor: "text-green-500",
    bgGradient: "from-green-50 to-green-100",
    accentColor: "text-green-600",
  },
{
  icon: ClipboardList,
  label: "Treatments",
  value: statsData.treatments,
  iconColor: "text-orange-500",
  bgGradient: "from-orange-50 to-orange-100",
  accentColor: "text-orange-600",
}
];







  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both APIs
        const [serviceRes, bookingRes] = await Promise.all([
          axios.get("https://api.drrajneeshkant.in/api/v1/get-all-service"),
          axios.get("https://api.drrajneeshkant.in/api/v1/admin-bookings"),
        ]);

        const serviceData = serviceRes.data.data || [];
        const bookingData = bookingRes.data.data || [];

        // Count bookings per service name
        const bookingCounts = bookingData.reduce((acc, item) => {
          const serviceName = item.treatment_id?.service_name;
          if (serviceName) {
            acc[serviceName] = (acc[serviceName] || 0) + 1;
          }
          return acc;
        }, {});

        // 🎨 Define color variations (rotate through them)
        const colorPalette = [
          {
            iconBg: "bg-yellow-100",
            iconColor: "text-yellow-500",
            color: "from-yellow-400 to-yellow-600",
            bgColor: "bg-yellow-50",
          },
          {
            iconBg: "bg-red-100",
            iconColor: "text-red-500",
            color: "from-red-400 to-red-600",
            bgColor: "bg-red-50",
          },
          {
            iconBg: "bg-blue-100",
            iconColor: "text-blue-500",
            color: "from-blue-400 to-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            iconBg: "bg-green-100",
            iconColor: "text-green-500",
            color: "from-green-400 to-green-600",
            bgColor: "bg-green-50",
          },
          {
            iconBg: "bg-purple-100",
            iconColor: "text-purple-500",
            color: "from-purple-400 to-purple-600",
            bgColor: "bg-purple-50",
          },
        ];

        // Map data dynamically — only show first 5 services
        const formatted = serviceData.slice(0, 5).map((service, index) => {
          const name = service.service_name;
          const count = bookingCounts[name] || 0;
          const colorSet = colorPalette[index % colorPalette.length]; // rotate colors

          return {
            name,
            bookings: count,
            icon: TrendingUp,
            ...colorSet,
          };
        });

        setServices(formatted);
      } catch (error) {
        console.error("Error fetching services or bookings:", error);
      }
    };

    fetchData();
  }, []);

const [appointments, setAppointments] = useState([]);

useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get("https://api.drrajneeshkant.in/api/v1/admin-bookings", { headers });

      // Map API data to the structure used in your UI
      const latestAppointments = res.data.data.map((item) => ({
        id: item.id || item._id,
        bookingNumber: item.bookingNumber || "N/A", // <- add this
        service: item.treatment_id?.service_name || "N/A",
        amount: item.amountPerSession || item.totalAmount || 0,
        time: item.SessionDates?.[0]?.time || "N/A",
        status: item.session_status?.toLowerCase() || "pending",
        patientName: item.patient_details?.name || "N/A",
        patientPhone: item.patient_details?.phone || "N/A",
      }));


      setAppointments(latestAppointments.slice(0, 5));
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  fetchAppointments();
}, []);

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-800 to-sky-700 rounded-lg shadow-xl overflow-hidden relative">
          {/* Animated Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-lg blur-2xl transform translate-x-1/4 -translate-y-1/4 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/20 rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4"></div>

          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "25px 25px",
              }}
            ></div>
          </div>

          <div className="relative flex flex-col md:flex-row items-center justify-between p-6 md:p-8 gap-6">
            {/* Left: Greeting */}
            <div className="flex-1 space-y-3 z-10">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                <p className="text-white/90 text-sm md:text-base font-medium">
                  {getGreeting()}
                </p>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white leading-snug flex items-center gap-2">
                Dr. Rajneesh Kant
              </h1>
              <p className="text-white/80 text-sm md:text-base whitespace-nowrap overflow-hidden text-ellipsis">
                Stay on top of your day! Review today’s appointments, patient
                stats, and recent updates at a glance.
              </p>
            </div>

            {/* Right: Icon Grid */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-125"></div>
              <div className="relative grid grid-cols-3 gap-3 p-4">
                {/* Stethoscope */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl p-4 transform hover:scale-105 hover:-rotate-3 transition-all duration-300 shadow-lg">
                    <Stethoscope className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Heart */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-red-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-pink-400 to-red-500 rounded-xl p-4 transform hover:scale-105 hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Heart className="w-8 h-8 text-white animate-pulse" />
                  </div>
                </div>

                {/* Award */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 transform hover:scale-105 hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              {/* Floating Particles */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-white/40 rounded-full animate-ping"></div>
              <div
                className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-cyan-300/40 rounded-full animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-pink-300/40 rounded-full animate-ping"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
    <div className="w-full max-w-7xl mx-auto p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-gradient-to-br ${stat.bgGradient} rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-3 flex flex-col items-center text-center group relative overflow-hidden`}>
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-white/20 rounded-lg blur-xl"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/20 rounded-lg blur-xl"></div>

              <div className="relative bg-white rounded-full w-12 h-12 flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 shadow-sm">
                <Icon className={`w-5 h-5 ${stat.iconColor}`} strokeWidth={2.5} />
              </div>

              <div className="text-gray-700 font-semibold text-xs mb-1">{stat.label}</div>
              <div className={`text-xl font-bold ${stat.accentColor} group-hover:scale-105 transition-transform`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>

      {/* Popular Services & Recent Appointments */}
     {/* Revenue & Recent Orders */}
        <div className="w-full max-w-7xl mx-auto p-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            
            {/* Popular Services Card */}
            <div className="lg:col-span-3 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
              {/* Header */}
             <div className="bg-gradient-to-r from-blue-800 to-sky-700 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Popular Services</h2>
                </div>
                <p className="text-white/80 text-sm">Most booked services this month</p>
              </div>


              {/* Content */}
               <div className="p-6 space-y-3">
      {services.map((service, i) => {
        const Icon = service.icon;
        const progress = Math.min((service.bookings / 100) * 100, 100); // cap at 100%
        return (
          <div
            key={i}
            className={`${service.bgColor} rounded-xl p-4 hover:scale-105 transition-all duration-300 cursor-pointer group`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`${service.iconBg} rounded-lg p-2.5 group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-5 h-5 ${service.iconColor}`} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{service.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    This month
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold bg-gradient-to-r ${service.color} bg-clip-text text-transparent`}
                >
                  {service.bookings}
                </div>
                <div className="text-xs text-gray-500">bookings</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 bg-white/50 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${service.color} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
            </div>

                {/* Recent Appointments Card */}
              <div className="lg:col-span-4 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-800 to-sky-700 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Recent Appointments</h2>
                  </div>
                  <p className="text-white/80 text-sm">Latest 5 appointments received</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-3">
                  {appointments.map((appointment, i) => (
                    <div 
                      key={i} 
                      className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-4 hover:scale-[1.02] hover:shadow-md transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="relative">
                          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            appointment.status === 'confirmed' ? 'bg-green-500' :
                            appointment.status === 'pending' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`}></div>
                        </div>

                        {/* Details */}
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 flex items-center gap-2">
                            Appointment #{appointment.bookingNumber}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>

                          {/* Patient Details */}
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">{appointment.patientName}</span> | {appointment.patientPhone}
                          </div>

                          {/* Service */}
                          <div className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            {appointment.service}
                          </div>
                        </div>

                        {/* Amount & Time */}
                        <div className="text-right">
                          <div className="font-bold text-lg text-emerald-600 flex items-center gap-1 justify-end">
                            ₹
                            {appointment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* See All Link */}
                  <div className="flex justify-center mt-4">
                    <a
                      href="/dashboard/Sessions"
                      className="bg-gray-100 hover:bg-gray-200 text-blue-600 hover:text-blue-800 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      See All
                    </a>
                  </div>
                  
                </div>
              </div>



          </div>
        </div>
    </div>
  );
};

export default DashboardHome;
