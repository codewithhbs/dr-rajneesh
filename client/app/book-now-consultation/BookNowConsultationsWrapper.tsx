// page_/book-now-consultation/BookNowConsultationsWrapper.tsx
"use client";

import BookNowConsultations from "@/page_/book-now-consultation/BookNowConsulattions";
import { useSearchParams } from "next/navigation";

const BookNowConsultationsWrapper = () => {
  const searchParams = useSearchParams();
  return <BookNowConsultations searchParams={searchParams} />;
};

export default BookNowConsultationsWrapper;
