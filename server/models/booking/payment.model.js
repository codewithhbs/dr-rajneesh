const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bookings",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "phonepe", "pay_at_clinic"],
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    // ─────────────────────────────────
    // Gateway Details
    // ─────────────────────────────────
    gateway: {
      provider: {
        type: String,
        enum: ["razorpay", "phonepe"],
      },

      orderId: {
        type: String,
        index: true,
      },

      paymentId: {
        type: String,
        index: true,
      },

      signature: String,

      transactionId: {
        type: String,
        index: true,
      },
    },

    // Full gateway response for debugging / logs
    gatewayResponse: {
      type: Object,
      default: {},
    },

    failureReason: {
      type: String,
    },

    // ─────────────────────────────────
    // Refund Info
    // ─────────────────────────────────
    refund: {
      amount: {
        type: Number,
        default: 0,
      },

      refundId: {
        type: String,
      },

      status: {
        type: String,
        enum: ["pending", "processed", "failed"],
      },

      refundedAt: Date,
    },

    // ─────────────────────────────────
    // Price Breakdown
    // ─────────────────────────────────
    paymentDetails: {
      subtotal: Number,
      addOnsTotal: Number,
      tax: Number,
      creditCardFee: Number,
      total: Number,
    },

    // ─────────────────────────────────
    // Payment timestamps
    // ─────────────────────────────────
    paidAt: Date,

    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────
// Indexes
// ─────────────────────────────────

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ "gateway.orderId": 1 });
paymentSchema.index({ "gateway.paymentId": 1 });
paymentSchema.index({ "gateway.transactionId": 1 });

module.exports = mongoose.model("Payment", paymentSchema);