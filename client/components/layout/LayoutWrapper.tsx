"use client";

import { usePathname } from "next/navigation";
import { Header } from "./header";
import { Footer } from "./footer";
import axios from "axios";
import PopupModal from "./PopupModal";

const API_ENDPOINT = "https://api.drrajneeshkant.in/api/v1";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideHeader = pathname === "/book-consultation";

  return (
    <>
      <Header />
      <PopupModal/>
      {children}
      <Footer />
    </>
  );
}