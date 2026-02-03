import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'success' | 'failed' | 'processing';
  bookingDetails?: {
    service: string;
    date: string;
    time: string;
    clinic: string;
    amount: number;
    bookingId?: string;
  };
  error?: string;
}

export function PaymentStatusModal({ 
  isOpen, 
  onClose, 
  status, 
  bookingDetails, 
  error 
}: PaymentStatusModalProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-16 h-16 text-green-500" />,
          title: "🎉 Payment Successful!",
          description: "Your appointment is confirmed and ready to go!",
          buttonText: "View My Bookings",
          buttonAction: () => window.location.href = '/bookings'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-16 h-16 text-red-500" />,
          title: "😔 Payment Failed",
          description: error || "Something went wrong with your payment. Don't worry, no charges were made.",
          buttonText: "Try Again",
          buttonAction: onClose
        };
      case 'processing':
        return {
          icon: <AlertCircle className="w-16 h-16 text-yellow-500" />,
          title: "⏳ Processing Payment",
          description: "We're verifying your payment. This may take a few moments...",
          buttonText: "Please Wait",
          buttonAction: () => {}
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <DialogTitle className="text-2xl">{config.title}</DialogTitle>
          <DialogDescription className="text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        {bookingDetails && status === 'success' && (
          <div className="bg-green-50 p-4 rounded-lg space-y-2 my-4">
            <h4 className="font-semibold text-green-800">✨ Booking Confirmed!</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Service:</strong> {bookingDetails.service}</p>
              <p><strong>Date & Time:</strong> {bookingDetails.date} at {bookingDetails.time}</p>
              <p><strong>Clinic:</strong> {bookingDetails.clinic}</p>
              <p><strong>Amount Paid:</strong> ₹{bookingDetails.amount.toLocaleString()}</p>
              {bookingDetails.bookingId && (
                <p><strong>Booking ID:</strong> {bookingDetails.bookingId}</p>
              )}
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-red-50 p-4 rounded-lg my-4">
            <h4 className="font-semibold text-red-800">💡 What you can do:</h4>
            <ul className="text-sm text-red-700 mt-2 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Verify your payment details</li>
              <li>• Try a different payment method</li>
              <li>• Contact support if issue persists</li>
            </ul>
          </div>
        )}

        <Button 
          onClick={config.buttonAction}
          className="w-full"
          disabled={status === 'processing'}
        >
          {config.buttonText}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
