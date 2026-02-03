import Link from "next/link"
import { MapPin, Phone, Mail, Heart, Star, Facebook, Instagram, Youtube, } from "lucide-react"
import Image from "next/image"
import { logo } from "@/constant/Images"

export function Footer() {
  return (
    <footer className="bg-gray-100 footer-p">
      {/* Main footer content */}
      <div className="px-4 md:px-8 lg:px-12 py-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: About */}
            <div>
              <div className="flex items-center gap-2 mb-4">

                <div className="bg-gradient-to-r  text-white p-3 rounded-xl ">
                  <Image src={logo} alt="logo" width={50} height={50} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1e7fd0] text-xl">Dr. Rajneesh Kant</h3>
                  <p className="text-sm text-gray-600">Physiotherapist | Osteopath | Chiropractor</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Revolutionary chiropractic treatments combined with cutting-edge physiotherapy techniques. Transform
                your life with our personalized healing approach.
              </p>
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
                <Heart className="h-4 w-4 text-blue-600" />
                <span>{`India's Most Trusted Chiropractic Care`}</span>
              </div>

              {/* Social Media Links */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Follow Us</h4>
                <div className="flex space-x-3">
                  <a
                    href="https://www.facebook.com/backtonaturespineclinicbydrrajneeshkant/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1e7fd0] text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a
                    href="https://api.whatsapp.com/send?phone=91-9031554875"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1e7fd0] text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    aria-label="Twitter"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.instagram.com/backtonaturespineclinic/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1e7fd0] text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/@drrajneeshkant"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1e7fd0] text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    aria-label="YouTube"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>

                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/pages/about" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/pages/treatments" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Treatments
                  </Link>
                </li>
                <li>
                  <Link href="/pages/blogs" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/pages/contact" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/shop" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Shop
                  </Link>
                </li>
              </ul>

              {/* Legal Links */}
              <h3 className="font-bold text-lg mt-6 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/pages/policy/privacy-policy" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pages/policy/terms-conditions" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/pages/policy/refund-policy" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/pages/policy/disclaimer" className="text-gray-600 hover:text-[#1e7fd0] transition-colors">
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Our Clinics */}
            <div>
              <h3 className="font-bold text-lg mb-4">Our Clinics</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-[#1e7fd0] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Mumbai Clinic</h4>
                    <p className="text-sm text-gray-600">
                      Aston Building, 704, opposite Bank of Baroda, Above Mercedes Benz showroom, Lokhandwala Complex, Andheri West, Mumbai,
                      Maharashtra 400053
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-5 w-5 text-[#1e7fd0] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Patna Clinic</h4>
                    <p className="text-sm text-gray-600">
                      Central jail, Near Kuswaha chock, beside of, SK Vihar Colony, Kisan Colony, Beur, Patna, Bihar
                      800002
                    </p>
                  </div>
                </div>
               
              </div>
            </div>

            {/* Column 4: Statistics & Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-[#1e7fd0] text-2xl font-bold">5+</div>
                  <div className="text-sm text-gray-600">Years Experience</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-green-600 text-2xl font-bold">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-yellow-600 text-2xl font-bold">50K+</div>
                  <div className="text-sm text-gray-600">50,000 Patients</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-purple-600 text-2xl font-bold">3</div>
                  <div className="text-sm text-gray-600">Clinic Locations</div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/book-now-consultation"
                  className="bg-[#1e7fd0] text-white py-2 px-4 rounded-md inline-block hover:bg-blue-700 transition-colors"
                >
                  Book Appointment
                </Link>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#1e7fd0]" />
                  <span className="text-gray-600">+91-9308511357, 9308511357</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-[#1e7fd0]" />
                  <span className="text-gray-600">info@drrajneeshkant.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-600 text-center md:text-left">
                &copy; {new Date().getFullYear()} Dr. Rajneesh Kant Physiotherapy & Chiropractic Clinic. All rights
                reserved.
              </p>
              <p className="text-sm text-gray-600 text-center md:text-right mt-2 md:mt-0">
                Designed and managed by{" "}
                <a
                  href="https://hoverbusinessservices.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Hover Business Service
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
