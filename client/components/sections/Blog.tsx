"use client"
import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, Heart, User, ArrowRight, Mail, BookOpen, Search } from 'lucide-react'

const Blogs = () => {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    // Sample blog data - you can set this to empty array to test no blogs condition
    const blogs = [
        {
            id: 1,
            title: "Understanding Spinal Alignment and Its Impact on Overall Health",
            excerpt: "Learn how proper spinal alignment can improve your quality of life and prevent chronic pain conditions. Discover the science behind postural health and its long-term benefits.",
            image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            date: "June 10, 2024",
            readTime: "5 min read",
            category: "Spine Health",
            likes: 124,
            author: "Dr. Rajneesh Kant"
        },
        {
            id: 2,
            title: "The Connection Between Physiotherapy and Athletic Performance",
            excerpt: "Discover how professional athletes benefit from regular physiotherapy sessions to enhance performance and recovery through targeted treatments and specialized techniques.",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            date: "May 25, 2024",
            readTime: "7 min read",
            category: "Sports Rehabilitation",
            likes: 98,
            author: "Dr. Rajneesh Kant"
        },
        {
            id: 3,
            title: "Common Myths About Chiropractic Care Debunked",
            excerpt: "We address the most common misconceptions about chiropractic treatments and explain the science behind evidence-based practice in modern healthcare.",
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            date: "April 18, 2024",
            readTime: "6 min read",
            category: "Chiropractic Care",
            likes: 156,
            author: "Dr. Rajneesh Kant"
        },
        {
            id: 4,
            title: "Ergonomic Tips for Work-From-Home Professionals",
            excerpt: "Simple adjustments to your home office setup that can prevent back pain and improve productivity while maintaining proper posture throughout the day.",
            image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            date: "March 30, 2024",
            readTime: "4 min read",
            category: "Ergonomics",
            likes: 87,
            author: "Dr. Rajneesh Kant"
        },
        {
            id: 5,
            title: "Managing Chronic Pain Through Natural Methods",
            excerpt: "Explore holistic approaches to chronic pain management that focus on natural healing and long-term relief strategies for better quality of life.",
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            date: "February 15, 2024",
            readTime: "8 min read",
            category: "Pain Management",
            likes: 203,
            author: "Dr. Rajneesh Kant"
        },
        {
            id: 6,
            title: "The Importance of Regular Exercise in Rehabilitation",
            excerpt: "Understanding how structured exercise programs accelerate recovery and prevent future injuries in rehabilitation patients through scientific approaches.",
            image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            date: "January 20, 2024",
            readTime: "6 min read",
            category: "Rehabilitation",
            likes: 142,
            author: "Dr. Rajneesh Kant"
        }
    ]

    // Filter blogs based on search and category
    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const categories = ['All', ...new Set(blogs.map(blog => blog.category))]
    const featuredBlogs = filteredBlogs.slice(0, 3)

    // Responsive blogs per slide
    const [blogsPerSlide, setBlogsPerSlide] = useState(3)

    useEffect(() => {
        const updateBlogsPerSlide = () => {
            if (window.innerWidth < 768) {
                setBlogsPerSlide(1)
            } else if (window.innerWidth < 1024) {
                setBlogsPerSlide(2)
            } else {
                setBlogsPerSlide(3)
            }
        }

        updateBlogsPerSlide()
        window.addEventListener('resize', updateBlogsPerSlide)
        return () => window.removeEventListener('resize', updateBlogsPerSlide)
    }, [])

    const totalSlides = Math.ceil(filteredBlogs.length / blogsPerSlide)

    // Reset slide when filters change
    useEffect(() => {
        setCurrentSlide(0)
    }, [searchTerm, selectedCategory, blogsPerSlide])

    const nextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1)
        }
    }

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1)
        }
    }

    const getCurrentBlogs = () => {
        const start = currentSlide * blogsPerSlide
        return filteredBlogs.slice(start, start + blogsPerSlide)
    }

    // No blogs condition
    if (blogs.length === 0) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <div className="text-center py-20 px-4">
                    <div className="w-24 h-24 mx-auto mb-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">No Blogs Available</h2>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                        We're working on creating amazing content for you. Please check back soon for our latest health and wellness insights.
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Subscribe for Updates
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 sm:py-16 lg:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                            Health & Wellness
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Insights</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed px-4">
                            Expert insights, tips, and advice on chiropractic care, physiotherapy, and overall wellness from our healthcare professionals
                        </p>
                        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                <span>Latest Research</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Expert Tips</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-3 py-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>Patient Stories</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>





            {/* All Articles with Horizontal Slider */}
            {filteredBlogs.length > 0 && (
                <div className="py-12 sm:py-16 bg-gray-50">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">All Articles</h2>
                                <p className="text-gray-600">
                                    Browse our complete collection of health and wellness articles
                                </p>
                            </div>
                            {totalSlides > 1 && (
                                <div className="flex gap-2 justify-center sm:justify-end">
                                    <button
                                        onClick={prevSlide}
                                        className={`p-3 rounded-full bg-white border border-gray-200 transition-all ${currentSlide === 0
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-gray-50 hover:shadow-md'
                                            }`}
                                        disabled={currentSlide === 0}
                                    >
                                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className={`p-3 rounded-full bg-white border border-gray-200 transition-all ${currentSlide === totalSlides - 1
                                                ? 'opacity-50 cursor-not-allowed'
                                                : 'hover:bg-gray-50 hover:shadow-md'
                                            }`}
                                        disabled={currentSlide === totalSlides - 1}
                                    >
                                        <ChevronRight className="h-5 w-5 text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden">
                            <div
                                className={`grid gap-6 transition-transform duration-500 ease-in-out ${blogsPerSlide === 1 ? 'grid-cols-1' :
                                        blogsPerSlide === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                                    }`}
                            >
                                {getCurrentBlogs().map((blog) => (
                                    <div key={blog.id} className="group cursor-pointer">
                                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                            <div className="relative h-48 sm:h-56">
                                                <img
                                                    src={blog.image}
                                                    alt={blog.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-4 right-4">
                                                    <span className="bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                                                        {blog.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-4 sm:p-6">
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                                                    {blog.title}
                                                </h3>
                                                <p className="text-gray-600 mb-4 text-sm sm:text-base leading-relaxed line-clamp-3">{blog.excerpt}</p>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-gray-500 mb-4">
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4 flex-shrink-0" />
                                                            <span>{blog.date}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-4 w-4 flex-shrink-0" />
                                                            <span>{blog.readTime}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Heart className="h-4 w-4 text-red-500 flex-shrink-0" />
                                                        <span>{blog.likes}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <span className="text-sm text-gray-600 truncate">{blog.author}</span>
                                                    </div>
                                                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 group/btn flex-shrink-0">
                                                        Read More
                                                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Slide Indicators */}
                        {totalSlides > 1 && (
                            <div className="flex justify-center mt-8 gap-2">
                                {Array.from({ length: totalSlides }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`w-3 h-3 rounded-full transition-all ${currentSlide === index
                                                ? 'bg-blue-600 shadow-lg shadow-blue-600/25'
                                                : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Newsletter Section */}
            <div className="py-12 sm:py-16 bg-gradient-to-br from-blue-600 to-purple-600">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="w-16 h-16 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                            <Mail className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                            Stay Updated with Health Insights
                        </h2>
                        <p className="text-blue-100 mb-8 text-lg px-4">
                            Get the latest articles and health tips delivered directly to your inbox
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 rounded-lg border-1 text-white placeholder-white bg-transparent focus:ring-2 focus:ring-white/50 focus:outline-none"
                            />

                            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Blogs