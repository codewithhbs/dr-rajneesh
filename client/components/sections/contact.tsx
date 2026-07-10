"use client"

import React, { useState, useCallback } from "react"
import { MapPin, Phone, Mail, Send, Youtube, Clock, User, CheckCircle, AlertCircle, Star, Heart, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import { API_ENDPOINT } from "@/constant/url"

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

interface SubmitMessage {
  type: 'success' | 'error' | ''
  text: string
}

type LocationKey = 'mumbai' | 'patna'

interface LocationData {
  title: string
  address: string
  phone: string[]
  hours: string
  mapQuery: string
  mapUrl: string
  rating: number
  specialties: string[]
}

const locations: Record<LocationKey, LocationData> = {
  mumbai: {
    title: "Mumbai Clinic",
    address: "Aston Building, 704, opposite Bank of Baroda, Above Mercedes Benz showroom, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053",
    phone: ["+91 9137352377"],
    hours: "Mon-Sat: 10:00 AM - 8:00 PM",
    mapQuery: "Aston Building 704 Lokhandwala Complex Andheri West Mumbai Maharashtra 400053",
    mapUrl: "https://maps.google.com/?q=Aston+Building+Lokhandwala+Complex+Andheri+West+Mumbai",
    rating: 4.8,
    specialties: ["Spine Care", "Sports Injury", "Pain Management"],
  },
  patna: {
    title: "Patna Clinic",
    address: "Shivpuri Main Bypass Rd, Near Beur Jail, 150 meter East from Beur More Anisabad, Patna, Bihar 800002",
    phone: ["+91 9137352377"],
    hours: "Mon-Sat: 9:00 AM - 7:00 PM",
    mapQuery: "Shivpuri Main Bypass Road Near Beur Jail Anisabad Patna Bihar 800002",
    mapUrl: "https://maps.google.com/?q=Shivpuri+Main+Bypass+Road+Beur+Jail+Anisabad+Patna",
    rating: 4.9,
    specialties: ["Chiropractic Care", "Physiotherapy", "Rehabilitation"],
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

const ContactPage: React.FC = () => {
  const [mapLocation, setMapLocation] = useState<LocationKey>('mumbai')
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", phone: "", message: "" })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitMessage, setSubmitMessage] = useState<SubmitMessage>({ type: "", text: "" })

  const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone: string): boolean => !phone || /^[+]?[\d\s\-()]{10,15}$/.test(phone)

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {}
    if (!formData.name.trim()) errors.name = "Name is required"
    else if (formData.name.trim().length < 2) errors.name = "Name must be at least 2 characters"
    if (!formData.email.trim()) errors.email = "Email is required"
    else if (!validateEmail(formData.email)) errors.email = "Please enter a valid email"
    if (formData.phone && !validatePhone(formData.phone)) errors.phone = "Invalid phone number"
    if (!formData.message.trim()) errors.message = "Message is required"
    else if (formData.message.trim().length < 10) errors.message = "Message must be at least 10 characters"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }, [formErrors])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    setSubmitMessage({ type: "", text: "" })
    try {
      const response = await axios.post(`${API_ENDPOINT}/contact`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
      })
      if (response.data.success) {
        setSubmitMessage({
          type: "success",
          text: "Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.",
        })
        setFormData({ name: "", email: "", phone: "", message: "" })
      } else {
        throw new Error(response.data.message || "Something went wrong")
      }
    } catch (error: any) {
      console.error("Contact form error:", error)
      setSubmitMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to send message. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm])

  const activeMap = locations[mapLocation]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Ready to start your healing journey? Contact us today.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form + Map */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Send Us a Message</h2>
                </div>

                {submitMessage.text && (
                  <div className={`mb-6 p-4 rounded-xl flex items-center ${submitMessage.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"}`}>
                    {submitMessage.type === "success" ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
                    <span>{submitMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={formErrors.name ? 'border-red-300' : ''}
                        placeholder="Enter your full name"
                        disabled={isSubmitting}
                      />
                      {formErrors.name && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{formErrors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={formErrors.email ? 'border-red-300' : ''}
                        placeholder="your.email@example.com"
                        disabled={isSubmitting}
                      />
                      {formErrors.email && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{formErrors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? 'border-red-300' : ''}
                      placeholder="Optional"
                      disabled={isSubmitting}
                    />
                    {formErrors.phone && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{formErrors.phone}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      className={`w-full p-4 border-2 rounded-lg focus:outline-none ${formErrors.message ? 'border-red-300' : 'border-gray-200'} ${isSubmitting ? 'opacity-60' : ''}`}
                      placeholder="Tell us how we can help you..."
                      disabled={isSubmitting}
                    />
                    {formErrors.message && <p className="text-red-500 text-sm flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{formErrors.message}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 rounded-xl font-semibold text-lg"
                  >
                    {isSubmitting ? (<>Sending...</>) : (<><Send className="mr-3 h-5 w-5" /> Send Message</>)}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Real Map Section */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-bold text-gray-800">{activeMap.title} — Location</h3>
                </div>
                <div className="flex gap-2">
                  {(Object.keys(locations) as LocationKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setMapLocation(key)}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${mapLocation === key
                        ? "text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow"
                        : "text-gray-600 bg-gray-100 hover:bg-blue-50"}`}
                    >
                      {locations[key].title.replace(" Clinic", "")}
                    </button>
                  ))}
                </div>
              </div>
              <CardContent className="p-0">
                <div className="aspect-[16/9] w-full">
                  <iframe
                    key={mapLocation}
                    title={`${activeMap.title} map`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(activeMap.mapQuery)}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <p className="text-gray-600 text-sm flex-1 min-w-[200px]">{activeMap.address}</p>
                  <a
                    href={activeMap.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2 px-4 rounded-xl text-sm font-semibold shadow-lg transition-all"
                  >
                    <Navigation className="mr-2 h-4 w-4" /> Get Directions
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — both locations always visible */}
          <div className="space-y-8">
            {(Object.keys(locations) as LocationKey[]).map((key) => {
              const loc = locations[key]
              const isActive = mapLocation === key
              return (
                <Card
                  key={key}
                  onClick={() => setMapLocation(key)}
                  className={`shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all ${isActive ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-blue-200"}`}
                >
                  <div className={`py-3 px-6 flex items-center justify-between ${isActive ? "bg-gradient-to-r from-blue-600 to-cyan-600" : "bg-gradient-to-r from-blue-500 to-cyan-500"}`}>
                    <h3 className="font-bold text-lg text-white">{loc.title}</h3>
                    <div className="flex items-center text-white">
                      <Star className="w-4 h-4 text-yellow-300 fill-current" />
                      <span className="ml-1 text-sm font-semibold">{loc.rating}</span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="mb-5 flex flex-wrap gap-2">
                      {loc.specialties.map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 text-xs font-semibold rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                          <MapPin className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{loc.address}</p>
                      </div>

                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-sm">
                          {loc.phone.map((number, i) => (
                            <a key={i} href={`tel:${number.replace(/\s/g, "")}`} onClick={(e) => e.stopPropagation()} className="block text-gray-700 font-medium hover:text-blue-600">
                              {number}
                            </a>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                          <Clock className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-gray-700 text-sm font-medium">{loc.hours}</p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setMapLocation(key) }}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl text-center font-semibold shadow-lg transition-all flex items-center justify-center"
                      >
                        <MapPin className="mr-2 h-4 w-4" />
                        {isActive ? "Showing on Map" : "Show on Map"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

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
                  className="block bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white py-3 px-4 rounded-xl text-center transition-all duration-200 shadow-lg font-semibold"
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
                  <a href="mailto:contact@drrajneeshkant.com" className="flex items-center group">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mr-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-blue-600">contact@drrajneeshkant.com</span>
                  </a>
                  <a href="tel:+919137352377" className="flex items-center group">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mr-3">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-700 font-medium group-hover:text-blue-600">+91 9137352377</span>
                  </a>
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