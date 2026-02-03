// app/book-now-consultation/page.tsx
import React, { Suspense } from "react";
import Loading from "@/components/ui/Loading";
import BookNowConsultationsWrapper from "./BookNowConsultationsWrapper";

const Page = () => {
  return (
    <Suspense fallback={<Loading />}>
      <BookNowConsultationsWrapper />
    </Suspense>
  );
};

export default Page;
