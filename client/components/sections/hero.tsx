"use client"
import React, { useState, useEffect } from 'react'
import { Star, Users, Award, TrendingUp, Clock, Heart, Shield, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import TypeWritter from '../re-useable/TypeWritter'
import Image from 'next/image'
import { drImage } from '@/constant/Images'
import Link from 'next/link'

// Simple counter hook
const useCounter = (end, duration = 2000, delay = 0) => {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasStarted(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!hasStarted) return

    let startTime
    let animationFrame

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      setCount(Math.floor(progress * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, hasStarted])

  return count
}

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)

  // Counter values
  const patientsCount = useCounter(12000, 2000, 300)
  const experienceCount = useCounter(5, 1500, 600)
  const successCount = useCounter(95, 2000, 900)
  const branchesCount = useCounter(3, 1000, 1200)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="md:text-start text-center grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100">
              <Heart className="h-4 w-4" />
              <span>{`India's Most Trusted Chiropractic Care`}</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Healing Beyond
     <TypeWritter
  delay={50}
  loop={true}
  className="block text-blue-600"
  strings={[
    'Relief',
    'Recovery',
    'Wellness',
    'Mobility',
    'Therapy'
  ]}
/>


              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Revolutionary chiropractic treatments combined with cutting-edge physiotherapy techniques.
                Transform your life with our personalized healing approach.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-now-consultation" passHref>

                <div className="flex items-center  ">
                  <div className="relative group">
                    <button
                      className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                    >
                      <span
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      ></span>

                      <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
                        <div className="relative z-10 flex items-center space-x-2">
                          <span className="transition-all duration-500 group-hover:translate-x-1"> Book Appointment</span>
                          <svg
                            className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
                            data-slot="icon"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              clip-rule="evenodd"
                              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                              fill-rule="evenodd"
                            ></path>
                          </svg>
                        </div>
                      </span>
                    </button>
                  </div>
                </div>

              
              </Link>

              <Link href="/book-now-consultation" passHref>
                  <div className="flex items-center  ">
                  <div className="relative group">
                    <button
                      className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                    >
                      <span
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      ></span>

                      <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
                        <div className="relative z-10 flex items-center space-x-2">
                          <span className="transition-all duration-500 group-hover:translate-x-1">   Our Services</span>
                          <svg
                            className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
                            data-slot="icon"
                            aria-hidden="true"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              clip-rule="evenodd"
                              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                              fill-rule="evenodd"
                            ></path>
                          </svg>
                        </div>
                      </span>
                    </button>
                  </div>
                </div>

              
              </Link>
            </div>

            {/* Contact Info */}
            <div className="hidden md:flex flex-col sm:flex-row gap-6 pt-4 text-gray-600">
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="font-medium">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Faridabad, Haryana</span>
              </div>
            </div>
          </div>

          {/* Right Content - Doctor Card */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
          >
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              {/* Doctor Image */}
              <div className="w-48 h-48 mx-auto mb-6 rounded-full overflow-hidden shadow-lg">
                <Image
                  src={drImage}
                  className="w-full h-full object-cover"
                  alt="Dr. Rajneesh Kant"
                />
              </div>

              {/* Doctor Info */}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Rajneesh Kant</h3>
              <p className="text-blue-600 font-semibold mb-3">Master Chiropractor & Spine Specialist</p>

              {/* Rating */}
              <div className="flex justify-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Advanced Sports Injury & Spine Rehabilitation Expert
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">15+</div>
                  <div className="text-xs text-gray-600">Years Experience</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div
          className={`mt-16 lg:mt-24 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className=" text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {patientsCount.toLocaleString()}+
              </div>
              <div className="text-gray-600 text-sm font-medium">Happy Patients</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className=" text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {experienceCount}+
              </div>
              <div className="text-gray-600 text-sm font-medium">Years Excellence</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className=" text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {successCount}%
              </div>
              <div className="text-gray-600 text-sm font-medium">Success Rate</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <div className=" text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                {branchesCount}
              </div>
              <div className="text-gray-600 text-sm font-medium">Clinic Branches</div>
            </div>
          </div>
        </div>



      </div>
    </div>
  )
}

export default Hero