import { Loader2, Heart, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface LoadingProps {
    message?: string;
    className?: string;
}

const Loading: React.FC<LoadingProps> = ({
    message = "Loading...",
    className,
}) => {
    return (
        <div className={cn("flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4", className)}>
            <Card className="w-full max-w-md bg-white shadow-2xl border-0 rounded-3xl overflow-hidden">
                <CardContent className="flex flex-col items-center justify-center gap-6 p-10 text-center relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    
                    {/* Medical icon with pulse animation */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-30"></div>
                        <div className="relative bg-blue-500 p-4 rounded-full">
                            <Stethoscope className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    
                    {/* Header */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-center gap-2">
                            <Heart className="w-5 h-5 text-blue-500 animate-pulse" />
                            <h2 className="text-2xl font-bold text-slate-800">
                                Healing Beyond
                            </h2>
                        </div>
                        <p className="text-blue-600 font-medium text-sm tracking-wide">
                            CHIROPRACTIC CARE
                        </p>
                    </div>
                    
                    {/* Loading spinner */}
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <span className="text-slate-600 font-medium">{message}</span>
                    </div>
                    
                    {/* Loading dots animation */}
                    <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    </div>
                    
                    {/* Trusted care badge */}
                    <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                        <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            India's Most Trusted Chiropractic Care
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Loading;