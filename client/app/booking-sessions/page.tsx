import Bookings from '@/pages/bookings/bookings'
import React from 'react'

const Page = ({ searchParams }) => {

    return <Bookings searchParams={JSON.stringify(searchParams)} />
}

export default Page