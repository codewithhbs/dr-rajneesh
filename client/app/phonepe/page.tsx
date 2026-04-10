import PhonePeCallbackPage from '@/components/phonepe/phonepe'
import React, { Suspense } from 'react'

const page = () => {
  return (
      <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PhonePeCallbackPage/>
    </Suspense>
  )
}

export default page