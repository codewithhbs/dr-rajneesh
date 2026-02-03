"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Users,
  Award,
  MapPin,
  Phone,
  Calendar,
  Stethoscope,
  Activity,
  Shield,
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Building,
  Zap,
} from "lucide-react"

const AboutUs = () => {
  const services = [
    {
      icon: <Stethoscope className="w-6 h-6" />,
      title: "Orthopedic Care",
      description: "Comprehensive orthopedic treatments for bone and joint disorders",
      gradient: "from-blue-400 to-cyan-400",
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Chiropractic Treatment",
      description: "Expert spinal adjustments and alignment therapy",
      gradient: "from-purple-400 to-pink-400",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Osteopathic Medicine",
      description: "Holistic approach to musculoskeletal health",
      gradient: "from-green-400 to-emerald-400",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Physiotherapy",
      description: "Customized rehabilitation and recovery programs",
      gradient: "from-orange-400 to-red-400",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Postoperative Care",
      description: "Specialized recovery support after surgical procedures",
      gradient: "from-indigo-400 to-purple-400",
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Chronic Pain Management",
      description: "Advanced techniques for long-term pain relief",
      gradient: "from-pink-400 to-rose-400",
    },
  ]

  const achievements = [
    { number: "2,000+", label: "Patients Treated", icon: <Users className="w-5 h-5" /> },
    { number: "9+", label: "Years Experience", icon: <Award className="w-5 h-5" /> },
    { number: "98%", label: "Success Rate", icon: <TrendingUp className="w-5 h-5" /> },
    { number: "24/7", label: "Support Available", icon: <Clock className="w-5 h-5" /> },
  ]

  const qualities = [
    {
      title: "Empathetic Approach",
      description: "Calm, respectful manner that makes patients feel at ease during recovery",
      icon: <Heart className="w-5 h-5 text-red-500" />,
    },
    {
      title: "Latest Technology",
      description: "Cutting-edge equipment combined with proven manual therapy techniques",
      icon: <Zap className="w-5 h-5 text-blue-500" />,
    },
    {
      title: "Customized Treatment",
      description: "Personalized care plans designed to meet each patient's unique needs",
      icon: <Target className="w-5 h-5 text-green-500" />,
    },
    {
      title: "Comprehensive Care",
      description: "One-stop destination for spine and musculoskeletal health needs",
      icon: <Shield className="w-5 h-5 text-purple-500" />,
    },
  ]

  return (
    <section className="py-8 sm:py-12 lg:py-16 px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-2xl">
            <Building className="w-4 h-4" />
            About Our Clinic
            <Sparkles className="w-4 h-4" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-800 mb-6 leading-tight">
            Who{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              We Are
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Welcome to Back To Dr. Rajneesh Kant Clinic - Your trusted partner in comprehensive spine and
            musculoskeletal health care
          </p>
        </div>

        {/* Main About Section */}
        <div className="mb-16">
          <Card className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-8 sm:p-12">
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Content */}
                <div>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 mb-6">
                    🏥 Leading Healthcare Provider
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-6">Back To Nature Spine Clinic</h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Dr. Rajneesh Kant is a top player in the category of Orthopedic Doctors. This well-known
                    establishment acts as a one-stop destination servicing customers both locally and from other
                    regions.
                  </p>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    Our team is made up of passionate individuals who are committed to their roles and work
                    collaboratively towards achieving the company's vision and goals. We are excited to expand our
                    offerings and reach an even broader audience.
                  </p>
                  <div className="flex gap-4 flex-wrap">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:shadow-xl transform hover:scale-105 transition-duration-300 px-6 py-3">
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Appointment
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 shadow-md bg-transparent"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Contact Us
                    </Button>
                  </div>
                </div>

                {/* Visual */}
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Stethoscope className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Excellence in Care</h3>
                      <p className="text-gray-600">Trusted by thousands of patients</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Doctor Profile */}
        <div className="mb-16">
          <Card className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center mb-8">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mb-4 shadow-lg">
                  👨‍⚕️ Meet Our Expert
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4">Dr. Rajneesh Kant</h2>
                <p className="text-xl text-gray-600">Leading Orthopedic Doctor, Osteopath & Chiropractor</p>
              </div>
              <div className="grid md:grid-cols-2 text-center md:text-start gap-8 lg:gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Professional Excellence</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Dr. Rajneesh Kant is a leading figure in the field of Osteopathy and is recognized as one of the top
                    Chiropractors in India. He is the trusted choice of hundreds of people who have chosen him for the
                    best physiotherapy treatment.
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    He offers comprehensive care through customized treatments to ensure ultimate care through a unique
                    set of exercises and therapies that best fit their needs. He uses the latest technology along with
                    manual therapy and exercises to offer patients the best possible care.
                  </p>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>Multiple Locations Available</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Award className="w-4 h-4 text-purple-500" />
                    <span>Specialized in Postoperative Care & Chronic Pain</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">What Sets Him Apart</h3>
                  <div className="space-y-4">
                    {qualities.map((quality, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="flex-shrink-0">{quality.icon}</div>
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">{quality.title}</h4>
                          <p className="text-gray-600 text-sm">{quality.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">Our Specialized Services</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive healthcare solutions tailored to your specific needs
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card
                key={index}
                className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 transition-duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${service.gradient} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform duration-300`}
                  >
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-3xl overflow-hidden shadow-sm">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Achievements</h2>
                <p className="text-xl opacity-90">Numbers that speak for our commitment to excellence</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {achievements.map((achievement, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {achievement.icon}
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mb-2">{achievement.number}</div>
                    <div className="text-lg opacity-90">{achievement.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center px-4 sm:px-6">
          <Card className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 sm:p-10 shadow">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
                Ready to Start Your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                  Healing Journey?
                </span>
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed">
                Experience the difference that personalized, compassionate care can make. Join thousands of satisfied
                patients who have trusted us with their health and recovery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:shadow-xl transform hover:scale-105 transition-duration-300 px-6 py-3 text-sm sm:text-base">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Consultation
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 text-sm sm:text-base shadow-md bg-transparent"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-sm sm:text-base text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>Convenient Locations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span>Insurance Accepted</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default AboutUs
