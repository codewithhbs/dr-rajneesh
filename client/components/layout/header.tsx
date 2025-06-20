"use client"
import { useState } from "react"
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
import { Menu, X, Phone, Mail, Facebook, Twitter, Instagram, Youtube, LogOut, HelpCircle, LayoutDashboard, User } from "lucide-react"


import { useMobile } from "@/hooks/use-mobile"
import Image from "next/image"
import { logo } from "@/constant/Images"
import { useAuth } from "@/context/authContext/auth"
import { useService } from "@/hooks/use-service"


const phoneNumbers = [
    "+91-9308511357",
    "+91-8409313131",
    "+91-9031554875"
]

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()
    const { services } = useService()
    const { isAuthenticated, setToken } = useAuth()
    const handleLogout = () => {
        setToken('')
        window.location.reload()
    };

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
        <div className="bg-gradient-to-br headers-p from-blue-50 via-cyan-50 to-teal-50">
            {/* Header */}
            <header className="relative z-50 bg-white/90 backdrop-blur-md">
                {/* Top Header */}
                <div className="bg-blue-900 hidden md:block text-white py-2 px-4">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <div className="flex flex-wrap gap-2">
                                    {phoneNumbers.map((phone, index) => (
                                        <span key={index} className="hover:text-blue-200 cursor-pointer">
                                            {phone}
                                            {index < phoneNumbers.length - 1 && <span className="ml-1">|</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>drrajneeshkant.com</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="#" className="hover:text-blue-200 transition-colors">
                                <Facebook className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="hover:text-blue-200 transition-colors">
                                <Twitter className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="hover:text-blue-200 transition-colors">
                                <Instagram className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="hover:text-blue-200 transition-colors">
                                <Youtube className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Header */}
                <div className="border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-20">
                            {/* Logo */}
                            <Link href="/" className="flex items-center space-x-3">
                                <div className="bg-gradient-to-r  text-white p-3 rounded-xl ">
                                    <Image src={logo} alt="logo" width={50} height={50} />
                                </div>
                                <div>
                                    <h1 className="text-sm md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                        Dr. Rajneesh Kant
                                    </h1>
                                    <p className=" text-xs md:text-sm text-gray-600 font-medium">Physiotherapy & Chiropractic Care</p>
                                </div>
                            </Link>

                            {/* Desktop Navigation */}
                            <nav className="hidden lg:flex items-center space-x-4">
                                {navigationItems.map((item) => (
                                    <div key={item.href} className="relative group">
                                        {item.submenu ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className={cn(
                                                        "text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-50 rounded-lg",
                                                        pathname === item.href && "text-blue-600 bg-blue-50"
                                                    )}>
                                                        {item.label}
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-64">
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
                                                    "text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-blue-50 rounded-lg",
                                                    pathname === item.href && "text-blue-600 bg-blue-50"
                                                )}
                                            >
                                                {item.label}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </nav>

                            {/* Auth Buttons */}

                            <div className="hidden lg:flex items-center space-x-4">
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

                                        <DropdownMenuContent className="w-52 rounded-xl shadow-xl bg-white border border-gray-100 p-2">
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

                                <Link href="/shop/med-store" passHref>
                                    <Button
                                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                                    >
                                        Buy Medicine from Store
                                    </Button>
                                </Link>
                            </div>

                            {/* Mobile Menu Button */}
                            <div className="lg:hidden">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleMenu}
                                    className="p-2"
                                >
                                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="lg:hidden border-t bg-white/95 backdrop-blur-md">
                            <div className="px-4 py-4 space-y-4">
                                <nav className="space-y-2">
                                    {navigationItems.map((item) => (
                                        <div key={item.href}>
                                            {item.submenu ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md">
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
                                                        "block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md",
                                                        pathname === item.href && "text-blue-600 bg-blue-50"
                                                    )}
                                                >
                                                    {item.label}
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </nav>

                                <div className="pt-4 border-t space-y-2">
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

                                            <DropdownMenuContent className="w-52 rounded-xl shadow-xl bg-white border border-gray-100 p-2">
                                                <DropdownMenuLabel className="text-gray-500 px-2 py-1 text-sm">My Account</DropdownMenuLabel>
                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem asChild className="hover:bg-blue-50 rounded-md px-3 py-2 cursor-pointer transition">
                                                    <Link href="/dashboard" className="flex items-center gap-2">
                                                        <LayoutDashboard size={16} className="text-blue-600" />
                                                        Dashboard
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem asChild className="hover:bg-blue-50 rounded-md px-3 py-2 cursor-pointer transition">
                                                    <Link href="/help" className="flex items-center gap-2">
                                                        <HelpCircle size={16} className="text-green-600" />
                                                        Get Help
                                                    </Link>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem asChild className="hover:bg-blue-50 rounded-md px-3 py-2 cursor-pointer transition">
                                                    <Link href="/profile" className="flex items-center gap-2">
                                                        <User size={16} className="text-purple-600" />
                                                        Profile
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
                                </div>

                            </div>
                        </div>
                    )}
                </div>
            </header >

            {/* Hero Section */}

        </div >
    )
}