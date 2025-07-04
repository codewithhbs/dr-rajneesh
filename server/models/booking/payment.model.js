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
        enum: ['razorpay', 'stripe', 'paypal', 'paytm', 'phonepe', 'gpay', 'cash', 'card','online'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    razorpay_payment_id: {
        type: String
    },
    failure_reason: {
        type: String
    },
    razorpay_order_id: {
        type: String
    },
    paidAt: {
        type: Date
    },
    completed_at: {
        type: Date
    },
    razorpay_signature: {
        type: String
    },
    payment_details: {
        subtotal: String,
        tax: String,
        creditCardFee: String,
        total: String
    },
    verification_timestamp: {
        type: Date
    },
    verification_ip: {
        type: String
    },
    verification_user_agent: {
        type: String
    }


}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);