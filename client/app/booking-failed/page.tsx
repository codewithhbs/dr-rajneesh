"use client"
import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, Phone, Mail, Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSettings } from '@/hooks/use-settings';

interface PageProps {
    searchParams: Promise<{
        reason?: string;
        [key: string]: string | undefined;
    }>;
}

const Page: React.FC<PageProps> = ({ searchParams }) => {
    const [reason, setReason] = useState<string>('Unknown error occurred');
    const { settings } = useSettings();

    useEffect(() => {
        const getSearchParams = async () => {
            const params = await searchParams;
            setReason(params?.reason || 'Unknown error occurred');
        };
        getSearchParams();
    }, [searchParams]);
    const handleRetry = () => {

        window.history.back();
    };

    const handleContactSupport = () => {
       
        window.location.href =  `mailto:${settings?.contact_details?.support_email}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.8s ease-out;
                }
                
                .animate-bounce-custom {
                    animation: bounce 2s infinite;
                }
            `}</style>

            <div className="max-w-2xl w-full animate-fadeIn">
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 rounded-full animate-shake">
                                    <AlertTriangle className="h-12 w-12 text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-2 animate-bounce-custom">
                                    <span className="text-2xl">😞</span>
                                </div>
                            </div>
                        </div>

                        <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                            Booking Failed
                        </CardTitle>

                        <p className="text-gray-600 text-lg">
                            We&apos;re sorry! Your booking could not be completed at this time.
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Error Reason */}
                        <Alert className="border-red-200 bg-red-50">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800 font-medium">
                                <strong>Reason:</strong> {reason}
                            </AlertDescription>
                        </Alert>

                        {/* Refund Information */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-500 p-3 rounded-full flex-shrink-0">
                                    <RefreshCw className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 text-lg mb-2">
                                        💰 Refund Information
                                    </h3>
                                    <p className="text-blue-800 mb-3">
                                        If any payment has been deducted from your account, don&apos;t worry!
                                        You will receive a full refund within <strong>2-3 working business days</strong>.
                                    </p>
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                                            <Clock className="h-4 w-4" />
                                            <span className="font-medium">
                                                Refund processing time: 2-3 business days
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Support Information */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                            <h3 className="font-bold text-green-900 text-lg mb-4 flex items-center gap-2">
                                🤝 Need Help? Contact Support
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <Phone className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-900">Phone Support</p>
                                        <p className="text-green-700 text-sm">{settings?.contact_details?.phone_number}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                                    <div className="bg-green-500 p-2 rounded-full">
                                        <Mail className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-900">Email Support</p>
                                        <p className="text-green-700 text-sm">{settings?.contact_details?.support_email}</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-green-700 text-sm mt-4 text-center">
                                Our support team is available Monday to Friday, 9:00 AM - 6:00 PM IST
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                onClick={handleRetry}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                                Try Again
                            </Button>

                            <Button
                                onClick={handleContactSupport}
                                variant="outline"
                                className="flex-1 border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                            >
                                <Mail className="h-5 w-5 mr-2" />
                                Contact Support
                            </Button>
                        </div>

                        {/* Additional Information */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2">📋 What to do next?</h4>
                            <ul className="text-gray-700 text-sm space-y-1">
                                <li>• Check your internet connection and try again</li>
                                <li>• Verify your payment details are correct</li>
                                <li>• Contact support if the issue persists</li>
                                <li>• Check your email for any transaction confirmations</li>
                            </ul>
                        </div>

                        {/* Reassurance Message */}
                        <div className="text-center py-4">
                            <p className="text-gray-600 text-sm">
                                We apologize for the inconvenience. Your satisfaction is our priority,
                                and we&apos;re here to help resolve this issue quickly.
                            </p>
                            <div className="mt-2 text-2xl">
                                🙏 Thank you for your patience
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Page;