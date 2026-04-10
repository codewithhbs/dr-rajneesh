require("dotenv").config();

const {
  StandardCheckoutClient,
  Env,
  CreateSdkOrderRequest,
} = require("@phonepe-pg/pg-sdk-node");

// ====================== ENV CONFIG ======================
const clientId = process.env.PHONEPE_CLIENT_ID;
const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
const clientVersion = process.env.PHONEPE_CLIENT_VERSION || 1;

const env =
  process.env.PHONEPE_ENV === "production"
    ? Env.PRODUCTION
    : Env.SANDBOX;

// Initialize PhonePe Client (do this once)
const phonepeClient = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env
);

// =======================================================
// CREATE PHONEPE PAYMENT (Web Redirect Flow)
// =======================================================
exports.createPhonePePayment = async ({
  amount,
  bookingId,
  userId,
  patient_details,
}) => {
  try {
    const merchantOrderId = `BOOK_${bookingId}_${Date.now()}`;

    // Redirect back to your frontend after payment (PhonePe will POST/redirect here)
    const redirectUrl = `${process.env.FRONTEND_URL}/phonepe?bookingId=${bookingId}`;

    // Optional: You can pass user details in redirect URL or use metaInfo via UDF if needed
    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(amount * 100)) // amount in paise
      .redirectUrl(redirectUrl)
      .expireAfter(1800) // 30 minutes (in seconds)
      .message("Payment for Clinic Booking")
      // .disablePaymentRetry(true)   // Uncomment if you want to disable retry
      .build();

    const response = await phonepeClient.pay(request);   // This is the correct method for web flow

    console.log("PhonePe create order response:", response);

    return {
      success: true,
      redirectUrl: response.redirectUrl,   // This is the URL to redirect user to
      merchantOrderId,
    };
  } catch (error) {
    console.error("PhonePe createPayment error:", error?.response?.data || error.message || error);
    return {
      success: false,
      error: error.message || "Failed to create PhonePe order",
    };
  }
};

// =======================================================
// VERIFY / CHECK PHONEPE PAYMENT STATUS
// =======================================================
exports.verifyPhonePePayment = async (merchantOrderId) => {
  try {
    const response = await phonepeClient.getOrderStatus(merchantOrderId);

    console.log("PhonePe status response:", response);

    return {
      success: true,
      state: response.state,             
      amount: response.amount,
      transactionId: response?.paymentDetails?.[0]?.transactionId || null,
      responseCode: response.code,
    };
  } catch (error) {
    console.error("PhonePe status check error:", error?.message || error);
    return {
      success: false,
      error: error.message || "Status check failed",
    };
  }
};