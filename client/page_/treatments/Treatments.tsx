"use client";
import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Star,
  Clock,
  Award,
  Users,
  CheckCircle,
  Calendar,
  IndianRupee,
  Tag,
  Plus,
  MessageSquare,
  Shield,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useServiceBySlug } from "@/hooks/use-service";
import Image from "next/image";
import { ServiceData } from "@/types/service";
import { useAuth } from "@/context/authContext/auth";
import { useRouter } from "next/navigation";
import ReviewModal from "./ReviewModel";
import { ReviewFormData } from "@/types/review";
import { drImageurl } from "@/constant/Images";
import { API_ENDPOINT } from "@/constant/url";
import Link from "next/link";
import ServiceImageCarousel from "@/components/ServiceImageCarousel";

const Treatments: React.FC<{ slug: string }> = ({ slug }) => {
  const { service } = useServiceBySlug(slug) as {
    service: ServiceData | null;
    fetchServiceBySlug: () => Promise<void>;
  };
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();

  const [selectedSessions, setSelectedSessions] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    review_message: "",
    review_ratings: 0,
    review_for_what_service: service?._id || "",
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (service?._id) {
      setReviewForm((prev) => ({
        ...prev,
        review_for_what_service: service._id,
      }));
    }
  }, [service?._id]);

  const calculateTotalPrice = (sessions: number) => {
    if (!service) return 0;
    return service.service_per_session_discount_price * sessions;
  };

  const calculateSavings = (sessions: number) => {
    if (!service) return 0;
    return (
      (service.service_per_session_price -
        service.service_per_session_discount_price) *
      sessions
    );
  };

  const renderStars = (
    rating: number,
    interactive = false,
    onStarClick?: (rating: number) => void
  ) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
          } ${interactive
            ? "cursor-pointer hover:text-yellow-400 transition-colors"
            : ""
          }`}
        onClick={() => interactive && onStarClick && onStarClick(i + 1)}
      />
    ));
  };

  const handleReviewSubmit = async () => {
    if (!isAuthenticated) {
      alert("Please login to submit a review");
      setIsReviewModalOpen(false);
      router.push("/login");
      return;
    }

    if (!reviewForm.review_message.trim() || reviewForm.review_ratings === 0) {
      alert("Please provide both rating and review message");
      return;
    }

    setIsSubmittingReview(true);

    try {
      // Replace with your actual API call
      const response = await fetch(`${API_ENDPOINT}/user/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewForm),
      });

      if (response.ok) {
        alert("Review submitted successfully!");
        setIsReviewModalOpen(false);
        setReviewForm({
          review_message: "",
          review_ratings: 0,
          review_for_what_service: service?._id || "",
        });
        // Optionally refresh the service data to show new review
        // fetchServiceBySlug()
      } else {
        throw new Error("Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const resetReviewForm = () => {
    setReviewForm({
      review_message: "",
      review_ratings: 0,
      review_for_what_service: service?._id || "",
    });
  };

  const NoReviewsSection = () => (
    <div className="text-center py-12 px-6 max-w-md mx-auto">
      <MessageSquare className="w-20 h-20 text-[#1C6AFF] mx-auto mb-4" />
      <h4 className="text-2xl font-bold text-gray-800 mb-2">No Reviews Yet</h4>
      <p className="text-gray-600 mb-6 text-sm md:text-base">
        Be the first to share your experience with this treatment
      </p>
      <Button
        onClick={() => setIsReviewModalOpen(true)}
        className=" bg-gradient-to-r from-[#155DFC] to-[#0092B8] 
                                            border-2 border-[#155DFC]  text-white font-semibold rounded-lg px-6 py-2  gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <Plus className="w-4 h-4" />
        Write First Review
      </Button>
    </div>
  );

  const ReviewsCarousel = () => (
    <div className="">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h4 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          Patient Experiences ({service?.service_reviews.length})
        </h4>
        <Button
          onClick={() => setIsReviewModalOpen(true)}
          variant="outline"
          size="sm"
          className="border-green-200 text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 hover:border-green-300 transition-all duration-300 font-medium rounded-full px-4"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Experience
        </Button>
      </div>

      <Carousel className="w-full mb-6">
        <CarouselContent className="-ml-2 md:-ml-4">
          {service?.service_reviews.map((review, index) => (
            <CarouselItem
              key={review._id + index}
              className="pl-2 pb-4 md:pl-4 basis-full lg:basis-1/2"
            >
              <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-white to-green-50 hover:shadow-2xl transition-all duration-300 group overflow-hidden relative rounded-2xl">
                {/* User Info Section */}
                <CardContent className="p-4 md:p-6 relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Profile Image */}
                    <Image
                      src={
                        review?.reviewer_id?.profileImage?.url ||
                        "https://via.placeholder.com/80"
                      }
                      alt={review?.reviewer_id?.name || "User"}
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-green-300 object-cover shadow-sm"
                      width={120}
                      height={120}
                    />

                    {/* Name and Rating */}
                    <div className="flex flex-col">
                      <h4 className="font-semibold text-gray-800 text-base md:text-lg">
                        {review?.reviewer_id?.name || "Anonymous User"}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-yellow-600">
                        {renderStars(review.review_ratings)}
                        <span className="ml-1 text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full text-xs">
                          {review.review_ratings}/5
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="mb-4 p-3 bg-white/80 backdrop-blur border border-green-100 rounded-xl shadow-inner">
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                      “{review.review_message}”
                    </p>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span>
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>

                {/* Decorative Elements */}
                <div className="absolute top-2 right-2 w-6 h-6 bg-green-200 opacity-20 rounded-full group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute bottom-2 left-2 w-4 h-4 bg-teal-200 opacity-30 rounded-full group-hover:translate-y-1 group-hover:animate-pulse" />
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows - Hidden on mobile */}
        <CarouselPrevious className="hidden md:flex -left-4 bg-white hover:bg-green-50 border-green-200 text-green-700" />
        <CarouselNext className="hidden md:flex -right-4 bg-white hover:bg-green-50 border-green-200 text-green-700" />
      </Carousel>

      {/* Mobile Navigation Dots */}
      <div className="flex justify-center mt-4 md:hidden">
        <div className="flex space-x-2">
          {service?.service_reviews.map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 bg-gradient-to-r from-green-300 to-teal-400 rounded-full opacity-60 hover:opacity-100 transition-opacity"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Loading Service Details...
          </h2>
          <p className="text-gray-500">
            Please wait while we fetch the information
          </p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Service not found
          </h2>
          <p className="text-gray-600 mt-2">
            The service &quot;{slug}&quot; could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12 py-8">
          {/* Left Side - Service Images Carousel */}
          <ServiceImageCarousel service={service} />

          {/* RIGHT PANEL – SERVICE DETAILS */}
          <div className="space-y-8">

            {/* STATUS BADGE + TITLE */}
            <div>
              <Badge
                className="inline-flex items-center gap-1 px-4 py-1.5 mb-4 bg-emerald-600 text-white shadow-md rounded-full"
              >
                <CheckCircle className="w-4 h-4" />
                {service.service_status}
              </Badge>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {service.service_name}
              </h1>

              <p className="mt-3 text-gray-600 max-w-2xl leading-relaxed">
                {service.service_small_desc}
              </p>
            </div>

            {/* PRICING CARD */}
            <Card className="relative overflow-hidden border border-gray-200 shadow-xl rounded-2xl bg-white">
              <CardContent className="p-6 space-y-6">

                {/* PRICE BLOCK */}
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5">
                  <div>
                    <p className="text-sm text-gray-500 line-through">
                      ₹{service.service_per_session_price.toLocaleString()} / session
                    </p>

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-3xl font-bold text-gray-900">
                        ₹{service.service_per_session_discount_price.toLocaleString()}
                      </span>
                      <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                        {service.service_per_session_discount_percentage}% OFF
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-600 p-3 rounded-xl shadow-md">
                    <Tag className="text-white w-6 h-6" />
                  </div>
                </div>

                {/* SESSION SELECTOR */}
                <div>
                  <p className="font-medium text-gray-800 mb-3">
                    Select number of sessions
                  </p>

                  <div className="flex flex-wrap gap-3">
                    {Array.from(
                      { length: service.service_session_allowed_limit },
                      (_, i) => i + 1
                    ).map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedSessions(num)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedSessions === num
                            ? "bg-blue-600 text-white shadow-lg scale-105"
                            : "bg-gray-100 hover:bg-blue-50 text-gray-700"
                          }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TOTAL & SAVINGS */}
                <div className="bg-gray-50 rounded-xl px-5 py-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Total ({selectedSessions} session{selectedSessions > 1 && "s"})
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      ₹{calculateTotalPrice(selectedSessions).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-green-700 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      You Save
                    </div>
                    <span>₹{calculateSavings(selectedSessions).toLocaleString()}</span>
                  </div>
                </div>
                {/* CTA */}
                <a
                  href={`/booking-sessions?sessions=${selectedSessions}&price=${calculateTotalPrice(selectedSessions).toLocaleString().replace(/[^\d.]/g, "")}&service=${slug}`}
                  className="w-full inline-flex justify-center items-center gap-2 bg-gradient-to-r from-[#155DFC] to-[#0092B8] hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-white px-5 py-2.5 text-center shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Appointment
                </a>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Service Description */}
        <Card className="mb-12 py-0 border border-blue-100 shadow-xl rounded-xl overflow-hidden">
          {/* Header */}
          <CardHeader className="bg-gradient-to-r from-[#155DFC] to-blue-500 px-6 py-4 text-white">
            <CardTitle className="text-xl font-extrabold md:text-2xl">
              About This Treatment
            </CardTitle>
          </CardHeader>

          {/* Content */}
          <CardContent className="p-4 md:p-8 bg-white">
            {/* Description */}
            <div className="mb-6">
              <div
                className="text-gray-700 text-base leading-relaxed break-words whitespace-normal w-full"
                dangerouslySetInnerHTML={{ __html: service.service_desc }}
              />
            </div>

            {/* Highlights */}
            <div className="mt-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-md">

              <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-6">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                Treatment Highlights
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {/* Sessions */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Sessions Allowed
                    </p>
                    <p className="text-sm text-gray-600">
                      Up to {service.service_session_allowed_limit} sessions
                    </p>
                  </div>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <div className="p-3 bg-green-100 rounded-full">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Discount Available
                    </p>
                    <p className="text-sm text-gray-600">
                      Save up to {service.service_per_session_discount_percentage}%
                    </p>
                  </div>
                </div>

                {/* Doctor */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Treated By Expert
                    </p>
                    <p className="text-sm text-gray-600">
                      Dr. {service.service_doctor.doctor_name}
                    </p>
                  </div>
                </div>

                {/* Reviews */}
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                  <div className="p-3 bg-teal-100 rounded-full">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Patient Satisfaction
                    </p>
                    <p className="text-sm text-gray-600">
                      {service.service_reviews.length}+ Happy Patients
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </CardContent>
        </Card>
        <div className="w-full lg:flex items-start gap-6 justify-between space-y-6 lg:space-y-0">
          {/* Doctor Section */}
          <Card className="lg:w-[32%] py-0 mb-5 border-0 shadow-sm bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-[#1B68FF] to-blue-600 py-2 px-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10 transform -skew-y-3"></div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-3 relative z-10 text-white">
                <div className="p-2 mt-2 bg-white bg-opacity-20 rounded-lg">
                  <Award className="w-5 text-blue-500 h-5 md:w-6 md:h-6" />
                </div>
                Meet Your Doctor
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 md:p-7 relative bg-gradient-to-b from-white to-blue-50 rounded-b-2xl shadow-lg border border-blue-100">
              {/* Doctor Profile */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-blue-300 shadow-xl mx-auto">
                    <AvatarImage
                      src={
                        service.service_doctor.doctor_images[0] || drImageurl
                      }
                      alt={service.service_doctor.doctor_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xl md:text-2xl font-bold bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700">
                      {service.service_doctor.doctor_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  {/* Active Status Indicator */}
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                    <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mt-4">
                  Dr. {service.service_doctor.doctor_name}
                </h3>
                <p className="py-4">
                  {service.service_doctor.specialization.map((spec, index) => {
                    // Clean unwanted quotes/brackets
                    const cleanedSpec = spec.replace(/['"\[\]\n]/g, "").trim();
                    return (
                      <Badge
                        key={index}
                        className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-1 rounded-lg shadow-md text-xs md:text-sm font-medium hover:scale-105 transition-transform duration-200"
                      >
                        {cleanedSpec}
                      </Badge>
                    );
                  })}
                </p>
                {/* Ratings */}
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {renderStars(
                      Math.floor(service.service_doctor.doctor_ratings)
                    )}
                  </div>
                  <span className="font-semibold text-[#1B68FF]">
                    {service.service_doctor.doctor_ratings}/5
                  </span>
                </div>

                {/* Status */}
                <div className="flex justify-center mt-3">
                  <Badge
                    className={`px-4 py-1 text-xs font-semibold rounded-lg shadow-md flex items-center gap-1 transition-all duration-300 ${service.service_doctor.doctor_status === "Booking takes"
                      ? "bg-gradient-to-r from-green-400 to-green-500 text-white"
                      : "bg-gray-200 text-gray-800"
                      }`}
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    {service.service_doctor.doctor_status}
                  </Badge>
                </div>
              </div>

              {/* Specializations */}
              <div className="mb-5 hidden">
                <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#1B68FF] rounded-lg"></div>
                  <span className="text-dark">Specializations</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {service.service_doctor.specialization.map((spec, index) => {
                    // Clean unwanted quotes/brackets
                    const cleanedSpec = spec.replace(/['"\[\]\n]/g, "").trim();
                    return (
                      <Badge
                        key={index}
                        className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-1 rounded-lg shadow-md text-xs md:text-sm font-medium hover:scale-105 transition-transform duration-200"
                      >
                        {cleanedSpec}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Languages */}
              <div className="hidden">
                <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#1B68FF] rounded-lg"></div>
                  <span className="text-gray-900">Languages</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {service.service_doctor.languagesSpoken.map((lang, index) => {
                    // Clean any unwanted quotes or brackets
                    const cleanedLang = lang.replace(/['"\[\]\n]/g, "").trim();
                    return (
                      <Badge
                        key={index}
                        className="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-4 py-1 rounded-lg shadow-md text-xs md:text-sm font-medium hover:scale-105 transition-transform duration-200"
                      >
                        {cleanedLang}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-6 w-10 h-10 bg-blue-200 opacity-30 rounded-full blur-xl"></div>
              <div className="absolute bottom-6 left-6 w-8 h-8 bg-indigo-200 opacity-40 rounded-full blur-lg"></div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="lg:w-[66%] py-0 border-0 shadow-sm bg-gradient-to-br from-green-50 via-white to-teal-50 overflow-hidden relative">
            <CardHeader className="bg-gradient-to-r from-[#1C6AFF] to-[#3A86FF] text-white relative overflow-hidden  py-2 px-6">
              <div className="absolute inset-0 bg-white opacity-10 transform skew-y-3"></div>
              <CardTitle className="text-lg md:text-2xl flex items-center gap-3 relative z-10">
                <div className="p-2 mt-2 bg-white bg-opacity-20 rounded-full">
                  <Users className="w-4 h-4 text-blue-500 md:w-6 md:h-6" />
                </div>
                Patient Reviews ({service.service_reviews.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-1 xl:grid-cols-10 gap-4 md:gap-6">
                {/* Reviews Content - Responsive */}
                <div className="xl:col-span-9">
                  {service.service_reviews.length > 0 ? (
                    <ReviewsCarousel />
                  ) : (
                    <NoReviewsSection />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Hurry Up Section */}
        <Card className="hidden border-0 shadow-sm bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden relative group hover:shadow-3xl transition-all duration-500">
          <CardContent className="p-8 relative z-10">
            <div className="text-center">
              {/* Floating discount badge */}
              <div
                className="inline-flex flex-col items-center justify-center w-20 h-20 
                    bg-gradient-to-r from-green-500 to-emerald-600 
                    text-white rounded-full mb-6 shadow-lg animate-bounce"
              >
                <span className="text-lg font-extrabold drop-shadow-sm">
                  {service.service_per_session_discount_percentage}%
                </span>
                <span className="text-[10px] tracking-wide font-medium">
                  OFF
                </span>
              </div>

              <h3 className="text-4xl font-bold mb-4  text-gray-900 tracking-tight drop-shadow-smt">
                Special Offer!
              </h3>

              <p className="text-xl mb-8 text-gray-900 font-medium leading-relaxed">
                Save{" "}
                <span className="font-bold text-green-800">
                  ₹{calculateSavings(selectedSessions).toLocaleString()}
                </span>{" "}
                on your {selectedSessions} session
                {selectedSessions > 1 ? "s" : ""}
              </p>

              {/* Price showcase */}
              <div className="bg-[#1F6FFF] rounded-3xl p-6 mb-8 shadow-2xl hover:shadow-3xl transition-shadow duration-500 overflow-hidden relative">
                <div className="flex justify-center items-center gap-8">
                  {/* Original Price */}
                  <div className="text-center">
                    <p className="text-sm text-white/70 mb-1">Original Price</p>
                    <span className="text-xl text-white/50 line-through">
                      ₹
                      {(
                        calculateTotalPrice(selectedSessions) +
                        calculateSavings(selectedSessions)
                      ).toLocaleString()}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="w-px h-16 bg-white/40"></div>

                  {/* Your Price */}
                  <div className="text-center">
                    <p className="text-sm text-white mb-1 font-semibold">
                      Your Price
                    </p>
                    <span className="text-3xl font-extrabold text-white">
                      ₹{calculateTotalPrice(selectedSessions).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Savings Highlight */}
                <div className="mt-5 p-4 bg-gradient-to-r from-green-400 to-green-500 rounded-2xl border border-green-600 shadow-lg hover:shadow-2xl transition-all duration-300 flex justify-center items-center gap-3">
                  {/* Icon */}
                  <span className="text-white font-bold text-lg">₹</span>

                  {/* Savings Text */}
                  <p className="text-white font-semibold text-sm md:text-base">
                    You save ₹
                    {calculateSavings(selectedSessions).toLocaleString()} today!
                  </p>
                </div>

                {/* Decorative floating circles */}
                <div className="absolute top-2 left-4 w-3 h-3 bg-white/30 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 right-6 w-4 h-4 bg-white/40 rounded-full animate-bounce"></div>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#155DFC] to-[#0092B8] 
                                    border-2 border-[#155DFC]  mb-5 mt-5 text-white font-bold px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-lg group-hover:animate-bounce"
              >
                <Calendar className="w-6 h-6 mr-3" />
                <Link
                  href={`/booking-sessions?sessions=${selectedSessions}&price=${calculateTotalPrice(
                    selectedSessions
                  )
                    .toLocaleString()
                    .replace(/[^\d.]/g, "")}&service=${slug}`}
                >
                  Book Now & Save Big!
                </Link>
                <span className="ml-2">→</span>
              </Button>

              {/* Trust indicators */}
              <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                {/* Instant Confirmation */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#1F6FFF]/30 to-[#4DB5FF]/20 text-[#1F6FFF] px-5 py-2 rounded-2xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                  <CheckCircle className="w-5 h-5 text-[#1F6FFF]" />
                  <span className="font-semibold text-sm md:text-base">
                    Instant Confirmation
                  </span>
                </div>

                {/* Secure Payment */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#00D1A0]/30 to-[#66E2B8]/20 text-[#00C49F] px-5 py-2 rounded-2xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                  <CreditCard className="w-5 h-5 text-[#00C49F]" />
                  <span className="font-semibold text-sm md:text-base">
                    Secure Payment
                  </span>
                </div>

                {/* Money Back Guarantee */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-[#FF7B7B]/30 to-[#FFA3A3]/20 text-[#FF4D4D] px-5 py-2 rounded-2xl shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-300">
                  <Shield className="w-5 h-5 text-[#FF4D4D]" />
                  <span className="font-semibold text-sm md:text-base">
                    Money Back Guarantee
                  </span>
                </div>
              </div>
            </div>
          </CardContent>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-gradient-to-br from-blue-200 to-blue-300 opacity-20 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-32 h-32 bg-gradient-to-tr from-blue-300 to-blue-400 opacity-15 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-transparent opacity-30 rounded-full blur-3xl -z-0"></div>

          {/* Floating particles */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-ping"></div>
          <div className="absolute top-12 right-8 w-2 h-2 bg-blue-500 rounded-full opacity-40 animate-pulse"></div>
          <div className="absolute bottom-8 left-8 w-4 h-4 bg-blue-300 rounded-full opacity-50 animate-bounce"></div>
        </Card>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isReviewModalOpen={isReviewModalOpen}
        setIsReviewModalOpen={setIsReviewModalOpen}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        service={service}
        renderStars={renderStars}
        handleReviewSubmit={handleReviewSubmit}
        isSubmittingReview={isSubmittingReview}
        resetReviewForm={resetReviewForm}
      />
    </div>
  );
};

export default Treatments;
