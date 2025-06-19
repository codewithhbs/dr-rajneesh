const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'paytm', 'phonepe', 'gpay', 'cash', 'card'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    razarpay_transactionId: {
        type: String
    },
    razorpay_order_id: {
        type: String
    },
    paidAt: {
        type: Date
    },
    payment_details: {
        subtotal: String,
        tax: String,
        creditCardFee: String,
        total: String
    }

}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);