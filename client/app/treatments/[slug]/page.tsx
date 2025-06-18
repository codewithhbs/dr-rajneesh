import Treatments from '@/pages/treatments/Treatments'
import React from 'react'

const Page = ({ params }: { params: { slug: string } }) => {

    return <Treatments slug={params?.slug} />
}

export default Page