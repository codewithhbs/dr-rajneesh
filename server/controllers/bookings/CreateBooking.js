const Service = require("../../models/services/services.model");
const mongoose = require("mongoose");
const {
    getRedisClient,
    cleanRedisDataFlush,
    flushAllData,
} = require("../../utils/redis.utils");
const RazorpayUtils = require("../../utils/razorpayUtils");
const Bookings = require("../../models/booking/bookings.sessions.model");
const Settings = require("../../models/settings/settings.model");
const Payment = require("../../models/booking/payment.model"); // Assuming you have a payment model
const { getBookingsByDateAndTimePeriodOnB } = require("./BookingService");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");
const { deleteFile } = require("../../middleware/multer");
const AddOn = require("../../models/services/addon.model");
const userModel = require("../../models/users/user.model");
const PayUUtils = require("../../utils/payu.utils");

const razorpay = new RazorpayUtils(
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET
);

// const payu = new PayUUtils(
//     process.env.PAYU_TEST_KEY,
//     process.env.PAYU_TEST_SALT,
//     "TEST" // or "LIVE"
// );
const payu = new PayUUtils(
    process.env.PAYU_KEY,
    process.env.PAYU_KEY,
    "LIVE" // or "LIVE"
);

exports.createAorderForSession = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.user?._id;

    const {
      payment_method,
      patient_details,
      service_id,
      clinic_id,
      sessions,
      date,
      time,
      addons = [],
    } = req.body;

    console.log("========== BOOKING REQUEST START ==========");
    console.log("Request body:", req.body);
    console.log("User ID:", userId);

    if (!userId) {
      console.log("❌ Unauthorized: user not found in request");
      await session.abortTransaction();
      return res.status(401).json({
        success: false,
        message: "Please login to book a session",
      });
    }

    const redisClient = getRedisClient(req);

    // ─────────────────────────────────────────
    // Required field validation
    // ─────────────────────────────────────────
    const requiredFields = {
      payment_method,
      patient_details,
      clinic_id,
      sessions,
      date,
      time,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missingFields.join(", ")}`,
      });
    }

    if (!patient_details?.name || !patient_details?.email || !patient_details?.phone) {
      console.log("❌ Missing patient details fields");
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Patient name, email and phone are required",
      });
    }

    // ─────────────────────────────────────────
    // Fetch service
    // ─────────────────────────────────────────
    let findService = null;

    if (service_id) {
      console.log("🔍 Fetching service:", service_id);

      findService = await Service.findById(service_id).session(session);

      if (!findService) {
        console.log("❌ Service not found");
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      if (findService.service_status !== "Booking Open") {
        console.log("❌ Service booking is closed");
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Booking is not open for this treatment",
        });
      }
    }

    // ─────────────────────────────────────────
    // Fetch and validate add-ons
    // ─────────────────────────────────────────
    let addOnsData = [];
    let addOnsTotal = 0;

    if (Array.isArray(addons) && addons.length > 0) {
      console.log("🔍 Fetching addons:", addons);

      const fetchedAddOns = await AddOn.find({
        _id: { $in: addons },
        is_active: true,
      }).session(session);

      if (fetchedAddOns.length !== addons.length) {
        console.log("❌ One or more addons are invalid/inactive");
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "One or more selected add-ons are not available",
        });
      }

      addOnsData = fetchedAddOns.map((addon) => ({
        addOnId: addon._id,
        title: addon.title,
        price: addon.price,
      }));

      addOnsTotal = fetchedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    }

    console.log("✅ Addons processed:", {
      addOnsCount: addOnsData.length,
      addOnsTotal,
    });

    // ─────────────────────────────────────────
    // Fetch settings
    // ─────────────────────────────────────────
    console.log("🔍 Fetching settings...");

    const findSettings = await Settings.findOne({ is_active: true }).session(session);

    if (!findSettings) {
      console.log("❌ Settings not found");
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Settings not configured",
      });
    }

    // ─────────────────────────────────────────
    // Check slot availability
    // ─────────────────────────────────────────
    console.log("🔍 Checking slot availability...");

    const checkBookings = await getBookingsByDateAndTimePeriodOnB({
      date,
      time,
      clinic_id,
      req,
    });

    console.log("Slot availability response:", checkBookings?.data);

    if (!checkBookings?.data?.available) {
      console.log("❌ Slot not available");
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Booking for ${checkBookings?.data?.date} at ${checkBookings?.data?.time} is full. Please choose another time.`,
      });
    }

    // ─────────────────────────────────────────
    // Calculate pricing
    // ─────────────────────────────────────────
    const basePrice =
      findService?.service_per_session_discount_price ??
      findService?.service_per_session_price ??
      10000;

    const subtotal = basePrice * Number(sessions);
    const subtotalWithAddOns = subtotal + addOnsTotal;

    const taxPercentage = findSettings?.payment_config?.tax_percentage || 0;
    const creditCardFeePercentage = findSettings?.payment_config?.credit_card_fee || 0;

    const taxAmount = (subtotalWithAddOns * taxPercentage) / 100;
    const creditCardAmount =
      payment_method === "card"
        ? (subtotalWithAddOns * creditCardFeePercentage) / 100
        : 0;

    const total = subtotalWithAddOns + taxAmount + creditCardAmount;

    console.log("💰 Pricing calculated:", {
      basePrice,
      subtotal,
      addOnsTotal,
      subtotalWithAddOns,
      taxPercentage,
      taxAmount,
      creditCardFeePercentage,
      creditCardAmount,
      total,
    });

    if (!subtotal || !total) {
      console.log("❌ Pricing calculation failed");
      await session.abortTransaction();
      return res.status(500).json({
        success: false,
        message: "Error calculating pricing. Please try again.",
      });
    }

    // ─────────────────────────────────────────
    // Final slot availability re-check
    // ─────────────────────────────────────────
    console.log("🔁 Final slot availability check...");

    const finalAvailabilityCheck = await getBookingsByDateAndTimePeriodOnB({
      date,
      time,
      clinic_id,
      req,
    });

    console.log("Final slot availability:", finalAvailabilityCheck?.data);

    if (!finalAvailabilityCheck?.data?.available) {
      console.log("❌ Slot became unavailable during booking");
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Booking for ${finalAvailabilityCheck?.data?.date} at ${finalAvailabilityCheck?.data?.time} is no longer available.`,
      });
    }

    // ─────────────────────────────────────────
    // Generate session dates
    // ─────────────────────────────────────────
    const sessionDates = [
      {
        sessionNumber: 1,
        date: new Date(date),
        time,
        status: "Pending",
      },
    ];

    console.log("📅 Session dates generated:", sessionDates);

    // ─────────────────────────────────────────
    // Step 1: Create payment record first
    // ─────────────────────────────────────────
    console.log("💳 Creating initial payment record...");

    const paymentRecord = new Payment({
      user_id: userId,
      amount: total,
      paymentMethod: payment_method,
      status: "pending",
      payment_details: {
        subtotal,
        addOnsTotal,
        tax: taxAmount,
        creditCardFee: creditCardAmount,
        total,
      },
    });

    const savedPayment = await paymentRecord.save({ session });

    console.log("✅ Payment record created:", {
      paymentId: savedPayment._id,
      status: savedPayment.status,
    });

    // ─────────────────────────────────────────
    // Step 2: Create booking with payment_id
    // ─────────────────────────────────────────
    console.log("📝 Creating booking...");

    const newBooking = new Bookings({
      treatment_id: service_id,
      no_of_session_book: sessions,
      patient_details,
      SessionDates: sessionDates,
      session_booking_user: userId,
      session_booking_for_clinic: clinic_id,
      session_booking_for_doctor: "68526dc0730bac32941b587c",
      session_status: "Payment Not Completed",
      payment_id: savedPayment._id,
      totalAmount: total,
      amountPerSession: basePrice,
      addOns: addOnsData,
      addOnsTotal,
      bookingSource: "web",
    });

    const savedBooking = await newBooking.save({ session });

    console.log("✅ Booking created successfully:", {
      bookingId: savedBooking._id,
      bookingNumber: savedBooking.bookingNumber,
    });

    // ─────────────────────────────────────────
    // Step 3: Create PayU payment with bookingId in udf1
    // ─────────────────────────────────────────
    const patientName = patient_details?.name || "Patient";
    const patientEmail = patient_details?.email || "patient@example.com";
    const patientPhone = patient_details?.phone || "9999999999";

    console.log("🏦 Creating PayU payment...");

    const createPaymentData = await payu.createPayment({
      amount: total,
      firstname: patientName,
      email: patientEmail,
      phone: patientPhone,
      productinfo: `Booking for ${sessions} session${Number(sessions) > 1 ? "s" : ""} - ${findService?.name || "Treatment"}`,

      udf1: savedBooking._id.toString(), // bookingId
      udf2: userId.toString(), // userId
      udf3: service_id ? service_id.toString() : "", // serviceId
      udf4: clinic_id ? clinic_id.toString() : "", // clinicId
    });

    console.log("PayU createPayment response:", createPaymentData);

    if (!createPaymentData?.success) {
      console.log("❌ PayU payment creation failed");

      await session.abortTransaction();

      return res.status(500).json({
        success: false,
        message: "Payment gateway error. Please try again.",
        error: createPaymentData?.error || "PayU create payment failed",
      });
    }

    // ─────────────────────────────────────────
    // Step 4: Update payment with PayU txnid + bookingId
    // ─────────────────────────────────────────
    console.log("🔄 Updating payment record with PayU txnid and bookingId...");

    savedPayment.payu_txn_id = createPaymentData.txnid;
    savedPayment.bookingId = savedBooking._id;

    await savedPayment.save({ session });

    console.log("✅ Payment updated:", {
      paymentId: savedPayment._id,
      payu_txn_id: savedPayment.payu_txn_id,
      bookingId: savedPayment.bookingId,
    });

    // Optional: keep reverse reference too if schema supports it
    // If your booking schema has payment_id only, this is already set.
    // If needed:
    // savedBooking.payment_id = savedPayment._id;
    // await savedBooking.save({ session });

    // ─────────────────────────────────────────
    // Commit transaction
    // ─────────────────────────────────────────
    await session.commitTransaction();
    console.log("✅ Transaction committed successfully");

    // ─────────────────────────────────────────
    // Clear cache
    // ─────────────────────────────────────────
    try {
      console.log("🧹 Clearing booking availability cache...");
      await cleanRedisDataFlush(redisClient, "booking_availability*");
      console.log("✅ Cache cleared");
    } catch (cacheError) {
      console.error("⚠️ Cache clear failed:", cacheError);
    }

    const responsePayload = {
      success: true,
      message: "Booking created successfully. Please complete payment on PayU.",
      data: {
        booking: {
          id: savedBooking._id,
          bookingNumber: savedBooking.bookingNumber,
          sessionDates: savedBooking.SessionDates,
          totalAmount: savedBooking.totalAmount,
          addOns: savedBooking.addOns,
          addOnsTotal: savedBooking.addOnsTotal,
          status: savedBooking.session_status,
        },
        payment: {
          txnid: createPaymentData.txnid,
          amount: total,
          currency: "INR",
          key: process.env.PAYU_TEST_KEY,
          breakdown: {
            subtotal,
            addOnsTotal,
            tax: taxAmount,
            creditCardFee: creditCardAmount,
            total,
          },
        },
        paymentParams:createPaymentData?.paymentParams,
        payuFormHtml: createPaymentData.formHtml,
      },
    };

    console.log("✅ Final response payload:", responsePayload);
    console.log("========== BOOKING REQUEST END ==========");

    return res.status(201).json(responsePayload);
  } catch (error) {
    console.error("❌ Error creating booking with PayU:", error);

    try {
      await session.abortTransaction();
      console.log("🛑 Transaction aborted");
    } catch (abortError) {
      console.error("❌ Error aborting transaction:", abortError);
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
    console.log("🔚 Mongo session ended");
  }
};



// Verify payment and update booking status
// exports.verifyPayment = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     let via = 'web';
//     let committed = false;
//     let bookingId = null;
//     let paymentId = null;

//     const logContext = {
//         timestamp: new Date().toISOString(),
//         method: req.method,
//         ip: req.ip || req.connection.remoteAddress,
//         userAgent: req.get('User-Agent'),
//         sessionId: session.id
//     };

//     console.log("Payment verification started", { ...logContext });

//     try {
//         const redisClient = getRedisClient(req, res);

//         // Extract and validate parameters
//         const {
//             platform,
//             booking_id,
//             payment_id,
//             razorpay_payment_id,
//             razorpay_order_id,
//             razorpay_signature,
//             timestamp
//         } = req.method === 'GET' ? req.query : { ...req.query, ...req.body };

//         console.log(req.query)
//         bookingId = booking_id;
//         paymentId = payment_id;

//         // Validate platform
//         const allowedPlatforms = ['web', 'app', 'admin'];
//         if (platform && allowedPlatforms.includes(platform)) {
//             via = platform;
//         }

//         // Validate required parameters
//         const requiredParams = {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//             booking_id
//         };

//         const missingParams = Object.keys(requiredParams).filter(key => !requiredParams[key]);

//         if (missingParams.length > 0) {
//             console.error("Missing required parameters", { missingParams, bookingId, ...logContext });
//             await session.abortTransaction();

//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=missing-parameters&missing=${missingParams.join(',')}&booking_id=${booking_id || 'unknown'}`
//             );
//         }

//         // Verify Razorpay signature
//         let isValidSignature = false;
//         try {
//             isValidSignature = razorpay.verifyPayment({
//                 razorpay_order_id,
//                 razorpay_payment_id,
//                 razorpay_signature
//             });

//             console.log("Razorpay signature verification completed", {
//                 isValid: isValidSignature,
//                 razorpay_order_id,
//                 bookingId,
//                 ...logContext
//             });

//         } catch (signatureError) {
//             console.error("Razorpay signature verification failed", {
//                 error: signatureError.message,
//                 bookingId,
//                 ...logContext
//             });

//             await session.abortTransaction();
//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=signature-verification-failed&booking_id=${booking_id}`
//             );
//         }

//         if (!isValidSignature) {
//             console.error("Invalid Razorpay signature", {
//                 razorpay_order_id,
//                 bookingId,
//                 ...logContext
//             });

//             await session.abortTransaction();
//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=invalid-signature&booking_id=${booking_id}`
//             );
//         }

//         // Fetch booking record
//         const booking = await Bookings.findById(booking_id)
//             .populate('treatment_id')
//             .populate('session_booking_user')
//             .session(session);

//         if (!booking) {
//             console.error("Booking not found", { bookingId, ...logContext });
//             await session.abortTransaction();

//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=booking-not-found&booking_id=${booking_id}`
//             );
//         }

//         // Fetch payment record
//         const payment = await Payment.findById(booking.payment_id).session(session);

//         if (!payment) {
//             console.error("Payment record not found", {
//                 bookingId,
//                 paymentId: booking.payment_id,
//                 ...logContext
//             });

//             await session.abortTransaction();
//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=payment-not-found&booking_id=${booking_id}`
//             );
//         }

//         console.log("Payment record found", {
//             payment_id: payment._id,
//             current_status: payment.payment_status,
//             amount: payment.amount,
//             razorpay_order_id: payment.razorpay_order_id,
//             already_processed: !!payment.razorpay_payment_id,
//             ...logContext
//         });

//         // Check if payment is already processed
//         if (payment.payment_status === 'completed' && payment.razorpay_payment_id) {
//             console.warn("Payment already processed", {
//                 bookingId,
//                 payment_id: payment._id,
//                 existing_razorpay_payment_id: payment.razorpay_payment_id,
//                 new_razorpay_payment_id: razorpay_payment_id,
//                 ...logContext
//             });

//             await session.abortTransaction();

//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-success?sessions=${booking.sessions}&price=${payment.amount}&service=${booking.service_id?.service_name || 'service'}&bookingId=${booking._id}&status=already-processed`
//             );
//         }

//         // Verify order ID match
//         if (payment.razorpay_order_id !== razorpay_order_id) {
//             console.error("Order ID mismatch", {
//                 bookingId,
//                 payment_id: payment._id,
//                 expected_order_id: payment.razorpay_order_id,
//                 received_order_id: razorpay_order_id,
//                 ...logContext
//             });

//             await session.abortTransaction();
//             return res.redirect(
//                 `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=order-id-mismatch&booking_id=${booking_id}`
//             );
//         }

//         console.log("Updating payment and booking records", { bookingId, paymentId: payment._id });

//         // Update payment record
//         payment.razorpay_payment_id = razorpay_payment_id;
//         payment.razorpay_signature = razorpay_signature;
//         payment.payment_status = 'completed';
//         payment.completed_at = new Date();
//         payment.verification_timestamp = new Date();
//         payment.verification_ip = req.ip || req.connection.remoteAddress;
//         payment.verification_user_agent = req.get('User-Agent');

//         await payment.save({ session });

//         console.log("Payment record updated successfully", {
//             payment_id: payment._id,
//             new_status: payment.payment_status,
//             ...logContext
//         });

//         // Update booking record
//         booking.session_status = 'Confirmed';
//         booking.payment_verified_at = new Date();
//         booking.last_updated = new Date();
//         booking.bookingSource = via

//         const savedBooking = await booking.save({ session });

//         console.log("Booking record updated successfully", {
//             booking_id: savedBooking._id,
//             session_status: savedBooking.session_status,
//             payment_verified_at: savedBooking.payment_verified_at,
//             ...logContext
//         });

//         // Commit transaction
//         await session.commitTransaction();
//         committed = true;

//         console.log("Transaction committed successfully", {
//             bookingId,
//             paymentId: payment._id,
//             ...logContext
//         });

//         // Clear Redis cache
//         try {
//             await flushAllData(redisClient);
//             console.log("Redis cache cleared successfully");
//         } catch (cacheError) {
//             console.warn("Failed to clear Redis cache (non-critical)", {
//                 error: cacheError.message,
//                 ...logContext
//             });
//         }

//         // Return response based on platform
//         if (via === 'web') {
//             const successUrl = `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-success?bookingId=${booking._id}`;
//             console.log("Redirecting to success page", { successUrl, ...logContext });
//             return res.redirect(successUrl);
//         } else {
//             console.log("Returning JSON response for API/app", { bookingId, ...logContext });
//             return res.status(200).json({
//                 success: true,
//                 message: 'Payment verified successfully',
//                 data: {
//                     booking_id: booking._id,
//                     payment_id: payment._id,
//                     session_status: booking.session_status,
//                     payment_status: payment.payment_status
//                 }
//             });
//         }

//     } catch (error) {
//         console.error("Payment verification error", {
//             error: error.message,
//             stack: error.stack,
//             booking_id: bookingId,
//             payment_id: paymentId,
//             committed,
//             ...logContext
//         });

//         // Rollback transaction if not committed
//         if (!committed) {
//             try {
//                 await session.abortTransaction();
//                 console.log("Transaction aborted due to error");
//             } catch (abortError) {
//                 console.error("Failed to abort transaction", {
//                     error: abortError.message,
//                     ...logContext
//                 });
//             }
//         }

//         // Determine error type and reason
//         const errorType = error.name;
//         const reason = errorType === 'ValidationError'
//             ? 'validation-error'
//             : (errorType === 'MongoError' || errorType === 'MongooseError')
//                 ? 'database-error'
//                 : 'verification-failed';

//         // Return appropriate response
//         if (via === 'web') {
//             const redirectUrl = `${process.env.FRONTEND_URL || 'https://drrajneeshkant.in'}/booking-failed?reason=${reason}&booking_id=${bookingId || 'unknown'}&error=${encodeURIComponent(error.message)}`;
//             return res.redirect(redirectUrl);
//         } else {
//             return res.status(500).json({
//                 success: false,
//                 message: 'Payment verification failed',
//                 reason,
//                 error: error.message,
//                 booking_id: bookingId,
//                 payment_id: paymentId
//             });
//         }

//     } finally {
//         // Always end the session
//         try {
//             await session.endSession();
//             console.log("Database session ended", {
//                 sessionId: session.id,
//                 committed,
//                 ...logContext
//             });
//         } catch (sessionError) {
//             console.error("Failed to end database session", {
//                 error: sessionError.message,
//                 sessionId: session.id,
//                 ...logContext
//             });
//         }
//     }
// };



exports.verifyPayment = async (req, res) => {

  const session = await mongoose.startSession();

  let committed = false;
  let bookingId = null;
  let paymentId = null;
  let via = "web";

  const baseFrontendUrl =
    (process.env.FRONTEND_URL || "https://drrajneeshkant.in").replace(/\/+$/, "");

  const redirectFailure = (reason, extra = {}) => {
    const query = new URLSearchParams({
      reason,
      booking_id: bookingId || "unknown",
      ...extra,
    }).toString();

    return res.redirect(`${baseFrontendUrl}/booking-failed?${query}`);
  };

  const redirectSuccess = (booking) => {
    const query = new URLSearchParams({
      bookingId: booking._id,
      status: "success",
    }).toString();

    return res.redirect(`${baseFrontendUrl}/booking-success?${query}`);
  };

  try {

    session.startTransaction();

    const redisClient = getRedisClient(req, res);

    const params =
      req.method === "GET"
        ? { ...req.query }
        : { ...req.query, ...req.body };

    const {
      platform,
      txnid,
      status,
      mihpayid,
      hash,
      udf1,
    } = params;

    bookingId = udf1 || params.booking_id || null;

    if (platform && ["web", "app", "admin"].includes(platform)) {
      via = platform;
    }

    // Required params validation
    if (!bookingId || !txnid || !status || !hash) {
      await session.abortTransaction();
      return redirectFailure("missing-parameters");
    }

    // Find booking
    const booking = await Bookings.findById(bookingId)
      .populate("treatment_id")
      .populate("session_booking_user")
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return redirectFailure("booking-not-found");
    }

    if (!booking.payment_id) {
      await session.abortTransaction();
      return redirectFailure("payment-id-missing");
    }

    // Find payment
    const payment = await Payment.findById(booking.payment_id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return redirectFailure("payment-not-found");
    }

    paymentId = payment._id;

    // Prevent duplicate processing
    if (payment.status === "completed" && payment.payu_mihpayid) {

      await session.abortTransaction();

      if (via === "web") {
        return res.redirect(
          `${baseFrontendUrl}/booking-success?bookingId=${booking._id}&status=already-processed`
        );
      }

      return res.json({
        success: true,
        message: "Payment already processed",
      });
    }

    // Validate txnid
    if (payment.payu_txn_id !== txnid) {
      await session.abortTransaction();
      return redirectFailure("txnid-mismatch");
    }

    // Verify payment with PayU
    const verification = await payu.verifyPayment(params);

    if (!verification.success || !verification.verified) {

      payment.status = "failed";
      payment.failure_reason = verification.error || "verification-failed";
      payment.payu_mihpayid = mihpayid;
      payment.payu_response_hash = hash;
      payment.gateway_response = params;
      payment.verification_timestamp = new Date();

      await payment.save({ session });

      booking.session_status = "Payment Failed";
      booking.last_updated = new Date();

      await booking.save({ session });

      await session.commitTransaction();
      committed = true;

      return redirectFailure("verification-failed");
    }

    if (status.toLowerCase() !== "success") {

      payment.status = "failed";
      payment.failure_reason = status;
      payment.payu_mihpayid = mihpayid;
      payment.gateway_response = params;

      await payment.save({ session });

      booking.session_status = "Payment Failed";
      booking.last_updated = new Date();

      await booking.save({ session });

      await session.commitTransaction();
      committed = true;

      return redirectFailure("payment-failed");
    }

    // Payment success
    payment.status = "completed";
    payment.payu_mihpayid = mihpayid;
    payment.payu_response_hash = hash;
    payment.gateway_response = params;
    payment.completed_at = new Date();
    payment.paidAt = new Date();
    payment.verification_timestamp = new Date();

    await payment.save({ session });

    booking.session_status = "Confirmed";
    booking.payment_verified_at = new Date();
    booking.last_updated = new Date();
    booking.bookingSource = via;

    await booking.save({ session });

    await session.commitTransaction();
    committed = true;

    // Clear cache
    try {
      await flushAllData(redisClient);
    } catch (e) {}

    if (via === "web") {
      return redirectSuccess(booking);
    }

    return res.json({
      success: true,
      booking_id: booking._id,
      payment_id: payment._id,
    });

  } catch (error) {

    if (!committed) {
      await session.abortTransaction();
    }

    console.error("Payment verification error:", error);

    if (via === "web") {
      return redirectFailure("verification-error", {
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
      booking_id: bookingId,
      payment_id: paymentId,
    });

  } finally {

    await session.endSession();

  }
};

exports.handlePaymentFailure = async (req, res) => {
    try {
        const { booking_id, error_description, txnid, status } = req.method === "GET" ? req.query : { ...req.query, ...req.body };

        console.log("PayU Payment failure received:", { booking_id, error_description, status, txnid });

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required",
            });
        }

        const booking = await Bookings.findById(booking_id);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        const payment = await Payment.findById(booking.payment_id);
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment record not found",
            });
        }

        // Update booking to cancelled
        booking.session_status = "Cancelled";
        booking.cancellation = {
            cancelledAt: new Date(),
            cancelledBy: booking.session_booking_user,
            cancellationReason: error_description || "Payment Failed",
            refundEligible: false,
        };
        await booking.save();

        // Update payment
        payment.status = "failed";
        payment.failure_reason = error_description || `PayU status: ${status || "unknown"}`;
        payment.payu_txn_id = txnid || payment.payu_txn_id;
        await payment.save();

        // For web → redirect to failure page
        if (req.headers["user-agent"]?.includes("Mozilla")) {
            return res.redirect(
                `${process.env.FRONTEND_URL || "https://drrajneeshkant.in"}/booking-failed?reason=payment-failed&booking_id=${booking_id}&error=${encodeURIComponent(error_description || "Payment declined")}`
            );
        }

        return res.status(200).json({
            success: true,
            message: "Payment failure handled successfully",
        });
    } catch (error) {
        console.error("Error handling PayU payment failure:", error);
        return res.status(500).json({
            success: false,
            message: "Error handling payment failure",
        });
    }
};



// Handle payment failure
// exports.handlePaymentFailure = async (req, res) => {
//     try {
//         const { booking_id, error_description } = req.body;
//         console.log(req.body)

//         if (!booking_id) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Booking ID is required"
//             });
//         }

//         const booking = await Bookings.findById(booking_id);
//         const payment = await Payment.findById(booking.payment_id);

//         if (booking) {
//             booking.session_status = 'Cancelled';
//             booking.cancellation = {
//                 cancelledAt: new Date(),
//                 cancelledBy: booking.session_booking_user,
//                 cancellationReason: 'Payment Issue',
//                 refundEligible: false
//             };
//             await booking.save();
//         }

//         if (payment) {
//             payment.status = 'failed';
//             payment.failure_reason = error_description;
//             await payment.save();
//         }

//         return res.status(200).json({
//             success: true,
//             message: "Payment failure handled successfully"
//         });

//     } catch (error) {
//         console.error("Error handling payment failure:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Error handling payment failure"
//         });
//     }
// };
exports.foundBookingViaId = async (req, res) => {
    try {


        // Validate booking ID parameter
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required."
            });
        }

        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID format."
            });
        }


        // Find booking with proper query structure
        const foundBooking = await Bookings.findOne({
            _id: id

        }).populate([
            'session_booking_for_clinic',
            'treatment_id',
            'payment_id',

        ]);

        if (!foundBooking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission to view it."
            });
        }

        // Check if payment exists and get payment status
        let paymentStatus = null;
        let paymentDetails = null;

        if (foundBooking.payment_id) {
            paymentDetails = foundBooking.payment_id;
            paymentStatus = paymentDetails.payment_status;

            // Verify payment belongs to this user's booking
            if (paymentDetails.bookingId?.toString() !== id) {
                console.error(`Payment mismatch for booking ${id}`);
                return res.status(400).json({
                    success: false,
                    message: "Payment information doesn't match this booking."
                });
            }
        }



        console.log(`Booking ${id} found successfully`);

        return res.status(200).json({
            success: true,
            message: "Booking retrieved successfully.",
            data: foundBooking
        });

    } catch (error) {
        console.error("Error retrieving booking:", error.message);

        // Handle specific mongoose errors
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID format."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve booking. Please try again later."
        });
    }
};


// ================================ ADMIN  BOOKING API CONTROLLERS ================================
exports.getAdminAllBookings = async (req, res) => {
    try {

        const bookings = await Bookings.find({})
            .populate([
                'session_booking_for_clinic',
                'session_booking_for_doctor',
                'session_booking_user',
                'payment_id'
            ]).populate('treatment_id', '-service_desc -service_available_at_clinics -service_reviews -service_session_allowed_limit -service_tag -service_doctor -createdAt -updatedAt')
            .sort({ createdAt: -1 });
        if (!bookings || bookings.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No bookings found."
            });
        }
        console.log(`Retrieved ${bookings.length} bookings successfully`);

        return res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully.",
            data: bookings
        });
    } catch (error) {
        console.error("Error retrieving bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve bookings. Please try again later."
        });
    }
};

exports.getAllBookingCount = async (req, res) => {
    try {
        const totalBookings = await Bookings.countDocuments();

        return res.status(200).json({
            success: true,
            count: totalBookings
        });
    } catch (error) {
        console.error("Error getting booking count:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get booking count",
            error: error.message
        });
    }
};

exports.getAdminSingleBookings = async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await Bookings.findById(id)
            .populate([
                'session_booking_for_clinic',
                'session_booking_for_doctor',
                'session_booking_user',
                'payment_id'
            ]).populate('treatment_id', '-service_desc -service_available_at_clinics -service_reviews -service_session_allowed_limit -service_tag -service_doctor -createdAt -updatedAt')
            .sort({ createdAt: -1 });
        if (!bookings) {
            return res.status(404).json({
                success: false,
                message: "No bookings found."
            });
        }
        console.log(`Retrieved ${bookings._id} bookings successfully`);

        return res.status(200).json({
            success: true,
            message: "Booking retrieved successfully.",
            data: bookings
        });
    } catch (error) {
        console.error("Error retrieving bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to retrieve bookings. Please try again later."
        });
    }
};

exports.getAdminChangeSessionInformation = async (req, res) => {
    try {
        const {
            _id,
            new_date,
            new_time,
            status,
            isReschedule = false,
            sessionNumber,
            reason
        } = req.body;

        // Step 1: Validate required fields
        if (!_id) {
            return res.status(400).json({
                success: false,
                message: "Booking ID (_id) is required."
            });
        }

        if ((isReschedule || status === 'Completed' || status === 'Cancelled') && !sessionNumber) {
            return res.status(400).json({
                success: false,
                message: "Session number is required for this operation."
            });
        }

        // Step 2: Fetch the booking with population
        const currentSession = await Bookings.findById(_id)
            .populate('session_booking_for_clinic')
            .populate('session_booking_for_doctor')
            .populate('session_booking_user')
            .populate('payment_id')
            .populate('treatment_id');

        if (!currentSession) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        // Step 3: Prevent action if main session status is already final
        // if (['Completed', 'Cancelled'].includes(currentSession.session_status)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Cannot change session information for completed or cancelled bookings."
        //     });
        // }

        // Step 4: Find the specific session by sessionNumber
        let matchedSession = null;
        if (sessionNumber) {
            matchedSession = currentSession.SessionDates.find(
                session => session.sessionNumber === sessionNumber
            );

            if (!matchedSession) {
                return res.status(404).json({
                    success: false,
                    message: "Session number not found in the booking."
                });
            }
        }

        // Step 5: Handle Rescheduling
        if (isReschedule) {
            if (!new_date || !new_time) {
                return res.status(400).json({
                    success: false,
                    message: "New date and time are required for rescheduling."
                });
            }

            if (['Completed', 'Cancelled'].includes(matchedSession.status)) {
                return res.status(400).json({
                    success: false,
                    message: "This session is already completed or cancelled and cannot be rescheduled."
                });
            }

            await currentSession.rescheduleSession(sessionNumber, new_date, new_time, reason);
        }


        else if (status === 'Completed') {
            await currentSession.completeSession(sessionNumber);
        }


        else if (status === 'Cancelled') {
            if (matchedSession.status === 'Cancelled') {
                return res.status(400).json({
                    success: false,
                    message: "This session is already cancelled."
                });
            }

            await currentSession.cancelSession(sessionNumber, reason);
        }

        // Step 8: Save and respond
        await currentSession.save();

        return res.status(200).json({
            success: true,
            message: "Session information updated successfully.",
            data: currentSession
        });

    } catch (error) {
        console.error("Error changing session information:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to change session information. Please try again later.",
            error: error.message
        });
    }
};

exports.addAndUpdateSessionPrescriptions = async (req, res) => {
    const file = req.file || {};
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const { _id, prescriptionType, sessionNumber } = req.body;
        console.log("req.body", req.body)

        // Validate required fields
        if (!_id || !sessionNumber || !prescriptionType) {
            if (file.path) deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Booking ID (_id), sessionNumber, and prescriptionType are required."
            });
        }

        const bookings = await Bookings.findById(_id).session(session)
            .populate([
                'session_booking_for_clinic',
                'session_booking_for_doctor',
                'session_booking_user',
                'payment_id'
            ])
            .populate(
                'treatment_id',
                '-service_desc -service_available_at_clinics -service_reviews -service_session_allowed_limit -service_tag -service_doctor -createdAt -updatedAt'
            );

        if (!bookings) {
            if (file.path) deleteFile(file.path);
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const matchedSession = bookings.SessionDates.find(
            session => session.sessionNumber === Number(sessionNumber)
        );

        if (!matchedSession) {
            if (file.path) deleteFile(file.path);
            return res.status(404).json({
                success: false,
                message: "Session number not found in the booking."
            });
        }

        if (matchedSession.status !== 'Completed') {
            if (file.path) deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Cannot add prescription. This session has not been completed."
            });
        }

        const no_of_session_book = bookings.no_of_session_book || 0;

        if (bookings.session_prescriptions.length >= no_of_session_book) {
            if (file.path) deleteFile(file.path);
            return res.status(400).json({
                success: false,
                message: "Cannot add more session prescriptions than the allowed limit."
            });
        }

        // Check if a prescription already exists for this sessionNumber
        const existingPrescriptionIndex = bookings.session_prescriptions.findIndex(
            p => p.sessionNumber === Number(sessionNumber)
        );

        let uploadedResult = null;

        // Upload new file
        if (file.path) {
            uploadedResult = await uploadSingleFile(file);
        }

        // If prescription already exists, update it
        if (existingPrescriptionIndex !== -1) {
            const existing = bookings.session_prescriptions[existingPrescriptionIndex];

            // Delete previous file from cloud if it exists
            if (existing.public_id) {
                await deleteFileCloud(existing.public_id);
            }

            // Update the entry
            bookings.session_prescriptions[existingPrescriptionIndex] = {
                sessionNumber: Number(sessionNumber),
                date: new Date(),
                prescriptionType,
                url: uploadedResult?.url || '',
                public_id: uploadedResult?.public_id || '',
                uploadedAt: new Date()
            };
        } else {
            // Add new prescription
            bookings.session_prescriptions.push({
                sessionNumber: Number(sessionNumber),
                date: new Date(),
                prescriptionType,
                url: uploadedResult?.url || '',
                public_id: uploadedResult?.public_id || '',
                uploadedAt: new Date()
            });
        }

        await bookings.save({ session });
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Prescription added/updated successfully.",
            data: bookings.session_prescriptions.find(p => p.sessionNumber === Number(sessionNumber))
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        console.error("Error adding/updating session prescription:", error);

        if (file.path) {
            deleteFile(file.path);
        }

        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the prescription.",
            error: error.message
        });
    }
};
exports.addNextSessionDate = async (req, res) => {
    try {
        const { bookingId, new_date, new_time } = req.body;

        if (!bookingId || !new_date || !new_time) {
            return res.status(400).json({
                success: false,
                message: "Booking ID, new date, and new time are required."
            });
        }

        const booking = await Bookings.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        // Get the last session in the booking
        const lastSession = booking.SessionDates[booking.SessionDates.length - 1];

        // Check if the last session is completed OR cancelled
        if (lastSession && !["Completed", "Cancelled"].includes(lastSession.status)) {
            return res.status(400).json({
                success: false,
                message: "Next session can only be added after the previous session is completed or cancelled."
            });
        }


        // Check if session limit is reached
        if (booking.SessionDates.length >= booking.no_of_session_book) {
            return res.status(400).json({
                success: false,
                message: "Cannot add more sessions than the allowed limit."
            });
        }

        // Add the next session
        const nextSessionNumber = booking.SessionDates.length + 1;
        booking.SessionDates.push({
            sessionNumber: nextSessionNumber,
            date: new Date(new_date),
            time: new_time,
            status: 'Pending'
        });

        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Next session date added successfully.",
            data: booking
        });

    } catch (error) {
        console.error("Error adding next session date:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to add next session date. Please try again later.",
            error: error.message
        });
    }
};
// Change session status
exports.changeSessionStatus = async (req, res) => {
    const sessionDb = await mongoose.startSession();
    sessionDb.startTransaction();
    try {
        const { bookingId, sessionNumber, newStatus, reason } = req.body;

        if (!bookingId || !sessionNumber || !newStatus) {
            return res.status(400).json({
                success: false,
                message: "bookingId, sessionNumber, and newStatus are required."
            });
        }

        const booking = await Bookings.findById(bookingId).session(sessionDb);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        const sessionToUpdate = booking.SessionDates.find(
            s => s.sessionNumber === Number(sessionNumber)
        );

        if (!sessionToUpdate) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }

        // Update status
        sessionToUpdate.status = newStatus;
        if (reason) sessionToUpdate.statusReason = reason;

        await booking.save({ session: sessionDb });
        await sessionDb.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Session status updated successfully.",
            data: sessionToUpdate
        });

    } catch (error) {
        await sessionDb.abortTransaction();
        console.error("Error updating session status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update session status.",
            error: error.message
        });
    } finally {
        sessionDb.endSession();
    }
};

// Delete a session
exports.deleteSession = async (req, res) => {
    const sessionDb = await mongoose.startSession();
    sessionDb.startTransaction();
    try {
        const { bookingId, sessionNumber } = req.body;

        if (!bookingId || !sessionNumber) {
            return res.status(400).json({
                success: false,
                message: "bookingId and sessionNumber are required."
            });
        }

        const booking = await Bookings.findById(bookingId).session(sessionDb);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found." });
        }

        // Filter out the session to delete
        const sessionIndex = booking.SessionDates.findIndex(
            s => s.sessionNumber === Number(sessionNumber)
        );

        if (sessionIndex === -1) {
            return res.status(404).json({ success: false, message: "Session not found." });
        }

        booking.SessionDates.splice(sessionIndex, 1);

        // Re-number remaining sessions
        booking.SessionDates = booking.SessionDates.map((s, idx) => ({
            ...s.toObject(),
            sessionNumber: idx + 1
        }));

        await booking.save({ session: sessionDb });
        await sessionDb.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Session deleted successfully.",
            data: booking.SessionDates
        });

    } catch (error) {
        await sessionDb.abortTransaction();
        console.error("Error deleting session:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete session.",
            error: error.message
        });
    } finally {
        sessionDb.endSession();
    }
};
