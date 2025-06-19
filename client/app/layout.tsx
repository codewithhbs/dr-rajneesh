
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/context/authContext/auth";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans?.variable} ${geistMono?.variable} antialiased`}
      >
        <AuthProvider>


          <Header />
          {children}
          <Footer />
        </AuthProvider>
         <Script id="payemnt" src="https://checkout.razorpay.com/v1/checkout.js"></Script>
      </body>
     

    </html>
  );
}
