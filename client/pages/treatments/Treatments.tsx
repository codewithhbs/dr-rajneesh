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
        <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-700 mb-2">
                No Reviews Yet
            </h4>
            <p className="text-gray-500 mb-6">
                Be the first to share your experience with this treatment
            </p>
            <Button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                <Plus className="w-4 h-4 mr-2" />
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
                                            src={review?.reviewer_id?.profileImage?.url || 'https://via.placeholder.com/80'}
                                            alt={review?.reviewer_id?.name || 'User'}
                                            className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-green-300 object-cover shadow-sm"
                                            width={120}
                                            height={120}
                                        />

                                        {/* Name and Rating */}
                                        <div className="flex flex-col">
                                            <h4 className="font-semibold text-gray-800 text-base md:text-lg">
                                                {review?.reviewer_id?.name || 'Anonymous User'}
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
                <div className="grid lg:grid-cols-2 gap-8 mb-12">
                    {/* Left Side - Service Images Carousel */}
                    <div className="space-y-4">
                        <Carousel className="w-full">
                            <CarouselContent>
                                {service.service_images.map((image, index) => (
                                    <CarouselItem key={image._id}>
                                        <Card className="border-0 py-0 shadow-xs overflow-hidden">
                                            <CardContent className="p-0 aspect-[16/12] relative">
                                                <Image
                                                    src={
                                                        image.url ||
                                                        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop"
                                                    }
                                                    alt={`${service.service_name} - Image ${index + 1}`}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 50vw"
                                                    className="object-contain rounded-lg"
                                                />
                                            </CardContent>
                                        </Card>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-4" />
                            <CarouselNext className="right-4" />
                        </Carousel>
                    </div>

                    {/* Right Side - Service Details */}
                    <div className="space-y-6">
                        <div>
                            <Badge
                                variant="secondary"
                                className={`mb-4 ${service.service_status === "Booking Open"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {service.service_status}
                            </Badge>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                                {service.service_name}
                            </h1>
                            <p className="text-lg text-gray-600 mb-6">
                                {service.service_small_desc}
                            </p>
                        </div>

                        {/* Pricing Card */}
                        <Card className="border-0 shadow-xs bg-gradient-to-r from-blue-50 to-indigo-50">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500 line-through">
                                            ₹{service.service_per_session_price.toLocaleString()} per
                                            session
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-bold text-blue-600">
                                                ₹
                                                {service.service_per_session_discount_price.toLocaleString()}
                                            </span>
                                            <Badge variant="destructive" className="bg-red-500">
                                                {service.service_per_session_discount_percentage}% OFF
                                            </Badge>
                                        </div>
                                    </div>
                                    <Tag className="w-8 h-8 text-blue-600" />
                                </div>

                                {/* Session Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Number of Sessions (Max:{" "}
                                        {service.service_session_allowed_limit})
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {Array.from(
                                            { length: service.service_session_allowed_limit },
                                            (_, i) => i + 1
                                        ).map((num) => (
                                            <Button
                                                key={num}
                                                variant={
                                                    selectedSessions === num ? "default" : "outline"
                                                }
                                                size="sm"
                                                onClick={() => setSelectedSessions(num)}
                                                className="min-w-12"
                                            >
                                                {num}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Calculation */}
                                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">
                                            Total ({selectedSessions} sessions)
                                        </span>
                                        <span className="font-semibold text-lg">
                                            ₹{calculateTotalPrice(selectedSessions).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-green-600">
                                        <span>You save</span>
                                        <span className="font-semibold">
                                            ₹{calculateSavings(selectedSessions).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    <Calendar className="w-5 h-5 mr-2" />
                                    <Link
                                        href={`/booking-sessions?sessions=${selectedSessions}&price=${calculateTotalPrice(selectedSessions)
                                            .toLocaleString()
                                            .replace(/[^\d.]/g, '')}&service=${slug}`}
                                    >
                                        Book Appointment Now
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="w-full lg:flex items-start gap-6 justify-between space-y-6 lg:space-y-0">
                    {/* Doctor Section */}
                    <Card className="lg:w-[32%] py-0 mb-5 border-0 shadow-sm bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white relative overflow-hidden">
                            <div className="absolute inset-0 bg-white opacity-10 transform -skew-y-3"></div>
                            <CardTitle className="text-xl md:text-2xl flex items-center gap-3 relative z-10">
                                <div className="p-2 mt-2 bg-white bg-opacity-20 rounded-full">
                                    <Award className="w-5 text-blue-500 h-5 md:w-6 md:h-6" />
                                </div>
                                Meet Your Doctor
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4 md:p-6 relative">
                            {/* Doctor Profile */}
                            <div className="text-center mb-6">
                                <div className="relative inline-block">
                                    <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-blue-200 shadow-lg mx-auto">
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
                                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>

                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mt-4 mb-2">
                                    Dr. {service.service_doctor.doctor_name}
                                </h3>

                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <div className="flex items-center gap-1">
                                        {renderStars(
                                            Math.floor(service.service_doctor.doctor_ratings)
                                        )}
                                    </div>
                                    <span className="font-bold text-blue-700 text-sm md:text-base">
                                        {service.service_doctor.doctor_ratings}/5
                                    </span>
                                </div>

                                <Badge
                                    variant="secondary"
                                    className={`${service.service_doctor.doctor_status === "Booking takes"
                                        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200"
                                        : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300"
                                        } px-3 py-1 text-xs md:text-sm font-medium`}
                                >
                                    ✓ {service.service_doctor.doctor_status}
                                </Badge>
                            </div>

                            {/* Specializations */}
                            <div className="mb-4">
                                <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    Specializations
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {service.service_doctor.specialization.map((spec, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors text-xs px-2 py-1"
                                        >
                                            {spec}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Languages */}
                            <div className="">
                                <h4 className="font-bold text-gray-900 mb-3 text-sm md:text-base flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    Languages
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {service.service_doctor.languagesSpoken.map((lang, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className="bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 hover:from-gray-100 hover:to-slate-100 transition-colors text-xs px-2 py-1"
                                        >
                                            🗣️ {lang}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Special Note */}
                            {/* <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                <div className="flex items-start gap-3">
                    <div className="text-blue-500 text-lg">💬</div>
                    <p className="text-gray-700 italic text-sm md:text-base leading-relaxed">
                        &quot;{service.service_doctor.any_special_note}&quot;
                    </p>
                </div>
            </div> */}

                            {/* Decorative elements */}
                            <div className="absolute top-4 right-4 w-8 h-8 bg-blue-200 opacity-20 rounded-full blur-sm"></div>
                            <div className="absolute bottom-4 left-4 w-6 h-6 bg-indigo-200 opacity-30 rounded-full blur-sm"></div>
                        </CardContent>
                    </Card>

                    {/* Reviews Section */}
                    <Card className="lg:w-[66%] py-0 border-0 shadow-sm bg-gradient-to-br from-green-50 via-white to-teal-50 overflow-hidden relative">
                        <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white relative overflow-hidden">
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

                {/* Service Description */}
                <Card className="mb-12 py-0 border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-400 to-pink-400 py-4 text-white rounded-t-lg">
                        <CardTitle className="text-xl font-extrabold md:text-2xl">
                            About This Treatment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-8">
                        <div className="mb-6">
                            <div
                                className="text-gray-800 text-base leading-relaxed break-words whitespace-normal w-full"
                                dangerouslySetInnerHTML={{ __html: service.service_desc }}
                            />
                        </div>

                        <div className="mt-8 p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                Treatment Highlights
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-xs md:text-sm text-gray-700">
                                        Max {service.service_session_allowed_limit} sessions allowed
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                                    <span className="text-xs md:text-sm text-gray-700">
                                        {service.service_per_session_discount_percentage}% discount
                                        available
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="w-3 h-3 md:w-4 md:h-4 text-purple-600 flex-shrink-0" />
                                    <span className="text-xs md:text-sm text-gray-700">
                                        Expert care by {service.service_doctor.doctor_name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-3 h-3 md:w-4 md:h-4 text-teal-600 flex-shrink-0" />
                                    <span className="text-xs md:text-sm text-gray-700">
                                        {service.service_reviews.length}+ satisfied patients
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hurry Up Section */}
                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 via-white to-blue-100 overflow-hidden relative group hover:shadow-3xl transition-all duration-500">
                    <CardContent className="p-8 relative z-10">
                        <div className="text-center">
                            {/* Floating discount badge */}
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full mb-6 shadow-lg animate-pulse">
                                <span className="text-lg font-bold">
                                    {service.service_per_session_discount_percentage}%
                                </span>
                                <span className="text-xs block">OFF</span>
                            </div>

                            <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                                🎉 Special Offer!
                            </h3>

                            <p className="text-xl mb-8 text-blue-700 font-medium leading-relaxed">
                                Save{" "}
                                <span className="font-bold text-blue-800">
                                    ₹{calculateSavings(selectedSessions).toLocaleString()}
                                </span>{" "}
                                on your {selectedSessions} session
                                {selectedSessions > 1 ? "s" : ""}
                            </p>

                            {/* Price showcase */}
                            <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-blue-100">
                                <div className="flex justify-center items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-500 mb-1">Original Price</p>
                                        <span className="text-xl text-gray-400 line-through">
                                            ₹
                                            {(
                                                calculateTotalPrice(selectedSessions) +
                                                calculateSavings(selectedSessions)
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-px h-12 bg-blue-200"></div>
                                    <div className="text-center">
                                        <p className="text-sm text-blue-600 mb-1 font-medium">
                                            Your Price
                                        </p>
                                        <span className="text-3xl font-bold text-blue-800">
                                            ₹{calculateTotalPrice(selectedSessions).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Savings highlight */}
                                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                    <p className="text-green-700 font-semibold text-sm flex items-center justify-center">
                                        💰 You save ₹
                                        {calculateSavings(selectedSessions).toLocaleString()} today!
                                    </p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-10 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-full group-hover:animate-bounce"
                            >
                                <Calendar className="w-6 h-6 mr-3" />
                                <Link
                                    href={`/booking-sessions?sessions=${selectedSessions}&price=${calculateTotalPrice(selectedSessions)
                                        .toLocaleString()
                                        .replace(/[^\d.]/g, '')}&service=${slug}`}
                                >

                                    Book Now & Save Big!
                                </Link>
                                <span className="ml-2">→</span>
                            </Button>

                            {/* Trust indicators */}
                            <div className="mt-6 flex justify-center items-center gap-4 text-sm text-blue-600">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Instant Confirmation
                                </div>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Secure Payment
                                </div>
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Money Back Guarantee
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
