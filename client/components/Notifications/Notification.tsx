"use client"
import React, { useState, useEffect, useRef } from 'react'
import { X, Bell } from 'lucide-react'
import { API_ENDPOINT } from '@/constant/url'

interface NotificationData {
    _id: string
    messages: string
    type: string
    status: string
    expiredThis: Date
}

const Notification = ({ onClose }) => {
    const [isVisible, setIsVisible] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const [notificationData, setNotificationData] = useState<NotificationData[]>([])
    const scrollRef = useRef(null)

    const handleClose = () => {
        setIsVisible(false)
        if (onClose) onClose()
    }

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API_ENDPOINT}/get-notifications`)
            if (!response.ok) {
                throw new Error('Failed to fetch notifications')
            }
            const data = await response.json()
            const filterData = data.data.filter((item: NotificationData) => {
                return item.status === 'active'
            })
            setNotificationData(filterData)


        } catch (error) {
            console.error('Error fetching notifications:', error)

            setNotificationData([
                {
                    _id: 1,
                    text: "🎉 New patients get 20% off on first consultation - Book your appointment today!",
                    type: "offer"
                },
                {
                    _id: 2,
                    text: "📞 24/7 Emergency spine care available - Call +91-9308511357 now",
                    type: "emergency"
                },

            ])

        }
    }
    useEffect(() => {
        fetchNotifications()
    }, [])


    const handleMouseEnter = () => {
        setIsPaused(true)
        if (scrollRef.current) {
            scrollRef.current.style.animationPlayState = 'paused'
        }
    }

    const handleMouseLeave = () => {
        setIsPaused(false)
        if (scrollRef.current) {
            scrollRef.current.style.animationPlayState = 'running'
        }
    }

    useEffect(() => {

        const timer = setTimeout(() => {

        }, 45000)

        return () => clearTimeout(timer)
    }, [])

    if (!isVisible) return null

    return (
        <div className="relative w-full bg-gradient-to-r from-blue-400 via-blue-700 to-blue-400 text-white shadow-lg overflow-hidden border-b-2 border-blue-400/30">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
            <div className="absolute inset-0 opacity-50">
                <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
            </div>

            {/* Main Content */}
            <div className="relative flex items-center h-12 sm:h-14">
                {/* Enhanced Bell Icon with Pulse */}
                <div className="flex-shrink-0 px-4 sm:px-6 flex items-center">
                    <div className="relative">
                        <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300 animate-bounce" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"></div>
                    </div>
                    <span className="ml-3 font-bold text-sm sm:text-base text-yellow-300 hidden sm:inline tracking-wide">
                        LIVE UPDATES
                    </span>
                </div>

                {/* Enhanced Scrolling Content */}
                <div
                    className="flex-1 overflow-hidden"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        ref={scrollRef}
                        className="flex items-center space-x-12 sm:space-x-16 animate-scroll-fast"
                    >

                        {[...notificationData, ...notificationData, ...notificationData].map((notification, index) => (
                            <div
                                key={`${notification._id}-${Math.floor(index / notificationData.length)}-${index % notificationData.length}`}
                                className="flex items-center space-x-3 whitespace-nowrap flex-shrink-0 group"
                            >

                                <span className="text-sm sm:text-base font-semibold tracking-wide group-hover:text-yellow-300 transition-colors duration-300">
                                    {notification.messages}
                                </span>
                                {index < notificationData?.length * 3 - 1 && (
                                    <div className="flex items-center space-x-2 mx-6 sm:mx-8">
                                        <div className="w-2 h-2 bg-yellow-300 rounded-full opacity-60"></div>
                                        <div className="w-1 h-1 bg-white rounded-full opacity-40"></div>
                                        <div className="w-2 h-2 bg-yellow-300 rounded-full opacity-60"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Enhanced Close Button */}
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 mx-4 sm:mx-6 p-2 hover:bg-white/15 rounded-full transition-all duration-300 group border border-white/20 hover:border-white/40"
                    aria-label="Close notification"
                >
                    <X className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-180 group-hover:scale-110 transition-all duration-300" />
                </button>
            </div>




            {/* Custom Enhanced CSS */}
            <style jsx>{`
                @keyframes scroll-fast {
                    0% {
                        transform: translateX(100%);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }

                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                @keyframes flow {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }

                @keyframes pulse-slow {
                    0%, 100% {
                        opacity: 0.4;
                    }
                    50% {
                        opacity: 0.8;
                    }
                }

                .animate-scroll-fast {
                    animation: scroll-fast 35s linear infinite;
                }

                .animate-shimmer {
                    animation: shimmer 3s ease-in-out infinite;
                }

                .animate-flow {
                    animation: flow 2s linear infinite;
                }

                .animate-pulse-slow {
                    animation: pulse-slow 2s ease-in-out infinite;
                }

                @media (max-width: 640px) {
                    .animate-scroll-fast {
                        animation: scroll-fast 25s linear infinite;
                    }
                }

                /* Ensure smooth continuation on hover */
                .animate-scroll-fast:hover {
                    animation-play-state: paused;
                }

                /* Additional glow effects */
                .notification-glow {
                    box-shadow: 
                        0 4px 20px rgba(59, 130, 246, 0.3),
                        0 0 40px rgba(59, 130, 246, 0.1);
                }

                /* Smooth gradient background */
                .bg-gradient-enhanced {
                    background: linear-gradient(135deg, 
                        #2563eb 0%, 
                        #3b82f6 25%, 
                        #1d4ed8 50%, 
                        #3b82f6 75%, 
                        #2563eb 100%);
                    background-size: 300% 300%;
                    animation: gradient-shift 6s ease infinite;
                }

                @keyframes gradient-shift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
            `}</style>
        </div>
    )
}

export default Notification