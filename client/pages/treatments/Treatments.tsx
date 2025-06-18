"use client"

import { useServiceBySlug } from "@/hooks/use-service"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
    Star,
    Clock,
    IndianRupee,
    Calendar,
    Award,
    Users,
    CheckCircle,
    ArrowRight,
    Heart,
    Share2,
    MessageCircle,
    Zap,
    Timer,
    TrendingUp,
    Shield,
    Target,
    Sparkles,
    Phone,
    Globe,
    Quote,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
} from "lucide-react"

const Treatments = ({ slug }) => {
    const { service } = useServiceBySlug(slug)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [timeLeft, setTimeLeft] = useState(24 * 60 * 60)
    const [isReviewsAutoPlay, setIsReviewsAutoPlay] = useState(true)

    // Auto-play image slider
    useEffect(() => {
        if (service?.service_images?.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % service.service_images.length)
            }, 4000)
            return () => clearInterval(interval)
        }
    }, [service?.service_images?.length])

    // Auto-play reviews slider
    useEffect(() => {
        if (service?.service_reviews?.length > 1 && isReviewsAutoPlay) {
            const interval = setInterval(() => {
                setCurrentReviewIndex((prev) => (prev + 1) % service.service_reviews.length)
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [service?.service_reviews?.length, isReviewsAutoPlay])

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (service) {
            setIsLoading(false)
        }
    }, [service])

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`
    }

    const nextReview = () => {
        setCurrentReviewIndex((prev) => (prev + 1) % service.service_reviews.length)
    }

    const prevReview = () => {
        setCurrentReviewIndex((prev) => (prev - 1 + service.service_reviews.length) % service.service_reviews.length)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600"></div>
                    <div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400 animate-spin"
                        style={{ animationDelay: "0.15s" }}
                    ></div>
                </div>
            </div>
        )
    }

    if (!service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <Card className="p-8 text-center shadow-sm border-0 bg-white/80 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
                    <p className="text-gray-600">The requested treatment could not be found.</p>
                </Card>
            </div>
        )
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "Booking Open":
                return "bg-emerald-100 text-emerald-800 border-emerald-200"
            case "Booking Close":
                return "bg-rose-100 text-rose-800 border-rose-200"
            case "Published":
                return "bg-blue-100 text-blue-800 border-blue-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`h-4 w-4 transition-colors ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-gray-300"
                    }`}
            />
        ))
    }

    const averageRating =
        service.service_reviews?.length > 0
            ? service.service_reviews.reduce((acc, review) => acc + review.review_ratings, 0) / service.service_reviews.length
            : 0

    const discountAmount = service.service_per_session_price - service.service_per_session_discount_price

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Floating Actions */}
            <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-md border-white/20 shadow-lg hover:shadow-sm transition-all duration-300 rounded-full w-12 h-12 p-0"
                >
                    <Heart className="h-4 w-4 text-rose-500" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-md border-white/20 shadow-lg hover:shadow-sm transition-all duration-300 rounded-full w-12 h-12 p-0"
                >
                    <Share2 className="h-4 w-4 text-blue-500" />
                </Button>
            </div>

            <div className=" mx-auto">
                {/* Hero Section */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
                    <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                            {/* Image Section */}
                            <div className="lg:col-span-7">
                                <div className="relative group">
                                    <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-100 to-purple-100">
                                        {service.service_images && service.service_images.length > 0 ? (
                                            <>
                                                <img
                                                    src={service.service_images[currentImageIndex]?.url || "/placeholder.svg"}
                                                    alt={`${service.service_name} ${currentImageIndex + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                                                {/* Image Navigation */}
                                                {service.service_images.length > 1 && (
                                                    <>
                                                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                                                            {service.service_images.map((_, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => setCurrentImageIndex(index)}
                                                                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentImageIndex
                                                                        ? "bg-white shadow-lg scale-125"
                                                                        : "bg-white/60 hover:bg-white/80"
                                                                        }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <div className="absolute top-6 right-6 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
                                                            <span className="text-white text-sm font-medium">
                                                                {currentImageIndex + 1} / {service.service_images.length}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <img
                                                    src="/images/neck-pain-treatment.png"
                                                    alt="Treatment"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Floating Stats */}
                                    <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                                <p className="text-2xl font-bold text-gray-900">95%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="lg:col-span-5 space-y-8">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-6">
                                        <Badge
                                            className={`px-4 py-2 text-sm font-semibold border-2 ${getStatusColor(service.service_status)}`}
                                        >
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            {service.service_status}
                                        </Badge>
                                        <Badge
                                            variant="outline"
                                            className="px-3 py-1 border-2 border-indigo-200 text-indigo-700 bg-indigo-50"
                                        >
                                            #{service.service_tag}
                                        </Badge>
                                    </div>

                                    <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                            {service.service_name}
                                        </span>
                                    </h1>
                                    <p className="text-xl text-gray-600 leading-relaxed mb-8">{service.service_small_desc}</p>
                                </div>

                                {/* Pricing Card */}
                                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                                    {/* Urgency Header */}
                                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Timer className="w-5 h-5 animate-pulse" />
                                                <span className="font-bold">Limited Time Offer!</span>
                                            </div>
                                            <div className="font-mono text-lg font-bold">{formatTime(timeLeft)}</div>
                                        </div>
                                        <Progress value={(timeLeft / (24 * 60 * 60)) * 100} className="mt-3 h-2 bg-white/20" />
                                    </div>

                                    <CardContent className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xl font-bold text-gray-900">Session Pricing</h3>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="h-4 w-4" />
                                                <span className="text-sm">Max {service.service_session_allowed_limit} sessions</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {service.service_per_session_discount_price < service.service_per_session_price ? (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <IndianRupee className="h-8 w-8 text-emerald-600" />
                                                        <span className="text-4xl font-bold text-emerald-600">
                                                            {service.service_per_session_discount_price.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xl text-gray-500 line-through">
                                                            ₹{service.service_per_session_price.toLocaleString()}
                                                        </span>
                                                        <Badge className="bg-red-100 text-red-800 font-bold">
                                                            Save ₹{discountAmount.toLocaleString()}
                                                        </Badge>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="h-8 w-8 text-blue-600" />
                                                    <span className="text-4xl font-bold text-blue-600">
                                                        {service.service_per_session_price.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <Button
                                                size="lg"
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-sm transform hover:scale-[1.02] transition-all duration-300"
                                            >
                                                <Calendar className="mr-2 h-5 w-5" />
                                                Book Session Now
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
                                            >
                                                <Phone className="h-5 w-5" />
                                            </Button>
                                        </div>

                                        {/* Trust Indicators */}
                                        <div className="flex items-center justify-center gap-8 pt-6 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Shield className="h-4 w-4 text-emerald-500" />
                                                <span className="font-medium">100% Safe</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium">Certified</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Star className="h-4 w-4 text-amber-500" />
                                                <span className="font-medium">Top Rated</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Content Grid */}
                <section className="px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
                    <div className=" mx-auto">
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                            {/* Doctor Profile Card - 1 Column */}
                            {service.service_doctor && (
                                <div className="xl:col-span-1">
                                    <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/50">
                                            <CardTitle className="text-xl text-slate-800 flex items-center gap-3">
                                                <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                                    <Award className="h-5 w-5 text-blue-600" />
                                                </div>
                                                Your Doctor
                                            </CardTitle>
                                        </CardHeader>

                                        <CardContent className="p-6">
                                            {/* Doctor Info */}
                                            <div className="text-center mb-6">
                                                <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-blue-100 shadow-lg">
                                                    <AvatarImage
                                                        src={service.service_doctor.doctor_images?.[0] || "/api/placeholder/150/150"}
                                                        alt={service.service_doctor.doctor_name}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xl font-bold">
                                                        {service.service_doctor.doctor_name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <h3 className="font-bold text-xl text-slate-800 mb-2">
                                                    {service.service_doctor.doctor_name}
                                                </h3>

                                                <div className="flex items-center justify-center gap-2 mb-3">
                                                    <div className="flex">{renderStars(service.service_doctor.doctor_ratings)}</div>
                                                    <span className="text-lg font-semibold text-slate-700">
                                                        {service.service_doctor.doctor_ratings}
                                                    </span>
                                                </div>

                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1">
                                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                                    {service.service_doctor.doctor_status}
                                                </Badge>
                                            </div>

                                            {/* Specializations */}
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-blue-600" />
                                                    Specializations
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {service.service_doctor.specialization?.map((spec, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
                                                        >
                                                            {spec}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Languages */}
                                            <div className="mb-6">
                                                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                    <Globe className="h-4 w-4 text-indigo-600" />
                                                    Languages
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {service.service_doctor.languagesSpoken?.map((lang, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="text-sm bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                        >
                                                            {lang}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Special Note */}
                                            {service.service_doctor.any_special_note && (
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                                    <Quote className="h-5 w-5 text-blue-400 mb-2" />
                                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                                        "{service.service_doctor.any_special_note}"
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Reviews Section - 2 Columns */}
                            {service.service_reviews && service.service_reviews.length > 0 && (
                                <div className="xl:col-span-2">
                                    <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                                        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100/50">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                                                        <MessageCircle className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                    Patient Reviews
                                                </CardTitle>

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex">{renderStars(averageRating)}</div>
                                                        <span className="text-2xl font-bold text-slate-800">
                                                            {averageRating.toFixed(1)}
                                                        </span>
                                                        <span className="text-slate-600 font-medium">
                                                            ({service.service_reviews.length} reviews)
                                                        </span>
                                                    </div>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setIsReviewsAutoPlay(!isReviewsAutoPlay)}
                                                        className="border-amber-200 hover:bg-amber-50 text-amber-700"
                                                    >
                                                        {isReviewsAutoPlay ? (
                                                            <><Pause className="h-4 w-4 mr-2" /> Pause</>
                                                        ) : (
                                                            <><Play className="h-4 w-4 mr-2" /> Auto Play</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-8">
                                            {/* Reviews Slider */}
                                            <div className="relative">
                                                <div className="overflow-hidden rounded-2xl">
                                                    <div
                                                        className="flex transition-transform duration-500 ease-in-out"
                                                        style={{ transform: `translateX(-${currentReviewIndex * 100}%)` }}
                                                    >
                                                        {service.service_reviews.map((review, index) => (
                                                            <div key={review._id} className="w-full flex-shrink-0 px-2">
                                                                <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-2xl p-6 lg:p-8 border border-slate-100 relative min-h-[200px] shadow-sm hover:shadow-md transition-shadow">
                                                                    <Quote className="absolute top-4 right-4 h-8 w-8 text-slate-200" />

                                                                    <div className="flex flex-col sm:flex-row items-start gap-4">
                                                                        <Avatar className="h-14 w-14 border-3 border-white shadow-lg flex-shrink-0">
                                                                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg">
                                                                                P{index + 1}
                                                                            </AvatarFallback>
                                                                        </Avatar>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="flex">{renderStars(review.review_ratings)}</div>
                                                                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                                                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></div>
                                                                                        {review.review_status}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                                                    <Calendar className="h-4 w-4" />
                                                                                    <time className="font-medium">
                                                                                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                                                                                            year: "numeric",
                                                                                            month: "short",
                                                                                            day: "numeric",
                                                                                        })}
                                                                                    </time>
                                                                                </div>
                                                                            </div>

                                                                            <blockquote className="text-slate-700 text-base lg:text-lg leading-relaxed">
                                                                                "{review.review_message}"
                                                                            </blockquote>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Navigation Buttons */}
                                                {service.service_reviews.length > 1 && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={prevReview}
                                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl rounded-full w-12 h-12 p-0 hover:scale-110 transition-all"
                                                        >
                                                            <ChevronLeft className="h-5 w-5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={nextReview}
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm border-white/30 shadow-lg hover:shadow-xl rounded-full w-12 h-12 p-0 hover:scale-110 transition-all"
                                                        >
                                                            <ChevronRight className="h-5 w-5" />
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Dots Indicator */}
                                                {service.service_reviews.length > 1 && (
                                                    <div className="flex justify-center gap-2 mt-8">
                                                        {service.service_reviews.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => setCurrentReviewIndex(index)}
                                                                className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentReviewIndex
                                                                        ? "bg-blue-600 scale-125 shadow-md"
                                                                        : "bg-slate-300 hover:bg-slate-400"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Treatment Benefits Section */}
                <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white/50 backdrop-blur-sm">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Our Treatment?</h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Experience the difference with our comprehensive approach to healing
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <Card className="shadow-sm border-0 bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-2xl transition-all duration-300 group">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <CheckCircle className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-emerald-800 mb-4">What We Treat</h3>
                                <ul className="space-y-2 text-emerald-700">
                                    <li>• Cervical spine misalignment</li>
                                    <li>• Muscle tension and spasms</li>
                                    <li>• Herniated discs in the neck</li>
                                    <li>• Whiplash injuries</li>
                                    <li>• Postural neck pain</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-2xl transition-all duration-300 group">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Target className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-blue-800 mb-4">Expected Results</h3>
                                <p className="text-blue-700">
                                    Most patients experience significant improvement within 3-5 sessions, with complete recovery typically
                                    achieved within the recommended treatment period.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-0 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-300 group md:col-span-2 lg:col-span-1">
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <Award className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-purple-800 mb-4">Expert Care</h3>
                                <p className="text-purple-700">
                                    Our certified specialists use advanced techniques and personalized treatment plans to ensure optimal
                                    recovery outcomes.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Service Description Section - Moved to End */}
                <section className="px-4 sm:px-6 lg:px-8 py-16">
                    <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                            <CardTitle className="text-3xl text-gray-900 flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center">
                                    <Target className="h-6 w-6 text-white" />
                                </div>
                                Complete Treatment Guide
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 lg:p-12">
                            <div className="prose prose-lg max-w-none">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Neck Pain: Comprehensive Insights from Dr. Rajneesh Kant
                                </h3>
                                <div
                                    className="text-gray-700 leading-relaxed space-y-6 text-lg"
                                    dangerouslySetInnerHTML={{ __html: service.service_desc }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Contact Section */}
                <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="text-center text-white">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Start Your Healing Journey?</h2>
                        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                            Don't let pain hold you back. Book your consultation today and take the first step towards recovery.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                size="lg"
                                className="bg-white text-blue-600 hover:bg-gray-100 font-bold shadow-sm hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                            >
                                <Calendar className="mr-2 h-5 w-5" />
                                Book Appointment Now
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-bold"
                            >
                                <Phone className="mr-2 h-5 w-5" />
                                Call: +91-9876543210
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Treatments
