"use client"
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
    ArrowRight,
    Star,
    CheckCircle,
    Users,
    Award,
    MapPin,
    Phone,
    Clock,
    Sparkles
} from 'lucide-react';
import { useService } from '@/hooks/use-service';
import Link from 'next/link';

const ChiropracticClinic = () => {
    const { services: dbServices } = useService();

    const icons = [<Bone className="w-5 h-5" />, <Brain className="w-5 h-5" />, <Activity className="w-5 h-5" />, <Target className="w-5 h-5" />, <Zap className="w-5 h-5" />];
    const colors = [
        "from-red-500 to-rose-500",
        "from-orange-500 to-amber-500",
        "from-yellow-500 to-orange-500",
        "from-purple-500 to-violet-500",
        "from-blue-500 to-indigo-500",
        "from-green-500 to-emerald-500",
        "from-pink-500 to-rose-500",
        "from-indigo-500 to-purple-500",
        "from-teal-500 to-cyan-500",
        "from-cyan-500 to-blue-500",
        "from-emerald-500 to-teal-500",
        "from-rose-500 to-pink-500",
        "from-amber-500 to-yellow-500"
    ];

    const treatmentConditions = dbServices?.reverse().map((service, index) => ({
        name: service.service_name,
        icon: icons[index % icons.length],
        color: colors[index % colors.length]
    }));

    const stats = [
        { icon: <Users className="w-6 h-6" />, number: "50,000+", label: "Happy Patients" },
        { icon: <Award className="w-6 h-6" />, number: "15+", label: "Years Experience" },
        { icon: <Star className="w-6 h-6" />, number: "4.9", label: "Average Rating" },
        { icon: <CheckCircle className="w-6 h-6" />, number: "98%", label: "Success Rate" }
    ];

    const specialties = [
        {
            icon: <Home className="w-8 h-8" />,
            title: "Home Services",
            description: "Professional physiotherapy & chiropractic care delivered to your home with advanced equipment",
            gradient: "from-blue-600 to-cyan-600",
            bgGradient: "from-blue-50 to-cyan-50"
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Advanced Therapy",
            description: "Spinal decompression, electrotherapy, ultrasound & laser treatment using cutting-edge technology",
            gradient: "from-green-600 to-teal-600",
            bgGradient: "from-green-50 to-teal-50"
        },
        {
            icon: <Eye className="w-8 h-8" />,
            title: "Digital Analysis",
            description: "Postural assessments & computerized chiropractic adjustments with precision diagnostics",
            gradient: "from-purple-600 to-pink-600",
            bgGradient: "from-purple-50 to-pink-50"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-3xl"></div>

                <div className="relative max-w-7xl mx-auto">
                    {/* Header Badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <Sparkles className="w-4 h-4" />
                            India's Most Trusted Chiropractic Care
                            <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                        </div>

                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                            Comprehensive
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                                Treatment Solutions
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-8">
                            Revolutionary chiropractic treatments combined with cutting-edge physiotherapy techniques.
                            Transform your life with our personalized healing approach featuring both
                            <span className="font-semibold text-blue-600"> manual/spinal adjustments</span> and
                            <span className="font-semibold text-green-600"> exercise-based rehabilitation</span>.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <Link href={'/book-now-consultation'}>
                                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Book Consultation
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href={'https://api.whatsapp.com/send?phone=91-9031554875'} passHref >

                                <Button variant="outline" className="px-8 py-4 text-lg border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300">
                                    <Phone className="w-5 h-5 mr-2" />
                                    Call Now
                                </Button>
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
                                    <div className="text-blue-600 mb-2 flex justify-center">
                                        {stat.icon}
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                                    <div className="text-sm text-gray-600">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Treatment Conditions Section */}
            <div className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">

                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Conditions We <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Treat</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Expert care for a wide range of musculoskeletal conditions with proven treatment protocols
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-center xl:grid-cols-5 gap-4">
                        {treatmentConditions.map((condition, index) => (
                            <Link
                                href={`/treatments/${condition?.name.toLowerCase().replace(/\s+/g, '-')}`}
                                key={index}
                                className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                            >
                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${condition.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                    {condition.icon}
                                </div>
                                <h4 className="font-semibold mb-2 text-gray-900 text-sm leading-tight">{condition.name}</h4>
                                <Button size={'sm'} variant={'outline'}>Book Now</Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            {/* Specialized Offerings Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Specialized <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">Offerings</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Advanced treatment modalities designed to accelerate your healing journey
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {specialties.map((specialty, index) => (
                            <div key={index} className={`group relative bg-gradient-to-br ${specialty.bgGradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-white/50 overflow-hidden`}>
                                {/* Background Pattern */}
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                {/* Icon */}
                                <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${specialty.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    {specialty.icon}
                                </div>

                                {/* Content */}
                                <h3 className="font-bold text-gray-900 text-xl mb-3">{specialty.title}</h3>
                                <p className="text-gray-700 leading-relaxed">{specialty.description}</p>

                                {/* Learn More Link */}
                                <div className="mt-6 flex items-center text-gray-900 font-semibold group-hover:text-blue-600 transition-colors duration-300">
                                    Learn More <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Consultation CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
                        {/* Background Elements */}
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                            {/* Icons */}
                            <div className="flex justify-center md:justify-start -space-x-3">
                                {[Stethoscope, Heart, Shield].map((Icon, index) => (
                                    <div key={index} className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30 hover:scale-110 transition-transform duration-300">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                ))}
                            </div>

                            {/* Text Content */}
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                                    Not sure which treatment you need?
                                </h3>
                                <p className="text-lg text-white/90 mb-4">
                                    Book a consultation to determine the best approach for your specific condition
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>30-min consultation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        <span>Available At Mumbai and Patna City</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="flex-shrink-0">
                                <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Book Consultation
                                    <ArrowRight className="w-5 h-5 ml-2" />
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