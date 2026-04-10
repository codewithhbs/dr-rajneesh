import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/authContext/auth";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </AuthProvider>

        <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      </body>
    </html>
  );
}