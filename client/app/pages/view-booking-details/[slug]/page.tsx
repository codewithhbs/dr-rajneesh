import BookingDetails from "@/components/BookingDetails/BookingDetails";

import React from "react";

interface ViewBookingPageProps {
  params: { slug: string };
}

const page = ({ params }: ViewBookingPageProps) => {
  return <BookingDetails slug={params.slug} />;
};

export default page;
