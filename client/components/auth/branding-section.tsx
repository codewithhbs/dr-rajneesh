"use client"

import { CheckCircle } from "lucide-react"

export function BrandingSection() {
  return (
    <div className="hidden lg:block">
      <div className="text-center lg:text-left">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Your Health,
            <br />
            <span className="text-blue-600">Our Priority</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Access personalized healthcare services, expert consultations, and comprehensive wellness solutions.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Expert Care</h3>
              <p className="text-gray-600">Professional healthcare services</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Secure Platform</h3>
              <p className="text-gray-600">Your data is safe and protected</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
