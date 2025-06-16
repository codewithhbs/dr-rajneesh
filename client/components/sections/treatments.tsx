import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Activity,
    Zap,
    Home,
    Stethoscope,
    Brain,
    Bone,
    Heart,
    Shield,
    Target,
    Calendar,
    Eye,
    Star,
    CheckCircle,
    ArrowRight,
    Sparkles
} from 'lucide-react';

const ChiropracticClinic = () => {
    const treatmentConditions = [
        { name: "Back Pain", icon: <Bone className="w-5 h-5" />, color: "bg-red-100 text-red-700" },
        { name: "Neck Pain", icon: <Brain className="w-5 h-5" />, color: "bg-orange-100 text-orange-700" },
        { name: "Shoulder Pain", icon: <Activity className="w-5 h-5" />, color: "bg-yellow-100 text-yellow-700" },
        { name: "Headache", icon: <Brain className="w-5 h-5" />, color: "bg-purple-100 text-purple-700" },
        { name: "Scoliosis", icon: <Bone className="w-5 h-5" />, color: "bg-blue-100 text-blue-700" },
        { name: "Disc Injury", icon: <Target className="w-5 h-5" />, color: "bg-green-100 text-green-700" },
        { name: "Pinched Nerve", icon: <Zap className="w-5 h-5" />, color: "bg-pink-100 text-pink-700" },
        { name: "Joint Pain", icon: <Activity className="w-5 h-5" />, color: "bg-indigo-100 text-indigo-700" },
        { name: "Knee Pain", icon: <Bone className="w-5 h-5" />, color: "bg-teal-100 text-teal-700" },
        { name: "Sciatica Pain", icon: <Zap className="w-5 h-5" />, color: "bg-cyan-100 text-cyan-700" },
        { name: "Spine Alignment", icon: <Target className="w-5 h-5" />, color: "bg-emerald-100 text-emerald-700" },
        { name: "Ankylosing Spondylitis", icon: <Bone className="w-5 h-5" />, color: "bg-rose-100 text-rose-700" },
        { name: "Massage", icon: <Activity className="w-5 h-5" />, color: "bg-amber-100 text-amber-700" },
        { name: "Bone Fracture", icon: <Bone className="w-5 h-5" />, color: "bg-amber-100 text-amber-700" },
        { name: "Other", icon: <Activity className="w-5 h-5" />, color: "bg-amber-100 text-amber-700" }
    ];

    const services = [
        {
            title: "Comprehensive Chiropractic Care",
            description: "Manual spinal adjustments and computerized chiropractic treatments for optimal spine alignment and pain relief.",
            icon: <Bone className="w-8 h-8 text-blue-600" />,
            features: ["Manual Spinal Adjustments", "Computerized Chiropractic Adjustments", "Spine Alignment Therapy", "Digital Postural Analysis"],
            gradient: "from-blue-500 to-purple-600",
            badge: "Most Popular"
        },
        {
            title: "Advanced Physiotherapy",
            description: "Exercise-based rehabilitation combined with cutting-edge therapeutic techniques for complete recovery.",
            icon: <Activity className="w-8 h-8 text-green-600" />,
            features: ["Exercise-Based Rehabilitation", "Sports Injury Recovery", "Therapeutic Exercises", "Movement Restoration"],
            gradient: "from-green-500 to-teal-600",
            badge: "Proven Results"
        },
        {
            title: "Electrotherapy & Laser Treatment",
            description: "State-of-the-art therapeutic technologies including ultrasound, laser therapy, and spinal decompression.",
            icon: <Zap className="w-8 h-8 text-yellow-600" />,
            features: ["Spinal Decompression", "Ultrasound Therapy", "Laser Therapy", "Electrotherapy"],
            gradient: "from-yellow-500 to-orange-600",
            badge: "Advanced Tech"
        },
        {
            title: "Home Care Services",
            description: "Convenient home physiotherapy and chiropractic services delivered to your doorstep with professional care.",
            icon: <Home className="w-8 h-8 text-purple-600" />,
            features: ["Home Physiotherapy", "Mobile Chiropractic Care", "Personalized Treatment Plans", "Flexible Scheduling"],
            gradient: "from-purple-500 to-pink-600",
            badge: "Convenience"
        },
        {
            title: "Digital Assessment & Analysis",
            description: "Comprehensive postural assessments using digital analysis for precise diagnosis and treatment planning.",
            icon: <Eye className="w-8 h-8 text-indigo-600" />,
            features: ["Digital Postural Analysis", "Computerized Assessments", "3D Movement Analysis", "Progress Tracking"],
            gradient: "from-indigo-500 to-blue-600",
            badge: "Precision Care"
        },
        {
            title: "Specialized Pain Management",
            description: "Targeted treatment for chronic pain conditions with personalized therapy approaches and proven techniques.",
            icon: <Shield className="w-8 h-8 text-red-600" />,
            features: ["Chronic Pain Relief", "Nerve Entrapment Treatment", "Headache Management", "Joint Pain Solutions"],
            gradient: "from-red-500 to-rose-600",
            badge: "Pain Relief"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Treatments Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Stethoscope className="w-4 h-4" />
                            India's Most Trusted Chiropractic Care
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Comprehensive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Treatment Solutions</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Revolutionary chiropractic treatments combined with cutting-edge physiotherapy techniques.
                            Transform your life with our personalized healing approach featuring both
                            <span className="font-semibold text-blue-600"> manual/spinal adjustments</span> and
                            <span className="font-semibold text-green-600"> exercise-based rehabilitation</span>.
                        </p>
                    </div>

                    {/* Treatment Conditions Grid */}
                    <div className="mb-16">
                        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Conditions We Treat</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-center xl:grid-cols-5 gap-4">
                            {treatmentConditions.map((condition, index) => (
                                <div
                                    key={index}
                                    className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                                >
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${condition.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                        {condition.icon}
                                    </div>
                                    <h4 className="font-semibold mb-2 text-gray-900 text-sm leading-tight">{condition.name}</h4>
                                    <Button size={'sm'} variant={'outline'}>Book Now</Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Additional Offerings */}
                    <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Additional Specialized Offerings</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                <Home className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h4 className="font-bold text-gray-900 mb-2">Home Services</h4>
                                <p className="text-gray-600 text-sm">Professional physiotherapy & chiropractic care delivered to your home</p>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-teal-50 border border-green-100">
                                <Zap className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                <h4 className="font-bold text-gray-900 mb-2">Advanced Therapy</h4>
                                <p className="text-gray-600 text-sm">Spinal decompression, electrotherapy, ultrasound & laser treatment</p>
                            </div>
                            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                                <Eye className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                                <h4 className="font-bold text-gray-900 mb-2">Digital Analysis</h4>
                                <p className="text-gray-600 text-sm">Postural assessments & computerized chiropractic adjustments</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <div className="mt-12 px-4  mb-12 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center md:text-left">

                    {/* Icons */}
                    <div className="flex justify-center md:justify-start -space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-1">
                        <h4 className="font-bold text-gray-900 text-lg">Not sure which treatment you need?</h4>
                        <p className="text-gray-600 text-sm">Book a consultation to determine the best approach</p>
                    </div>

                    {/* Button */}
                    <div className="flex justify-center md:justify-end">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Consultation
                        </Button>
                    </div>

                </div>
            </div>


            {/* Services Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            Premium Healthcare Services
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Treatments Offerings</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Experience world-class chiropractic and physiotherapy services designed to restore your health and enhance your quality of life.
                        </p>
                    </div>

                    {/* Services Grid */}
                    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <Card key={index} className="group cursor-pointer relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white">
                                {/* Gradient Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                {/* Badge */}
                                {service.badge && (
                                    <div className="absolute top-2 right-4 z-10">
                                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
                                            <Star className="w-3 h-3 mr-1" />
                                            {service.badge}
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-br ${service.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            {React.cloneElement(service.icon, { className: "w-8 h-8 text-white" })}
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                                                {service.title}
                                            </CardTitle>
                                        </div>
                                    </div>
                                    <CardDescription className="text-gray-600 leading-relaxed">
                                        {service.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {/* Features List */}
                                    <div className="space-y-3 mb-6">
                                        {service.features.map((feature, featureIndex) => (
                                            <div key={featureIndex} className="flex items-center gap-3">
                                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                <span className="text-sm text-gray-700">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            className={`flex-1 bg-gradient-to-r ${service.gradient} hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-white border-0`}
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Book Now
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="px-4 hover:bg-gray-50 group-hover:border-blue-300 transition-colors duration-300"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>

                            </Card>
                        ))}
                    </div>

                    {/* Call to Action */}
                    <div className="mt-16 text-center">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 sm:p-8 text-white">
                            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Transform Your Health?</h3>
                            <p className="text-blue-100 mb-5 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                                Join thousands of satisfied patients who have experienced our revolutionary treatment approach.
                                Book your consultation today and take the first step towards a pain-free life.
                            </p>

                            {/* Responsive Button Group */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center sm:items-start">
                                <Button className="w-full cursor-pointer sm:w-auto bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-3 text-sm sm:text-base">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Schedule Consultation
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full cursor-pointer sm:w-auto border-white text-blue-600 hover:bg-white hover:text-blue-600 px-6 py-3 text-sm sm:text-base"
                                >
                                    <Stethoscope className="w-5 h-5 mr-2" />
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
};

export default ChiropracticClinic;