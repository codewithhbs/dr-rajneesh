import Bookings from '@/pages/bookings/bookings'
import { notFound } from 'next/navigation'
import React from 'react'

interface PageProps {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

export default function Page({ searchParams }: PageProps) {
  if (!searchParams) {
    return notFound();
  }

  return <Bookings searchParams={JSON.stringify(searchParams)} />;
}
