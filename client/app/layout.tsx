
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
// import { AuthProvider } from "@/context/authContext/auth";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/authContext/auth";



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body >
        <AuthProvider>
          <Header />

          {children}
          <Footer />
          <Toaster />
        </AuthProvider>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}