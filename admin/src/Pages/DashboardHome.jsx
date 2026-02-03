import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Activity,
  Users,
  TrendingUp,
  Calendar,
  ClipboardList,
  Clock,
  Stethoscope,
  Heart,
  Award,
} from "lucide-react";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
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
  const [appointments, setAppointments] = useState([]);

  // Stats fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

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

  // Popular services + booking count
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serviceRes, bookingRes] = await Promise.all([
          axios.get("https://api.drrajneeshkant.in/api/v1/get-all-service"),
          axios.get("https://api.drrajneeshkant.in/api/v1/admin-bookings"),
        ]);

        const serviceData = serviceRes.data.data || [];
        const bookingData = bookingRes.data.data || [];

        const bookingCounts = bookingData.reduce((acc, item) => {
          const serviceName = item.treatment_id?.service_name;
          if (serviceName) acc[serviceName] = (acc[serviceName] || 0) + 1;
          return acc;
        }, {});

        // Neutral palette that works in both modes
        const palette = [
          { bg: "bg-gray-100 dark:bg-gray-800/40", bar: "bg-gray-400 dark:bg-gray-400", text: "text-gray-700 dark:text-gray-300" },
          { bg: "bg-gray-50 dark:bg-gray-800/50", bar: "bg-gray-500 dark:bg-gray-300", text: "text-gray-800 dark:text-gray-200" },
          { bg: "bg-gray-100 dark:bg-gray-800/60", bar: "bg-gray-600 dark:bg-gray-200", text: "text-gray-900 dark:text-white" },
        ];

        const formatted = serviceData.slice(0, 5).map((service, index) => {
          const name = service.service_name;
          const count = bookingCounts[name] || 0;
          const style = palette[index % palette.length];

          return { name, bookings: count, ...style };
        });

        setServices(formatted);
      } catch (error) {
        console.error("Error fetching services/bookings:", error);
      }
    };

    fetchData();
  }, []);

  // Recent appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get("https://api.drrajneeshkant.in/api/v1/admin-bookings", { headers });

        const latest = res.data.data
          .map((item) => ({
            id: item.id || item._id,
            bookingNumber: item.bookingNumber || "N/A",
            service: item.treatment_id?.service_name || "N/A",
            amount: item.amountPerSession || item.totalAmount || 0,
            time: item.SessionDates?.[0]?.time || "N/A",
            status: item.session_status?.toLowerCase() || "pending",
            patientName: item.patient_details?.name || "N/A",
            patientPhone: item.patient_details?.phone || "N/A",
          }))
          .slice(0, 5);

        setAppointments(latest);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

  const stats = [
    { icon: Calendar, label: "Bookings", value: statsData.bookings },
    { icon: Stethoscope, label: "Clinics", value: statsData.clinics },
    { icon: Users, label: "Doctors", value: statsData.doctors },
    { icon: Users, label: "Users", value: statsData.users },
    { icon: Activity, label: "Blogs", value: statsData.blogs },
    { icon: ClipboardList, label: "Treatments", value: statsData.treatments },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-200 space-y-8 p-4 md:p-6 lg:p-8 transition-colors duration-300">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-black opacity-80" />

        <div className="relative p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Greeting */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                {getGreeting()}, Dr. Rajneesh
              </p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl">
              Monitor appointments, track popular treatments, and stay updated with clinic performance.
            </p>
          </div>

          {/* Decorative Icons */}
          <div className="flex gap-5 opacity-90">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <Stethoscope className="w-8 h-8 text-gray-700 dark:text-gray-300" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <Heart className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <Award className="w-8 h-8 text-gray-700 dark:text-gray-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="
                bg-white dark:bg-gray-900 
                border border-gray-200 dark:border-gray-800 
                rounded-xl p-5 
                hover:border-gray-300 dark:hover:border-gray-600 
                transition-all group shadow-sm dark:shadow-none
              "
            >
              <div className="flex items-center justify-between mb-3">
                <Icon
                  className="w-7 h-7 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors"
                  strokeWidth={2}
                />
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Popular Services + Recent Appointments */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Popular Services */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="bg-gray-50 dark:bg-gray-950 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Popular Services
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">
              Most booked treatments
            </p>
          </div>

          <div className="p-5 space-y-4">
            {services.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-600">
                No service data available
              </div>
            ) : (
              services.map((service, i) => (
                <div
                  key={i}
                  className={`
                    ${service.bg} 
                    rounded-lg p-4 
                    hover:bg-gray-200/70 dark:hover:bg-gray-800/70 
                    transition-colors group
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-medium ${service.text}`}>{service.name}</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {service.bookings}
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${service.bar} transition-all duration-1000`}
                      style={{ width: `${Math.min(service.bookings * 5, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    bookings
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none">
          <div className="bg-gray-50 dark:bg-gray-950 px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Appointments
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">
              Latest 5 bookings
            </p>
          </div>

          <div className="p-5 space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-600">
                No recent appointments
              </div>
            ) : (
              appointments.map((appt, i) => (
                <div
                  key={i}
                  className="
                    bg-gray-50 dark:bg-gray-800/40 
                    rounded-lg p-4 
                    hover:bg-gray-100 dark:hover:bg-gray-800/60 
                    transition-colors group flex items-center gap-4
                  "
                >
                  <div className="relative">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div
                      className={`
                        absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 
                        border-white dark:border-gray-900
                        ${appt.status === "confirmed" ? "bg-green-500" :
                          appt.status === "pending" ? "bg-yellow-500" :
                          "bg-gray-500"}
                      `}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        #{appt.bookingNumber}
                      </span>
                      <span
                        className={`
                          text-xs px-2.5 py-0.5 rounded-full
                          ${appt.status === "confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300"
                            : appt.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300"
                            : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400"}
                        `}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-400 mt-0.5 truncate">
                      {appt.patientName} • {appt.patientPhone}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <Stethoscope className="w-3.5 h-3.5" />
                      {appt.service}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      ₹{appt.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-500 flex items-center gap-1.5 justify-end mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      {appt.time}
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="text-center mt-6">
              <a
                href="/dashboard/Sessions"
                className="
                  inline-flex items-center gap-2 
                  text-gray-600 hover:text-gray-900 
                  dark:text-gray-400 dark:hover:text-gray-200 
                  transition-colors
                "
              >
                View All Appointments →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;