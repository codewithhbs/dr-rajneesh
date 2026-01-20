import Reschedulebooking from "@/components/BookingDetails/reschedulebooking";

interface ReschedulePageProps {
  params: {
    slug: string;
    id: string;
  };
}

const Page = async ({ params }: ReschedulePageProps) => {
  const { slug, id } = params;

  return (
    <Reschedulebooking
      slug={slug}
      bookingId={id}
    />
  );
};

export default Page;
