"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, MapPin, Building2, Clock } from 'lucide-react';

const addressData = [
  { 
    label: 'Country', 
    value: 'United States',
    icon: <MapPin className="w-4 h-4 text-blue-500" />
  },
  { 
    label: 'State', 
    value: 'New York',
    icon: <MapPin className="w-4 h-4 text-blue-500" />
  },
  { 
    label: 'City', 
    value: 'New York City',
    icon: <Building2 className="w-4 h-4 text-blue-500" />
  },
  { 
    label: 'Street Address', 
    value: '1234 Medical Center Drive',
    icon: <MapPin className="w-4 h-4 text-blue-500" />
  },
  { 
    label: 'Postal Code', 
    value: '10001',
    icon: <MapPin className="w-4 h-4 text-blue-500" />
  },
  { 
    label: 'Office Suite', 
    value: 'Suite 450',
    icon: <Building2 className="w-4 h-4 text-blue-500" />
  },
];

const practiceHours = [
  { day: 'Monday', hours: '8:00 AM - 6:00 PM' },
  { day: 'Tuesday', hours: '8:00 AM - 6:00 PM' },
  { day: 'Wednesday', hours: '8:00 AM - 6:00 PM' },
  { day: 'Thursday', hours: '8:00 AM - 6:00 PM' },
  { day: 'Friday', hours: '8:00 AM - 5:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 2:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
];

export default function AddressInformation() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800">
              Practice Address
            </CardTitle>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {addressData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center space-x-2">
                  {item.icon}
                  <label className="text-sm font-medium text-slate-600">
                    {item.label}
                  </label>
                </div>
                <p className="text-slate-800 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg font-semibold text-slate-800">
                Practice Hours
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {practiceHours.map((schedule, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-sm font-medium text-slate-800">{schedule.day}</span>
                <span className={`text-sm font-medium ${schedule.hours === 'Closed' ? 'text-red-600' : 'text-slate-600'}`}>
                  {schedule.hours}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}