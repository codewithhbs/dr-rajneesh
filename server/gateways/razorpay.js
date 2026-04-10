const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazarpayPayment = async ({ amount, bookingId, userId }) => {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: userId.toString(),
      },
    });

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    console.error("Razorpay create order error:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

exports.verifyRazarpayPayment = ({
  orderId,
  paymentId,
  signature,
}) => {
  try {
    const body = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};