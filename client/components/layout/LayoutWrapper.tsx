"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeader = pathname === "/book-now-consultation";

  return (
    <>
      {!hideHeader && <Header />}
      {children}
      <Footer />
    </>
  );
}