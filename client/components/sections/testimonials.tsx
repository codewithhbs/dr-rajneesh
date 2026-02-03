"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Heart,
  Users,
  Award,
  Sparkles,
  CheckCircle,
  ThumbsUp,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const Testimonials = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      name: "K.K. Singh",
      role: "Patient",
      rating: 5,
      review:
        "I've been very happy with my experience with Complete Physio. They have been very engaged with my care, and have always explained very clearly what the problems I'm experiencing are, and why, and I have seen marked improvement over time by following their advice.",
      treatment: "Physiotherapy",
      duration: "6 months",
      avatar: "/placeholder.svg?height=80&width=80",
      gradient: "from-blue-400 to-cyan-400",
      condition: "Chronic Pain Management",
    },
    {
      id: 2,
      name: "Rohit Arora",
      role: "Patient",
      rating: 5,
      review:
        "After two years of pain and two rounds of physio in various places, Dr. Rajneesh Kant identified my lower back injury, treated it, and prescribed exercises which resolved the problem completely. One year down the line, I am back to yoga with no back pain at all.",
      treatment: "Lower Back Treatment",
      duration: "3 months",
      avatar: "/placeholder.svg?height=80&width=80",
      gradient: "from-green-400 to-emerald-400",
      condition: "Lower Back Injury",
    },
    {
      id: 3,
      name: "Sanjay Mishra",
      role: "Patient",
      rating: 5,
      review:
        "He is supportive, friendly, and very good at the diagnosis and treatment with the right types of exercises. Currently, four months after surgery, I am almost as good as I used to be! Effective Physiotherapy Treatment. Highly recommended.",
      treatment: "Post-Surgery Rehabilitation",
      duration: "4 months",
      avatar: "/placeholder.svg?height=80&width=80",
      gradient: "from-purple-400 to-pink-400",
      condition: "Post-Operative Care",
    },
  ];

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
    setIsAutoPlaying(false);
  };

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.children[0].offsetWidth + 24; // including gap
      sliderRef.current.scrollBy({ left: slideWidth, behavior: "smooth" });
    }
  };

  const prevSlide = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.children[0].offsetWidth + 24; // including gap
      sliderRef.current.scrollBy({ left: -slideWidth, behavior: "smooth" });
    }
  };

  const stats = [
    {
      number: "50000+",
      label: "Happy Patients",
      icon: <Users className="w-5 h-5" />,
    },
    {
      number: "98%",
      label: "Success Rate",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      number: "4.9/5",
      label: "Average Rating",
      icon: <Star className="w-5 h-5" />,
    },
    {
      number: "9+",
      label: "Years Experience",
      icon: <Award className="w-5 h-5" />,
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#155DFC] to-[#0092B8] text-white px-6 py-3 rounded-lg text-sm font-semibold mb-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <MessageCircle className="w-4 h-4" />
            Patient Testimonials
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-5xl lg:text-5xl font-black text-gray-800 mb-6 leading-tight">
            What Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#155DFC] to-[#0092B8]">
              Patients
            </span>
          </h1>
        </div>

        {/* All Testimonials Slider */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8 ">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
              More Patient Stories
            </h3>
            <div className="flex gap-2 pr-20">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full p-2"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full p-2"
                onClick={nextSlide}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Horizontal Scrolling Container */}
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {testimonials.map((testimonial, index) => (
              <Card
                key={testimonial.id}
                className="group relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl flex-shrink-0 w-80 sm:w-96"
                onClick={() => goToTestimonial(index)}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                ></div>

                <CardContent className="p-6 relative z-10">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg`}
                    >
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {testimonial.name}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-current text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Review */}
                  <blockquote className="text-gray-700 leading-relaxed mb-4 line-clamp-4 italic">
                    "{testimonial.review}"
                  </blockquote>

                  {/* Treatment Info */}
                  {/* <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-3 h-3 text-green-500" />
                      <span>{testimonial.treatment}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-blue-500" />
                      <span>{testimonial.condition}</span>
                    </div>
                  </div> */}

                  {/* Duration Badge */}
                  {/* <Badge
                    className={`bg-gradient-to-r ${testimonial.gradient} text-white border-0 mt-4 text-xs`}
                  >
                    {testimonial.duration} treatment
                  </Badge> */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        {/* <div className="text-center py-16">
          <Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 text-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500">
            <CardContent className="p-10 sm:p-12">
              <div className="max-w-3xl mx-auto">
               
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <Heart className="w-10 h-10 text-white" />
                </div>

               
                <h3 className="text-3xl sm:text-4xl font-extrabold mb-4">
                  Ready to Write Your Own Success Story?
                </h3>

                
                <p className="text-xl opacity-90 mb-10 leading-relaxed">
                  Join hundreds of satisfied patients who have transformed their
                  lives with our personalized care. Your journey to better
                  health starts with a single appointment.
                </p>

                
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link href="/book-now-consultation">
                    <Button className="bg-white text-blue-600 border-0 hover:bg-white/90 hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold flex items-center justify-center gap-2 rounded-xl">
                      <Users className="w-5 h-5" />
                      Book Your Consultation
                    </Button>
                  </Link>
                </div>

               
                <div className="flex justify-center gap-4 mt-8 flex-wrap">
                 
                  <div className="flex items-center gap-2 bg-[#D9FCF5] text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">4.9/5 Rating</span>
                  </div>

                
                  <div className="flex items-center gap-2 bg-[#D9FCF5] text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">
                      50,000+ Patients
                    </span>
                  </div>

                
                  <div className="flex items-center gap-2 bg-[#D9FCF5] text-gray-800 px-4 py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
                    <Award className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">9+ Years Exp.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default Testimonials;
