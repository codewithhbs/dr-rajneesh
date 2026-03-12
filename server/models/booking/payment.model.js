const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({

  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking"
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "INR"
  },

  paymentMethod: {
    type: String,
    enum: [
      "razorpay",
      "stripe",
      "paypal",
      "paytm",
      "phonepe",
      "gpay",
      "cash",
      "card",
      "online",
      "payu"
    ],
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded", "partially_refunded"],
    default: "pending"
  },

  // ─────────────────────────────
  // PAYU FIELDS
  // ─────────────────────────────

  payu_txn_id: {
    type: String,
    sparse: true,
    index: true
  },

  payu_mihpayid: {
    type: String,
    sparse: true
  },

  payu_response_hash: {
    type: String
  },

  payu_status: {
    type: String,
    enum: ["success", "failure", "pending", "cancelled", "refunded"]
  },

  payu_mode: {
    type: String
  },

  payu_pg_type: {
    type: String
  },

  payu_bank_ref_num: {
    type: String
  },

  payu_error_message: {
    type: String
  },

  payu_additional_charges: {
    type: Number,
    default: 0
  },

  // ─────────────────────────────
  // PAYMENT RESPONSE STORAGE
  // ─────────────────────────────

  gateway_response: {
    type: Object,
    default: {}
  },

  // ─────────────────────────────
  // FAILURE / REFUND
  // ─────────────────────────────

  failure_reason: {
    type: String
  },

  refund_amount: {
    type: Number,
    default: 0
  },

  refund_id: {
    type: String
  },

  refund_status: {
    type: String,
    enum: ["pending", "processed", "failed"]
  },

  // ─────────────────────────────
  // TIMESTAMPS
  // ─────────────────────────────

  paidAt: Date,

  completed_at: Date,

  verification_timestamp: Date,

  verification_ip: String,

  verification_user_agent: String,

  // ─────────────────────────────
  // PRICE BREAKDOWN
  // ─────────────────────────────

  payment_details: {
    type: Object,
    default: {}
  }

}, { timestamps: true });


paymentSchema.index({ bookingId: 1, status: 1 });
paymentSchema.index({ payu_txn_id: 1 }, { sparse: true, unique: true });
paymentSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);