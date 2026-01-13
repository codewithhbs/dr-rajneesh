'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


export default function PatientDetailsStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Patient Details</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <Label className="block text-sm text-gray-600">Full Name</Label>
          <Input
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter full name"
          />
        </div>

        {/* Mobile Number */}
        <div>
          <Label className="block text-sm text-gray-600">Mobile Number</Label>
          <Input
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="10 digit mobile number"
          />
        </div>

        {/* Gender */}
        <div>
          <Label className="block text-sm text-gray-600">Gender</Label>
          <select
            name="gender"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            defaultValue="male"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <Label className="block text-sm text-gray-600">Age</Label>
          <Input
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter Your Age"
          />
        </div>

        {/* Email (Optional) */}
        <div>
          <Label className="block text-sm text-gray-600">Email (optional)</Label>
          <Input
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email address"
          />
        </div>

        {/* Aadhaar Number */}
        <div>
          <Label className="block text-sm text-gray-600">Aadhaar Number</Label>
          <Input
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="XXXX-XXXX-1234"
          />
        </div>
      </div>
    </div>
  // l;fkasdjlkfjasl
  )
}
