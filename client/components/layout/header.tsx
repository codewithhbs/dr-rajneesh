"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, X, Phone, Mail, Facebook, Instagram, Youtube, LogOut, HelpCircle, LayoutDashboard, User, PhoneCall } from "lucide-react"

import Image from "next/image"
import { logo } from "@/constant/Images"
import { useAuth } from "@/context/authContext/auth"
import { useService } from "@/hooks/use-service"
import Notification from "../Notifications/Notification"

const phoneNumbers = [
    "+91-9308511357",
]

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [showNotification, setShowNotification] = useState(true)
    const pathname = usePathname()
    const { services } = useService()
    const { isAuthenticated, setToken } = useAuth()

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMenuOpen(false)
    }, [pathname])

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isMenuOpen])

    const handleLogout = () => {
        setToken('')
        window.location.reload()
    }

    const navigationItems = [
        { href: "/", label: "Home" },
        { href: "/pages/about", label: "About" },
        {
            href: "/treatments",
            label: "Treatments",
            submenu: services
        },
        { href: "/pages/contact", label: "Contact" },
        { href: "/pages/gallery", label: "Gallery" },
    ]

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

    return (
        <>
            {/* Fixed Header Container */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <Notification onClose={() => setShowNotification(false)} />
                
                <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
                <header className={cn(
                    "transition-all duration-300 ease-in-out",
                    isScrolled ? "bg-white/95 backdrop-blur-lg shadow-lg" : "bg-white/90 backdrop-blur-md"
                )}>
                    {/* Top Header - Hidden on scroll and mobile */}
                    <div className={cn(
                        "bg-blue-900 text-white transition-all duration-300 ease-in-out overflow-hidden",
                        isScrolled ? "h-0 py-0" : "h-auto py-2",
                        "hidden md:block"
                    )}>
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                        <div className="flex flex-wrap gap-2">
                                            {phoneNumbers.map((phone, index) => (
                                                <span key={index} className="hover:text-blue-200 cursor-pointer transition-colors">
                                                    {phone}
                                                    {index < phoneNumbers.length - 1 && <span className="ml-1">|</span>}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 flex-shrink-0" />
                                        <span>drrajneeshkant.com</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link href="https://www.facebook.com/backtonaturespineclinicbydrrajneeshkant/" className="hover:text-blue-200 transition-colors">
                                        <Facebook className="h-4 w-4" />
                                    </Link>
                                    <Link href="https://api.whatsapp.com/send?phone=91-9031554875" className="hover:text-blue-200 transition-colors">
                                        <PhoneCall className="h-4 w-4" />
                                    </Link>
                                    <Link href="https://www.instagram.com/backtonaturespineclinic/" className="hover:text-blue-200 transition-colors">
                                        <Instagram className="h-4 w-4" />
                                    </Link>
                                    <Link href="https://www.youtube.com/@drrajneeshkant" className="hover:text-blue-200 transition-colors">
                                        <Youtube className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Header */}
                    <div className="border-b border-gray-100/50">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className={cn(
                                "flex justify-between items-center transition-all duration-300",
                                isScrolled ? "h-16" : "h-20"
                            )}>
                                {/* Logo */}
                                <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                                    <div className="bg-gradient-to-r text-white p-2 sm:p-3 rounded-xl">
                                        <Image 
                                            src={logo} 
                                            alt="logo" 
                                            width={isScrolled ? 40 : 50} 
                                            height={isScrolled ? 40 : 50}
                                            className="transition-all duration-300"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className={cn(
                                            "font-bold bg-gradient-to-r from-blue-600 to-gray-900 bg-clip-text text-transparent transition-all duration-300",
                                            isScrolled ? "text-lg sm:text-md" : "text-sm sm:text-2xl"
                                        )}>
                                            Dr. Rajneesh Kant
                                        </h1>
                                        <p className={cn(
                                            "text-gray-600 font-medium transition-all duration-300 hidden sm:block",
                                            isScrolled ? "text-xs" : "text-xs md:text-sm"
                                        )}>
                                            Physiotherapy & Chiropractic Care
                                        </p>
                                    </div>
                                </Link>

                                {/* Desktop Navigation */}
                                <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
                                    {navigationItems.map((item) => (
                                        <div key={item.href} className="relative group">
                                            {item.submenu ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className={cn(
                                                            "text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-50 rounded-lg whitespace-nowrap",
                                                            pathname === item.href && "text-blue-600 bg-blue-50"
                                                        )}>
                                                            {item.label}
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="w-64 mt-2">
                                                        <DropdownMenuLabel>Our Treatments</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {item.submenu.map((treatment, index) => (
                                                            <DropdownMenuItem key={index} asChild>
                                                                <Link href={`/treatments/${treatment?.service_name.toLowerCase().replace(/\s+/g, '-')}`}>
                                                                    {treatment?.service_name}
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-50 rounded-lg whitespace-nowrap",
                                                        pathname === item.href && "text-blue-600 bg-blue-50"
                                                    )}
                                                >
                                                    {item.label}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </nav>

                                {/* Auth Buttons - Desktop */}
                                <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
                                    {isAuthenticated ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="font-semibold text-gray-800 hover:text-blue-600 transition duration-200"
                                                >
                                                    Profile
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-52 rounded-xl shadow-xl bg-white border border-gray-100 p-2 mt-2">
                                                <DropdownMenuLabel className="text-gray-500 px-2 py-1 text-sm">My Account</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild className="hover:bg-blue-50 rounded-md px-3 py-2 cursor-pointer transition">
                                                    <Link href="/profile" className="flex items-center gap-2">
                                                        <LayoutDashboard size={16} className="text-blue-600" />
                                                        Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild className="hover:bg-blue-50 rounded-md px-3 py-2 cursor-pointer transition">
                                                    <Link href="/pages/contact" className="flex items-center gap-2">
                                                        <HelpCircle size={16} className="text-green-600" />
                                                        Get Help
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={handleLogout}
                                                    className="hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md px-3 py-2 flex items-center gap-2 transition cursor-pointer"
                                                >
                                                    <LogOut size={16} />
                                                    Logout
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        <Button variant="ghost" className="font-semibold text-gray-700 hover:text-blue-600">
                                            <Link href="/login">Login</Link>
                                        </Button>
                                    )}

                                    <Link href="/book-now-consultation" passHref>
                                        <Button
                                            className={cn(
                                                "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap",
                                                isScrolled ? "px-4 py-2 text-sm" : "px-6 py-3 text-sm xl:text-base"
                                            )}
                                        >
                                            <span className="hidden xl:inline">Book Now Consultation</span>
                                            <span className="xl:hidden">Book Now</span>
                                        </Button>
                                    </Link>
                                </div>

                                {/* Mobile Menu Button */}
                                <div className="lg:hidden flex items-center gap-2">
                                    <Link href="/book-now-consultation" passHref className="sm:hidden">
                                        <Button
                                            size="sm"
                                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-xs px-3 py-2"
                                        >
                                            Book
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleMenu}
                                        className="p-2"
                                        aria-label="Toggle menu"
                                    >
                                        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Menu */}
                        <div className={cn(
                            "lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-t shadow-lg transition-all duration-300 ease-in-out",
                            isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
                        )}>
                            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
                                <div className="px-4 py-4 space-y-4">
                                    {/* Social Links - Mobile Only */}
                                    <div className="flex items-center justify-center gap-4 pb-4 border-b border-gray-200 sm:hidden">
                                        <Link href="https://www.facebook.com/backtonaturespineclinicbydrrajneeshkant/" className="p-2 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors">
                                            <Facebook className="h-5 w-5 text-blue-600" />
                                        </Link>
                                        <Link href="https://api.whatsapp.com/send?phone=91-9031554875" className="p-2 bg-green-50 rounded-full hover:bg-green-100 transition-colors">
                                            <PhoneCall className="h-5 w-5 text-green-600" />
                                        </Link>
                                        <Link href="https://www.instagram.com/backtonaturespineclinic/" className="p-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors">
                                            <Instagram className="h-5 w-5 text-pink-600" />
                                        </Link>
                                        <Link href="https://www.youtube.com/@drrajneeshkant" className="p-2 bg-red-50 rounded-full hover:bg-red-100 transition-colors">
                                            <Youtube className="h-5 w-5 text-red-600" />
                                        </Link>
                                    </div>

                                    <nav className="space-y-2">
                                        {navigationItems.map((item) => (
                                            <div key={item.href}>
                                                {item.submenu ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="w-full text-left px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors">
                                                                {item.label}
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-64 ml-4">
                                                            <DropdownMenuLabel>Our Treatments</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            {item.submenu.map((treatment, index) => (
                                                                <DropdownMenuItem key={index} asChild>
                                                                    <Link
                                                                        href={`/treatments/${treatment?.service_name.toLowerCase().replace(/\s+/g, '-')}`}
                                                                        onClick={() => setIsMenuOpen(false)}
                                                                    >
                                                                        {treatment?.service_name}
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <Link
                                                        href={item.href}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className={cn(
                                                            "block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors",
                                                            pathname === item.href && "text-blue-600 bg-blue-50"
                                                        )}
                                                    >
                                                        {item.label}
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </nav>

                                    {/* Auth Section - Mobile */}
                                    <div className="pt-4 border-t border-gray-200 space-y-3">
                                        {isAuthenticated ? (
                                            <div className="space-y-2">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                                                >
                                                    <LayoutDashboard size={20} className="text-blue-600" />
                                                    Dashboard
                                                </Link>
                                                <Link
                                                    href="/pages/contact"
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                                                >
                                                    <HelpCircle size={20} className="text-green-600" />
                                                    Get Help
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        handleLogout()
                                                        setIsMenuOpen(false)
                                                    }}
                                                    className="flex items-center gap-3 px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors w-full text-left"
                                                >
                                                    <LogOut size={20} />
                                                    Logout
                                                </button>
                                            </div>
                                        ) : (
                                            <Link
                                                href="/login"
                                                onClick={() => setIsMenuOpen(false)}
                                                className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                                            >
                                                Login
                                            </Link>
                                        )}

                                        <Link 
                                            href="/book-now-consultation" 
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block"
                                        >
                                            <Button
                                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                            >
                                                Book Now Consultation
                                            </Button>
                                        </Link>
                                    </div>

                                    {/* Contact Info - Mobile */}
                                    <div className="pt-4 border-t border-gray-200 space-y-3 sm:hidden">
                                        <div className="space-y-2">
                                            {phoneNumbers.map((phone, index) => (
                                                <a
                                                    key={index}
                                                    href={`tel:${phone}`}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    {phone}
                                                </a>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                                            <Mail className="h-4 w-4" />
                                            drrajneeshkant.com
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
                </div>
            </div>

            {/* Spacer to prevent content from hiding behind fixed header */}
            <div className={cn(
                "transition-all duration-300",
                showNotification 
                    ? (isScrolled ? "h-28" : "h-32 md:h-36") 
                    : (isScrolled ? "h-16" : "h-20 md:h-24")
            )} />
        </>
    )
}