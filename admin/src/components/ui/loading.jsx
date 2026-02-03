import { Loader2 } from 'lucide-react'
import React from 'react'

const Loading = ({ message = "Loading data..." }) => {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>{message}</span>
            </div>
        </div>
    )
}

export default Loading