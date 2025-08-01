"use client"
import React, { useState, useCallback } from "react"
import { MapPin, Phone, Mail, Send, Youtube, Clock, User, CheckCircle, AlertCircle, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Types for better type safety
interface FormData {
  name: string
  email: string
  phone: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  message?: string
}

interface Location {
  title: string
  address: string
  phone: string[]
  hours: string
  mapUrl: string
  rating: number
  specialties: string[]
}

interface SubmitMessage {
  type: 'success' | 'error' | ''
  text: string
}

const ContactPage: React.FC = () => {
  const [activeLocation, setActiveLocation] = useState<'mumbai' | 'patna'>('mumbai')
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage>({ type: "", text: "" })

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/
    return phoneRegex.test(phone)
  }

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {}

    if (!formData.name.trim()) {
      errors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number"
    }

    if (!formData.message.trim()) {
      errors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [formErrors])

  const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitMessage({ type: "", text: "" })

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitMessage({
        type: "success",
        text: "Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.",
      })
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      })
      setFormErrors({})
    }, 2000)
  }, [formData, validateForm])

  const locations: Record<'mumbai' | 'patna', Location> = {
    mumbai: {
      title: "Mumbai Clinic",
      address: "Aston Building, 704, opposite Bank of Baroda, Above Mercedes Benz showroom, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053",
      phone: ["+91 9308511357", "+91 9137352377"],
      hours: "Mon-Sat: 10:00 AM - 8:00 PM",
      mapUrl: "https://maps.google.com/?q=Aston+Building+Lokhandwala+Complex+Andheri+West+Mumbai",
      rating: 4.8,
      specialties: ["Spine Care", "Sports Injury", "Pain Management"]
    },
    patna: {
      title: "Patna Clinic",
      address: "Central jail, Near Kuswaha chock, beside of, SK Vihar Colony, Kisan Colony, Beur, Patna, Bihar 800002",
    phone: ["+91 9308511357", "+91 9137352377"],
      hours: "Mon-Sat: 9:00 AM - 7:00 PM",
      mapUrl: "https://maps.google.com/?q=Central+jail+Near+Kuswaha+chock+SK+Vihar+Colony+Patna",
      rating: 4.9,
      specialties: ["Chiropractic Care", "Physiotherapy", "Rehabilitation"]
    },
  }

  const youtubeChannel = {
    name: "Dr. Rajneesh Kant",
    handle: "@drrajneeshkant",
    subscribers: "7.1M subscribers",
    videos: "1.7K videos",
    description: "Back To Nature Spine Clinic",
    url: "https://www.youtube.com/@drrajneeshkant",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Ready to start your healing journey? Contact us today and let's discuss how we can help you achieve optimal health.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Send Us a Message</h2>
                </div>

                {submitMessage.text && (
                  <div
                    className={`mb-6 p-4 rounded-xl flex items-center ${submitMessage.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                  >
                    {submitMessage.type === "success" ? (
                      <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    )}
                    <span>{submitMessage.text}</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700 font-semibold">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`border-2 focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${formErrors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                          }`}
                        placeholder="Enter your full name"
                      />
                      {formErrors.name && (
                        <p className="text-red-500 text-sm flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`border-2 focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${formErrors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                          }`}
                        placeholder="your.email@example.com"
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {formErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-semibold">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`border-2 focus:ring-4 focus:ring-blue-100 transition-all duration-200 ${formErrors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      placeholder="Your phone number (optional)"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700 font-semibold">
                      Message *
                    </Label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      className={`w-full p-4 border-2 rounded-lg focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 resize-none ${formErrors.message ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      placeholder="Tell us how we can help you. Please include any specific concerns or questions you have about your condition."
                    />
                    {formErrors.message && (
                      <p className="text-red-500 text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {formErrors.message}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin mr-3 w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="mr-3 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Map Section */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mt-8">
              <CardContent className="p-0">
                <div className="aspect-[16/9] w-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Interactive Map</p>
                    <p className="text-gray-500 text-sm">Location map will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Location Selector */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {Object.entries(locations).map(([key, location]) => (
                  <button
                    key={key}
                    onClick={() => setActiveLocation(key as 'mumbai' | 'patna')}
                    className={`flex-1 py-4 px-4 text-center font-semibold transition-all duration-200 ${activeLocation === key
                        ? "text-white bg-gradient-to-r from-blue-600 to-cyan-600"
                        : "text-gray-600 hover:bg-blue-50"
                      }`}
                  >
                    {location.title}
                  </button>
                ))}
              </div>

              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl text-gray-800">{locations[activeLocation].title}</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 text-sm font-semibold text-gray-600">{locations[activeLocation].rating}</span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {locations[activeLocation].specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-xs font-semibold rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{locations[activeLocation].address}</p>
                  </div>

                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-sm">
                      {locations[activeLocation].phone.map((number, index) => (
                        <p key={index} className="text-gray-700 font-medium">
                          {number}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-gray-700 text-sm font-medium">{locations[activeLocation].hours}</p>
                  </div>

                  <a
                    href={locations[activeLocation].mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl text-center transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                  >
                    <MapPin className="inline-block mr-2 h-4 w-4" />
                    View on Map
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* YouTube Channel */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-500 py-4 px-6">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Youtube className="mr-3 h-6 w-6" />
                  YouTube Channel
                </h2>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{youtubeChannel.name}</h3>
                    <p className="text-gray-500">{youtubeChannel.handle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800">{youtubeChannel.subscribers}</div>
                    <div className="text-xs text-gray-600">Subscribers</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800">{youtubeChannel.videos}</div>
                    <div className="text-xs text-gray-600">Videos</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm py-2 px-4 rounded-lg mb-4 text-center font-semibold">
                  {youtubeChannel.description}
                </div>

                <a
                  href={youtubeChannel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white py-3 px-4 rounded-xl text-center transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
                >
                  <Youtube className="inline-block mr-2 h-5 w-5" />
                  Visit Channel
                </a>
              </CardContent>
            </Card>

            {/* Quick Contact */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4 text-gray-800">Quick Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mr-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium">contact@drrajneeshkant.com</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium">+91 9308511357 , </span>  
                    <span className="text-gray-700 font-medium">+91 9137352377</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage