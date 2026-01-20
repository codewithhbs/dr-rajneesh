"use client"
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Activity,
    Zap,
    Home,
    Brain,
    Bone,
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

    const treatmentConditions = dbServices
        ?.reverse()
        .map((service, index) => ({
            slug: service.service_slug,
            position: service.position,
            name: service.service_name,
            icon: icons[index % icons.length],
            color: colors[index % colors.length],
            service_desc: service.service_desc
        }))
        .sort((a, b) => a.position - b.position);

    const stats = [
        { icon: <Users className="w-6 h-6" />, number: "50,000+", label: "Happy Patients" },
        { icon: <Award className="w-6 h-6" />, number: "9+", label: "Years Experience" },
        { icon: <Star className="w-6 h-6" />, number: "4.9", label: "Average Rating" },
        { icon: <CheckCircle className="w-6 h-6" />, number: "98%", label: "Success Rate" }
    ];



    return (
        <div  className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F0F9FF] to-[#ECFDF5] overflow-hidden">
            {/* Hero Section */}
            <section className="relative py-20 px-4 sm:px-6 lg:px-8 ">
                {/* Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#155DFC]/5 to-[#0092B8]/5"></div>
                <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-[#155DFC]/20 to-[#0092B8]/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-[#009689]/20 to-[#0092B8]/20 rounded-full blur-3xl"></div>

                <div className="relative max-w-7xl mx-auto">
                    {/* Header Badge */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white px-6 py-3 rounded-lg text-sm font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <Sparkles className="w-4 h-4" />
                            India&apos;s Most Trusted Chiropractic Care
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            Comprehensive{" "}
                            <span className="text-[#155DFC]">
                                Treatment Solutions
                            </span>
                        </h1>

                        <p className="text-md text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                            Revolutionary chiropractic treatments combined with cutting-edge
                            physiotherapy techniques. Transform your life with our
                            personalized healing approach featuring both
                            <span className="font-semibold text-[#155DFC]">
                                {" "}
                                manual/spinal adjustments
                            </span>{" "}
                            and
                            <span className="font-semibold text-[#009689]">
                                {" "}
                                exercise-based rehabilitation
                            </span>
                            .
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                            <Link href={"/book-now-consultation"}>
                                <Button className="relative overflow-hidden bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-md hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                                    <Calendar className="w-5 h-5 mr-2" />
                                    Book Consultation
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                    {/* Animated shine effect */}
                                    <span className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-50 transition-opacity duration-300 rounded-full"></span>
                                </Button>
                            </Link>

                  <a
  href="https://api.whatsapp.com/send?phone=919031554875"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-block"
>
  <Button
    variant="outline"
    className="relative px-8 py-4 text-lg font-semibold border-2 border-[#009689] text-[#009689]
               rounded-lg hover:bg-[#009689]/10 shadow-md hover:shadow-lg
               transform hover:scale-105 transition-all duration-300"
  >
    <Phone className="w-5 h-5 mr-2" />
    Call Now
    <span className="absolute inset-0 rounded-full shadow-[0_0_10px_#009689]
                     opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
  </Button>
</a>

                        </div>


                        {/* Stats */}
                        <div  className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {stats.map((stat, index) => {
                                // Define different background colors for each card
                                const cardColors = [
                                    "#E5F0FF", // Soft blue
                                    "#DCFCF5", // Soft cyan
                                    "#E6FCED", // Soft green
                                    "#DEFCFE"  // Soft teal
                                ];

                                return (
                                    <div
                                        key={index}
                                        className={`text-center p-5 rounded-2xl shadow-lg border border-white/20 
                            hover:shadow-xl hover:scale-105 transition-all duration-300`}
                                        style={{ backgroundColor: cardColors[index % cardColors.length] }}
                                    >
                                        <div className="mb-2 flex justify-center text-[#155DFC]">
                                            {stat.icon}
                                        </div>
                                        <div  className="text-3xl font-bold text-gray-900">{stat.number}</div>
                                        <div id='service' className="text-sm text-gray-600">{stat.label}</div>
                                    </div>
                                );
                            })}
                        </div>


                    </div>
                </div>
            </section>

            {/* Treatment Conditions Section */}
            <section  className="py-16  px-4 sm:px-6 lg:px-8  max-w-7xl mx-auto">
                <div>
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
                            Conditions We{" "}
                            <span className="text-transparent bg-clip-text bg-[#155DFC]">
                                Treat
                            </span>
                        </h2>
                        <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
                            Expert care for a wide range of musculoskeletal conditions with
                            proven treatment protocols
                        </p>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {treatmentConditions.map((condition, index) => {
                            const lightBgColors = [
                                "bg-blue-50",
                                "bg-cyan-50",
                                "bg-green-50",
                                "bg-yellow-50",
                                "bg-pink-50",
                                "bg-purple-50",
                            ];
                            return (
                                <Link
                                    key={index}
                                    href={`/treatments/${condition?.slug}`}
                                    className={`group relative rounded-2xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-transparent ${lightBgColors[index % lightBgColors.length]}`}
                                >
                                    {/* Icon Container */}
                                    <div
                                        className={`flex items-center justify-center w-14 h-14 rounded-xl text-white mb-4 bg-gradient-to-br ${condition.color} group-hover:scale-110 transition-transform duration-300 shadow-md hover:shadow-lg`}
                                    >
                                        {condition.icon}
                                    </div>

                                    {/* Condition Name */}
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition">
                                        {condition.name}
                                    </h3>
                                    <p
                                        className="text-sm text-gray-600 leading-relaxed line-clamp-5"
                                        dangerouslySetInnerHTML={{ __html: condition.service_desc || "" }}
                                    />

                                    <div className="my-4 h-px bg-gray-200" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">View Details</span>

                                        <Button
                                            size={"sm"}
                                            variant={"outline"}
                                            className="border-[#009689] text-[#009689] hover:bg-[#009689]/10 hover:scale-105 transition-all duration-300"
                                        >
                                            Book Now
                                        </Button>
                                    </div>



                                    {/* Glow Effect on Hover */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#155DFC]/20 via-[#009689]/20 to-[#0092B8]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </Link>
                            );
                        })}
                    </div>
                </div>

            </section>


            {/* CTA Section */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div >
                    <div className="relative bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#06B6D4] rounded-xl px-8 py-10 md:p-12 shadow-2xl overflow-hidden">
                        {/* Soft Glow Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/10 to-white/5 rounded-3xl pointer-events-none"></div>
                        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-[#60A5FA]/30 via-[#3B82F6]/30 to-[#06B6D4]/30 blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gradient-to-br from-[#22D3EE]/20 via-[#0EA5E9]/20 to-[#3B82F6]/20 blur-3xl pointer-events-none"></div>

                        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 text-white">
                            {/* Text Content */}
                            <div className="text-center md:text-left flex-1">
                                <h3 className="text-2xl md:text-3xl font-extrabold mb-2 drop-shadow-lg">
                                    Not sure which treatment you need?
                                </h3>
                                <p className="text-lg text-white/90 mb-4">
                                    Book a consultation to determine the best approach for your
                                    specific condition
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-white/90" />
                                        <span>30-min consultation</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-white/90" />
                                        <span>Mumbai & Patna</span>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="flex-shrink-0">
                                <Button className="bg-white text-gray-900 px-8 py-4 text-lg font-semibold shadow-lg flex items-center
                                                hover:bg-white hover:text-gray-900">
                                    <Calendar className="w-5 h-5 mr-2 text-gray-900" />
                                    Book Consultation
                                    <ArrowRight className="w-5 h-5 ml-2 text-gray-900" />
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