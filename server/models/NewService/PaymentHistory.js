const mongoose = require("mongoose");

const PaymentHistorySchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FullBodyBooking"
  },

  amount: Number,

  mode: {
    type: String,
    enum: [
      "cash",
      "upi",
      "card",
      "bank_transfer"
    ]
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending"
  },

  gatewayTxnId: String,
  gatewayPaymentId: String,
  transactionId: String,

  remarks: String

}, {
  timestamps: true
});

module.exports = mongoose.model(
  "PaymentHistory",
  PaymentHistorySchema
);