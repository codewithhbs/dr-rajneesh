"use client"
import { useGetBookingById } from '@/hooks/booking-info';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    CalendarDays,
    Clock,
    MapPin,
    Phone,
    Mail,
    User,
    CreditCard,
    Printer,
    CheckCircle,
    AlertCircle,
    Loader2,
    Star
} from 'lucide-react';
import Image from 'next/image';
import { logo } from '@/constant/Images';
import { useSearchParams } from 'next/navigation';

interface PageProps {
    searchParams: {
        bookingId?: string;
        [key: string]: string | undefined;
    };
}

const Page: React.FC<PageProps> = () => {
 const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

    const { data, loading, error } = useGetBookingById({ id: bookingId });

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading booking details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load booking details. Please try again or contact support.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // No booking ID
    if (!bookingId) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No booking ID found in the URL. Please check your booking link.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // No data found
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <Alert className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Booking not found. Please verify your booking ID.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const booking = data;
    const hasMultipleSessions = booking.no_of_session_book > 1;
    const hasOnlyOneSessionDate = booking.SessionDates.length === 1;
    const showNextSessionNote = hasMultipleSessions && hasOnlyOneSessionDate;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    /* Hide browser header/footer with URL and date */
                    @page {
                        margin: 0.5in;
                        size: A4;
                    }
                    
                    .no-print { display: none !important; }
                    .print-container { 
                        background: white !important;
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 15px !important;
                        font-size: 12px !important;
                        line-height: 1.4 !important;
                    }
                    .print-only { display: block !important; }
                    body { 
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        color-adjust: exact !important;
                    }
                    
                    /* Compact print layout */
                    .print-header { font-size: 14px !important; margin-bottom: 15px !important; }
                    .print-title { font-size: 16px !important; margin-bottom: 10px !important; }
.print-card {
  margin-bottom: 12px !important;
  padding: 8px !important;
  border: none !important;
  box-shadow: none !important;
}
                    .print-card-title { font-size: 13px !important; margin-bottom: -10px !important; }
                    .print-spacing { margin-bottom: -8px !important; }
                    .print-text-sm { font-size: 10px !important; }
                    
                    /* Force page breaks to stay within 2 pages */
                    .page-break-avoid { page-break-inside: avoid !important; }
                    .page-break-after { page-break-after: always !important; }
                    
                    /* Hide overflow content that might cause extra pages */
                    .print-container * { 
                        max-width: 100% !important;
                        overflow: hidden !important;
                    }
                }
                .print-only { display: none; }
            `}</style>

            <div className="container mx-auto p-6 max-w-4xl">
                {/* Header with Print Button */}
                <div className="flex justify-between items-center mb-6 no-print">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Booking Confirmation</h1>
                        <p className="text-gray-600 mt-1">Your appointment has been successfully booked</p>
                    </div>
                    <Button onClick={handlePrint} className="flex items-center gap-2">
                        <Printer className="h-4 w-4" />
                        Print Receipt
                    </Button>
                </div>

                {/* Success Alert */}
                <Alert className="mb-6 border-green-200 bg-green-50 no-print">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Your booking has been confirmed! Payment of {formatCurrency(booking.totalAmount)} has been successfully processed.
                    </AlertDescription>
                </Alert>

                <div className="print-container bg-white rounded-lg shadow-lg p-8">
                    {/* Print Header with Clinic Logo and Info */}
                    <div className="print-only mb-6 print-header">
                        <div className="flex items-center justify-center mb-4">
                            <div className="text-center">
                                {/* Clinic Logo Placeholder */}
                                <div className="w-12 h-12  rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Image
                                        src={logo}
                                        width={120}
                                        height={120}
                                        alt='logo'
                                    />
                                </div>
                                <h1 className="text-lg font-bold text-gray-900">Dr. Rajneesh Kant</h1>
                                <p className="text-sm text-gray-700 font-medium">Physiotherapy & Chiropractic Care</p>
                                <div className="mt-1 text-xs text-gray-600">
                                    <p>{booking.session_booking_for_clinic.clinic_contact_details.clinic_address}</p>
                                    <p>Phone: {booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0]} | Email: {booking.session_booking_for_clinic.clinic_contact_details.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-300 mb-4"></div>
                    </div>

                    {/* Receipt Header */}
                    <div className="text-center mb-8 no-print">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Treatment Booking Receipt</h2>
                        <p className="text-gray-600">Booking ID: <span className="font-mono font-semibold">{booking?.bookingNumber}</span></p>
                        <p className="text-sm text-gray-500">
                            Booked on {new Date(booking.payment_id.paidAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* Print Receipt Header */}
                    <div className="print-only text-center mb-4 print-title">
                        <h2 className="text-base font-bold text-gray-900 mb-1">APPOINTMENT RECEIPT</h2>
                        <p className="text-xs text-gray-600">Booking ID: <span className="font-mono font-semibold">{booking?.bookingNumber}</span></p>
                        <p className="text-xs text-gray-500">
                            Date: {new Date(booking.payment_id.paidAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </p>
                    </div>

                    <div className={`grid grid-cols-1 mt-4  gap-6 ${booking.treatment_id ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                        {/* Patient Information */}
                        <Card className="print-card">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm print-card-title">
                                    <User className="h-4 w-4" />
                                    Patient Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 print-spacing">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">Name:</span>
                                    <span>{booking.patient_details.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Mail className="h-3 w-3 text-gray-500" />
                                    <span>{booking.patient_details.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Phone className="h-3 w-3 text-gray-500" />
                                    <span>{booking.patient_details.phone}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Treatment Information */}
                        {booking.treatment_id && (

                        <Card className="print-card">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm print-card-title">Treatment Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 print-spacing">
                                <div>
                                    <h4 className="font-semibold text-sm">{booking.treatment_id.service_name}</h4>
                                    <p className="text-gray-600 text-xs">{booking.treatment_id.service_small_desc}</p>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">Sessions:</span>
                                    <Badge variant="secondary" className="text-xs">{booking.no_of_session_book} Sessions</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium">Priority:</span>
                                    <Badge variant={booking.priority === 'Normal' ? 'secondary' : 'destructive'} className="text-xs">
                                        {booking.priority}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                        )}
                    </div>

                    {/* Clinic Information - Removed from print to save space */}
                    <Card className="mt-6 print-card ">
                        <CardHeader>
                            <CardTitle className="flex  items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Clinic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    {booking.session_booking_for_clinic.clinic_name}
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-normal">
                                            {booking.session_booking_for_clinic.clinic_ratings}
                                        </span>
                                    </div>
                                </h4>
                                <p className="text-gray-600 mt-1">
                                    {booking.session_booking_for_clinic.clinic_contact_details.clinic_address}
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-500" />
                                        <span>{booking.session_booking_for_clinic.clinic_contact_details.phone_numbers[0]}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-500" />
                                        <span>{booking.session_booking_for_clinic.clinic_contact_details.email}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span>
                                            {formatTime(booking.session_booking_for_clinic.clinic_timings.open_time)} -
                                            {formatTime(booking.session_booking_for_clinic.clinic_timings.close_time)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Closed on {booking.session_booking_for_clinic.clinic_timings.off_day}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Session Information */}
                    <Card className="mt-4 print-card page-break-avoid">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm print-card-title">
                                <CalendarDays className="h-4 w-4" />
                                Session Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {booking.SessionDates.map((session, index) => (
                                <div key={session._id} className="flex justify-between items-center p-2 border rounded mb-2 last:mb-0 text-xs">
                                    <div>
                                        <h4 className="font-semibold text-xs">Session {session.sessionNumber}</h4>
                                        <p className="text-gray-600 text-xs">{formatDate(session.date)}</p>
                                        <p className="text-gray-500 text-xs">at {formatTime(session.time)}</p>
                                    </div>
                                    <Badge variant={session.status === 'Pending' ? 'secondary' : 'default'} className="text-xs">
                                        {session.status}
                                    </Badge>
                                </div>
                            ))}

                            {showNextSessionNote && (
                                <Alert className="mt-2 no-print p-2">
                                    <AlertCircle className="h-3 w-3" />
                                    <AlertDescription className="text-xs">
                                        Next session date will be scheduled by the doctor.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card className="mt-4 print-card page-break-avoid">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm print-card-title">
                                <CreditCard className="h-4 w-4" />
                                Payment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span>Subtotal ({booking.no_of_session_book} sessions):</span>
                                    <span>{formatCurrency(parseInt(booking.payment_id.payment_details.subtotal))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (GST):</span>
                                    <span>{formatCurrency(parseInt(booking.payment_id.payment_details.tax))}</span>
                                </div>
                                {parseInt(booking.payment_id.payment_details.creditCardFee) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Processing Fee:</span>
                                        <span>{formatCurrency(parseInt(booking.payment_id.payment_details.creditCardFee))}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-sm">
                                    <span>Total Amount:</span>
                                    <span>{formatCurrency(booking.totalAmount)}</span>
                                </div>
                            </div>

                            <div className="mt-2 p-2 no-print bg-green-50 rounded text-xs">
                                <div className="flex items-center gap-1 text-green-800">
                                    <CheckCircle className="h-3 w-3" />
                                    <span className="font-semibold">Payment Completed</span>
                                </div>
                                <p className="text-green-700 text-xs">
                                    ID: {booking.payment_id.razorpay_order_id}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-8 text-center text-gray-500 text-sm border-t pt-6 no-print">
                        <p>Thank you for choosing our services!</p>
                        <p>For any queries, please contact the clinic or our support team.</p>
                    </div>

                    {/* Print Footer */}
                    <div className="print-only mt-8 text-center text-gray-600 text-sm border-t pt-6">
                        <p className="font-medium">Thank you for choosing Dr. Rajneesh Kant Clinic!</p>
                     
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;