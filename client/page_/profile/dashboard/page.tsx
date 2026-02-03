"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  Activity, 
  TrendingUp,
  Clock,
  UserCheck,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

const stats = [
  {
    title: "Total Patients",
    value: "2,847",
    change: "+12%",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    title: "Today's Appointments",
    value: "24",
    change: "+3",
    icon: Calendar,
    color: "text-green-600",
    bgColor: "bg-green-50"
  },
  {
    title: "Active Consultations",
    value: "8",
    change: "ongoing",
    icon: Stethoscope,
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  {
    title: "Staff on Duty",
    value: "12",
    change: "available",
    icon: UserCheck,
    color: "text-orange-600",
    bgColor: "bg-orange-50"
  }
];

const recentAppointments = [
  { time: "09:00 AM", patient: "John Smith", type: "Consultation", status: "confirmed" },
  { time: "10:30 AM", patient: "Emma Wilson", type: "Follow-up", status: "in-progress" },
  { time: "11:15 AM", patient: "Michael Brown", type: "Check-up", status: "waiting" },
  { time: "02:00 PM", patient: "Sarah Davis", type: "Consultation", status: "confirmed" },
  { time: "03:30 PM", patient: "Robert Johnson", type: "Emergency", status: "urgent" }
];

const alerts = [
  { message: "Lab results ready for Emma Wilson", type: "info", time: "5 min ago" },
  { message: "Prescription refill needed for John Smith", type: "warning", time: "15 min ago" },
  { message: "Equipment maintenance scheduled", type: "info", time: "1 hour ago" }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAppointments.map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-slate-800">{appointment.time}</div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{appointment.patient}</p>
                      <p className="text-xs text-slate-600">{appointment.type}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={appointment.status === 'urgent' ? 'destructive' : 
                            appointment.status === 'in-progress' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {appointment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800">Add Patient</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
              <Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">Schedule</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
              <Stethoscope className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800">Consultation</p>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors">
              <Activity className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">Reports</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}