"use client"
import React, { useState, useEffect } from 'react'
import { Star, Heart, Phone, MapPin, ChevronLeft, ChevronRight, Activity, Target, Sparkles } from "lucide-react"
import Image from 'next/image'
import drImage from '@/assets/DoctorImage/dr.png'
import Link from 'next/link'

// Typewriter component
const TypeWriter = ({ strings, delay = 50, className = "" }: { strings: string[], delay?: number, className?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentText, setCurrentText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentString = strings[currentIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentString.length) {
          setCurrentText(currentString.slice(0, currentText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1))
        } else {
          setIsDeleting(false)
          setCurrentIndex((currentIndex + 1) % strings.length)
        }
      }
    }, isDeleting ? 30 : delay)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, currentIndex, strings, delay])

  return <span className={className}>{currentText}<span className="animate-pulse">|</span></span>
}

type Sparkle = {
  left: string;
  top: string;
  delay: string;
  duration: string;
};

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  const slides = [
    {
      badge: "India's Most Trusted Chiropractic Care",
      title: "Healing Beyond",
      typewriterWords: ['Relief', 'Recovery', 'Wellness', 'Mobility', 'Therapy'],
      description: "Revolutionary chiropractic treatments combined with cutting-edge physiotherapy techniques. Transform your life with our personalized healing approach.",
      gradient: "from-blue-600 via-cyan-500 to-teal-400",
      bgImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=80",
      overlay: "from-blue-900/95 via-cyan-900/90 to-teal-900/85",
      icon: Heart
    },
    {
      badge: "Advanced Spine & Sports Medicine",
      title: "Excellence in",
      typewriterWords: ['Spine Care', 'Pain Relief', 'Rehabilitation', 'Sports Injury', 'Wellness'],
      description: "State-of-the-art facilities and world-class expertise in treating complex spinal conditions and sports injuries with proven results.",
      gradient: "from-purple-600 via-pink-500 to-rose-500",
      bgImage: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=2000&q=80",
      overlay: "from-purple-900/95 via-pink-900/90 to-rose-900/85",
      icon: Activity
    },
    {
      badge: "Personalized Treatment Plans",
      title: "Your Path to",
      typewriterWords: ['Better Health', 'Pain-Free Life', 'Full Recovery', 'Peak Performance', 'Total Wellness'],
      description: "Customized treatment protocols designed specifically for your unique condition, ensuring optimal recovery and long-term health.",
      gradient: "from-emerald-600 via-teal-500 to-cyan-500",
      bgImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=2000&q=80",
      overlay: "from-emerald-900/95 via-teal-900/90 to-cyan-900/85",
      icon: Target
    }
  ]

  useEffect(() => {
    const items = Array.from({ length: 20 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
    }));
    setSparkles(items);
  }, []);

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const currentSlideData = slides[currentSlide]
  const IconComponent = currentSlideData.icon
  if (!sparkles.length) return null;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image Slider */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.bgImage})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.overlay}`} />
        </div>
      ))}

      {/* Animated particles/sparkles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {sparkles.map((s, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: s.left,
              top: s.top,
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          >
            <Sparkles className="w-4 h-4 text-white/20" />
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content - Slider */}
          <div className="space-y-8">
            <div
              key={currentSlide}
              className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
            >
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full text-sm font-semibold border-2 border-white/20 shadow-2xl">
                <IconComponent className="h-5 w-5 text-white" />
                <span className="text-white">
                  {currentSlideData.badge}
                </span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4 mt-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-2xl">
                  {currentSlideData.title}
                  <TypeWriter
                    delay={50}
                    className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 mt-2 drop-shadow-lg"
                    strings={currentSlideData.typewriterWords}
                  />
                </h1>
                <p className="text-lg text-white/90 leading-relaxed max-w-lg drop-shadow-lg backdrop-blur-sm">
                  {currentSlideData.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link href={`/book-now-consultation`}>
                   <button className="group relative inline-flex items-center justify-center px-8 py-2 font-bold text-gray-900 bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-yellow-400/50 hover:scale-105">
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>Book Appointment</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                </Link>
             
        <a href="#service">
     <button  className="group relative inline-flex items-center justify-center px-8 py-2 font-bold text-white bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:bg-white/20 hover:scale-105">
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>Our Services</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
        </a>
           
              </div>

              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-blue-600 shadow-lg">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-white/70 font-medium">Call Us</div>
                    <div className="font-bold text-white">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-5 py-2 rounded-xl bg-white/10 backdrop-blur-xl shadow-2xl hover:bg-white/20 transition-all duration-300 border border-white/20">
                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full text-cyan-600 shadow-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-white/70 font-medium">Visit Us</div>
                    <div className="font-bold text-white">Mumbai & Patna</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={prevSlide}
                className="p-3 rounded-full bg-white/20 backdrop-blur-xl shadow-2xl hover:bg-white/30 transition-all duration-300 hover:scale-110 border border-white/30"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>

              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 bg-white shadow-lg shadow-white/50' : 'w-2 bg-white/40 hover:bg-white/60'
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-3 rounded-full bg-white/20 backdrop-blur-xl shadow-2xl hover:bg-white/30 transition-all duration-300 hover:scale-110 border border-white/30"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Right Content - Doctor Card */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-3xl blur-3xl opacity-30 animate-pulse"></div>

              <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-1 shadow-2xl border border-white/20">
                <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl p-8 text-center shadow-inner">
                  {/* Doctor Image Placeholder */}
                  <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-white/20"></div>

                    <Image
                      src={drImage}
                      alt="Dr. Rajneesh Kant"
                      width={160}
                      height={160}
                      priority
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Doctor Info */}
                  <h3 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    Dr. Rajneesh Kant
                  </h3>
                  <p className="text-gray-700 font-semibold mb-4">
                   Physiotherapist | Osteopath | Chiropractor
                  </p>

                  {/* Rating */}
                  <div className="flex justify-center space-x-1 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-7 w-7 text-yellow-400 fill-yellow-400 drop-shadow-lg transform transition-transform duration-300 hover:scale-125 hover:rotate-12"
                      />
                    ))}
                  </div>

                  {/* Short Bio */}
                  <p className="text-gray-600 text-sm mb-8 leading-relaxed px-4">
                    Senior Consultant – Spine, Joint & Neuromuscular Rehabilitation
                  </p>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-3 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold text-white drop-shadow-lg">9+</div>
                      <div className="text-sm text-white/90 mt-2 font-medium">Years Experience</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-3 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="text-3xl font-bold text-white drop-shadow-lg">98%</div>
                      <div className="text-sm text-white/90 mt-2 font-medium">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

export default Hero