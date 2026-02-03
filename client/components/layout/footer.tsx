import Link from "next/link"
import { MapPin, Phone, Mail, Heart, Star, Facebook, Instagram, Youtube } from "lucide-react"
import Image from "next/image"
import { logo } from "@/constant/Images"

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-r from-blue-50 via-white to-blue-50 border-t border-gray-200">
      <div className="px-6 md:px-12 lg:px-20 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image
                src={logo}
                alt="logo"
                width={55}
                height={55}
                className="rounded-lg shadow-lg ring-2 ring-blue-100"
              />
              <div>
                <h3 className="font-bold text-[#1e7fd0] text-xl">Dr. Rajneesh Kant</h3>
                <p className="text-sm text-gray-600">Physiotherapist | Osteopath | Chiropractor</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              Revolutionary chiropractic treatments combined with advanced physiotherapy
              techniques. Transform your life with our personalized healing approach.
            </p>
            <div className="flex items-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#1e7fd0]">
              <Heart className="h-4 w-4" />
              India&apos;s Most Trusted Chiropractic Care
            </div>

            {/* Social Media */}
            <div className="mt-8">
              <h4 className="font-semibold text-gray-800 mb-3">Follow Us</h4>
              <div className="flex space-x-3">
                {[
                  {
                    href: "https://www.facebook.com/backtonaturespineclinicbydrrajneeshkant/",
                    icon: <Facebook className="h-5 w-5" />,
                  },
                  {
                    href: "https://api.whatsapp.com/send?phone=91-9031554875",
                    icon: <Phone className="h-5 w-5" />,
                  },
                  {
                    href: "https://www.instagram.com/backtonaturespineclinic/",
                    icon: <Instagram className="h-5 w-5" />,
                  },
                  {
                    href: "https://www.youtube.com/@drrajneeshkant",
                    icon: <Youtube className="h-5 w-5" />,
                  },
                ].map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1e7fd0] text-white p-3 rounded-full hover:bg-blue-600 transition-all shadow-md hover:scale-110"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { name: "Home", link: "/" },
                { name: "About", link: "/pages/about" },
                { name: "Treatments", link: "/pages/treatments" },
                { name: "Blog", link: "/pages/blogs" },
                { name: "Contact", link: "/pages/contact" },
                { name: "Shop", link: "/shop" },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.link}
                    className="text-gray-600 hover:text-[#1e7fd0] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-gray-800 text-lg mt-8 mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              {[
                { name: "Privacy Policy", link: "/pages/policy/privacy-policy" },
                { name: "Terms & Conditions", link: "/pages/policy/terms-conditions" },
                { name: "Refund Policy", link: "/pages/policy/refund-policy" },
                { name: "Disclaimer", link: "/pages/policy/disclaimer" },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.link}
                    className="text-gray-600 hover:text-[#1e7fd0] transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Clinics */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Our Clinics</h3>
            <div className="space-y-6 text-sm">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-[#1e7fd0] flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Mumbai Clinic</h4>
                  <p className="text-gray-600">
                    Aston Building, Lokhandwala Complex, Andheri West, Mumbai, Maharashtra 400053
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-[#1e7fd0] flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Patna Clinic</h4>
                  <p className="text-gray-600">
                    Near Kuswaha Chock, SK Vihar Colony, Beur, Patna, Bihar 800002
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 4: Stats + Contact */}
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "9+", label: "Years Experience", color: "bg-blue-50 text-blue-600" },
                { value: "98%", label: "Success Rate", color: "bg-green-50 text-green-600" },
                { value: "50K+", label: "Happy Patients", color: "bg-yellow-50 text-yellow-600" },
                { value: "2", label: "Clinic Locations", color: "bg-purple-50 text-purple-600" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl text-center shadow-sm hover:shadow-md transition-transform hover:scale-105 ${stat.color}`}
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link
                href="/book-now-consultation"
                className="bg-[#1e7fd0] text-white py-2 px-5 rounded-lg inline-block hover:bg-blue-600 transition-all shadow-lg hover:scale-105"
              >
                Book Appointment
              </Link>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#1e7fd0]" />
                <span className="text-gray-600">+91-9308511357, 9308511357</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#1e7fd0]" />
                <span className="text-gray-600">info@drrajneeshkant.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-12 pt-6 text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center">
          <p>
            &copy; {new Date().getFullYear()} Dr. Rajneesh Kant Physiotherapy & Chiropractic Clinic. All
            rights reserved.
          </p>
          <p className="mt-3 md:mt-0">
            Designed by{" "}
            <a
              href="https://hoverbusinessservices.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1e7fd0] hover:underline"
            >
              Hover Business Service
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
