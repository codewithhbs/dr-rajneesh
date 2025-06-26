import Bookings from '@/pages/bookings/bookings'
import { notFound } from 'next/navigation'
import React from 'react'

export default  async function Page  ({ searchParams })  {
    const newSearchParams = await searchParams;
    if(!newSearchParams){
        return notFound()
    }

    return <Bookings searchParams={JSON.stringify(newSearchParams)} />
}

