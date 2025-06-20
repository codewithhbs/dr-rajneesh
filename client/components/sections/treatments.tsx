"use client"
import React from 'react';
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
  
} from 'lucide-react';
import { useService } from '@/hooks/use-service';
import Link from 'next/link';

const ChiropracticClinic = () => {

    const { services: dbServices } = useService()
    const icons = [<Bone className="w-5 h-5" />, <Brain className="w-5 h-5" />, <Activity className="w-5 h-5" />, <Target className="w-5 h-5" />, <Zap className="w-5 h-5" />];
    const colors = [
        "bg-red-100 text-red-700",
        "bg-orange-100 text-orange-700",
        "bg-yellow-100 text-yellow-700",
        "bg-purple-100 text-purple-700",
        "bg-blue-100 text-blue-700",
        "bg-green-100 text-green-700",
        "bg-pink-100 text-pink-700",
        "bg-indigo-100 text-indigo-700",
        "bg-teal-100 text-teal-700",
        "bg-cyan-100 text-cyan-700",
        "bg-emerald-100 text-emerald-700",
        "bg-rose-100 text-rose-700",
        "bg-amber-100 text-amber-700"
    ];


    const treatmentConditions = dbServices?.map((service, index) => ({
        name: service.service_name,
        icon: icons[index % icons.length], // rotate icons
        color: colors[index % colors.length] // rotate colors
    }))

 
    return (
        <div className="min-h-screen bg-gradient-to-br mb- mn   vgf from-slate-50 via-blue-50 to-indigo-50">
            {/* Treatments Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Stethoscope className="w-4 h-4" />
                            {`India's Most Trusted Chiropractic Care`}
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
                <div className="flex  flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center md:text-left">

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
                    <div className="space-y-1 ">
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


         
        </div>
    );
};

export default ChiropracticClinic;