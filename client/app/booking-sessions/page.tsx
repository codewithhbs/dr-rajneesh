import Bookings from '@/page_/bookings/bookings'
import { notFound } from 'next/navigation'
import React from 'react'

interface PageProps {
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  
  if (!params) {
    return notFound();
  }

  return <Bookings searchParams={JSON.stringify(params)} />;
}