"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Filter,
  User,
  Clock,
  FileText,
  Heart,
  Activity,
  Calendar
} from 'lucide-react';

const consultations = [
  {
    id: 1,
    patient: "John Smith",
    age: 45,
    time: "09:30 AM",
    duration: "45 min",
    type: "Follow-up",
    status: "in-progress",
    complaint: "Chest pain and shortness of breath",
    vitals: { bp: "140/90", hr: "85", temp: "98.6°F" },
    notes: "Patient reports improvement since last visit"
  },
  {
    id: 2,
    patient: "Emma Wilson",
    age: 32,
    time: "11:00 AM",
    duration: "30 min",
    type: "Initial",
    status: "scheduled",
    complaint: "Routine cardiac screening",
    vitals: { bp: "120/80", hr: "72", temp: "98.4°F" },
    notes: "Family history of heart disease"
  },
  {
    id: 3,
    patient: "Michael Brown",
    age: 28,
    time: "02:15 PM",
    duration: "60 min",
    type: "Procedure",
    status: "completed",
    complaint: "Cardiac catheterization",
    vitals: { bp: "118/75", hr: "68", temp: "98.2°F" },
    notes: "Procedure completed successfully"
  }
];

export default function Consultations() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <div className="flex-1 lg:ml-64">
          <main className="p-4 lg:p-8">
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Consultations</h1>
                  <p className="text-slate-600 mt-1">Manage patient consultations and medical examinations</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Consultation
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Today's Consultations</p>
                        <p className="text-2xl font-bold text-slate-800">12</p>
                      </div>
                      <Stethoscope className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">In Progress</p>
                        <p className="text-2xl font-bold text-slate-800">3</p>
                      </div>
                      <Activity className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Completed</p>
                        <p className="text-2xl font-bold text-slate-800">8</p>
                      </div>
                      <FileText className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600">Scheduled</p>
                        <p className="text-2xl font-bold text-slate-800">4</p>
                      </div>
                      <Calendar className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2 flex-1 min-w-64">
                      <Search className="w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search consultations..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Consultations List */}
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <Card key={consultation.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800">{consultation.patient}</h3>
                                <p className="text-sm text-slate-600">Age {consultation.age}</p>
                              </div>
                            </div>
                            <Badge 
                              variant={consultation.status === 'in-progress' ? 'default' : 
                                      consultation.status === 'completed' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {consultation.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-slate-600 mb-1">Chief Complaint</p>
                              <p className="text-slate-800">{consultation.complaint}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-600 mb-1">Notes</p>
                              <p className="text-slate-800">{consultation.notes}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-6 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{consultation.time} • {consultation.duration}</span>
                            </div>
                            <span>•</span>
                            <span>{consultation.type}</span>
                          </div>
                        </div>

                        <div className="lg:w-64">
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center">
                              <Heart className="w-4 h-4 mr-2 text-red-500" />
                              Vital Signs
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Blood Pressure:</span>
                                <span className="font-medium text-slate-800">{consultation.vitals.bp}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Heart Rate:</span>
                                <span className="font-medium text-slate-800">{consultation.vitals.hr} bpm</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Temperature:</span>
                                <span className="font-medium text-slate-800">{consultation.vitals.temp}</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Button 
                              size="sm" 
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              {consultation.status === 'in-progress' ? 'Continue' : 'View Details'}
                            </Button>
                            <Button variant="outline" size="sm" className="w-full">
                              <FileText className="w-4 h-4 mr-1" />
                              Medical Records
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}