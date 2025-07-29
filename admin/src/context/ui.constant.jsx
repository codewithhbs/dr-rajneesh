
import {

    Home,

    Calendar,
    Tag,

    Building,

    FileText,

    User2,
    StethoscopeIcon,
    TrafficCone,
} from "lucide-react"
export const ADMIN_WEB_NAME = 'Dr. Rajneesh Kant'


export const menuSections = [
    {
        title: "Dashboard",
        icon: <Home className="h-5 w-5" />,
        singleItem: true,
        to: "/dashboard",
        label: "Overview",
    },

    {
        title: "Bookings",
        icon: <Calendar className="h-5 w-5" />,
        items: [
            { to: "/dashboard/Sessions", label: "Sessions Booking" },
            { to: "/dashboard/medicine-booking", label: "medicine Booking" }
        ],
    },
    {
        title: "Coupons",
        icon: <Tag className="h-5 w-5" />,
        items: [
            { to: "/dashboard/sessions-coupons", label: "Sessions-Coupons" },
            { to: "/dashboard/product-coupons", label: "Product Coupons" }
        ],
    },
    {
        title: "Treatments",
        icon: <TrafficCone className="h-5 w-5" />,
        singleItem: true,
        to: "/dashboard/treatments",
        label: "Treatments",
    },
    {
        title: "Users",
        icon: <User2 className="h-5 w-5" />,
        singleItem: true,
        to: "/dashboard/Users",
        label: "Users",
    },
    {
        title: "Doctor",
        icon: <StethoscopeIcon className="h-5 w-5" />,
        singleItem: true,
        to: "/dashboard/doctor",
        label: "Doctors",
    },

    {
        title: "Clinic",
        icon: <Building className="h-5 w-5" />,
        singleItem: true,
        to: "/dashboard/all-clinic",
        label: "Clinic"

    },
    {
        title: "Blogs",
        icon: <FileText className="h-5 w-5" />,
        items: [
            { to: "/dashboard/all-blogs", label: "All Blogs" },
            { to: "/dashboard/create-blogs", label: "Create Blogs" },
        ],
    },
]