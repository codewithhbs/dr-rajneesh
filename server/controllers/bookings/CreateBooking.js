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

const razorpay = new RazorpayUtils(
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET
);

exports.createAorderForSession = async (req, res) => {
    let committed = false;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = req.user?._id;
        const {
            payment_method,
            patient_details,
            service_id,
            clinic_id,

            sessions,
            date,
            time,

        } = req.body;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Please login to book a session",
            });
        }
        const redisClient = getRedisClient(req)

        // Required fields list
        const requiredFields = {
            payment_method,
            patient_details,
            service_id,
            clinic_id,
            sessions,
            date,
            time,
        };

        // Find missing ones
        const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => value === undefined || value === null || value === "")
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required field(s): ${missingFields.join(", ")}`,
            });
        }

        // Find service
        const findService = await Service.findById(service_id).session(session);
        if (!findService) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        if (findService?.service_status !== "Booking Open") {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Booking is not open for this treatment",
            });
        }

        // Get settings
        const findSettings = await Settings.findOne({ is_active: true }).session(session);
        if (!findSettings) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: "Settings not configured",
            });
        }

        // Check availability
        const checkBookings = await getBookingsByDateAndTimePeriodOnB({
            date,
            time,
            service_id,
            clinic_id,
            req,
        });

        if (!checkBookings.data?.available) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Booking for ${checkBookings?.data?.date} at ${checkBookings?.data?.time} is full. Please choose another time.`,
            });
        }

        // Calculate pricing
        const calculatePricing = () => {
            const basePrice =
                findService.service_per_session_discount_price ||
                findService.service_per_session_price;
            const subtotal = basePrice * sessions;

            const taxAmount =
                (subtotal * (findSettings.payment_config?.tax_percentage || 0)) / 100;

            const creditCardAmount =
                payment_method === "card"
                    ? (subtotal * (findSettings.payment_config?.credit_card_fee || 0)) / 100
                    : 0;

            const total = subtotal + taxAmount + creditCardAmount;

            return {
                subtotal,
                tax: taxAmount,
                creditCard: creditCardAmount,
                total,
                amountPerSession: basePrice,
            };
        };

        const {
            subtotal,
            tax: taxAmount,
            creditCard: creditCardAmount,
            total,
            amountPerSession,
        } = calculatePricing();

        if (!subtotal || !total) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: "Error calculating pricing. Please try again.",
            });
        }

        // Create Razorpay order
        const amount = Number(total) * 100; // Convert to paise
        const createPaymentData = await razorpay.createPayment({
            amount
        });

        if (!createPaymentData.success) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: "Payment gateway error. Please try again.",
            });
        }

        // Double-check availability before creating booking
        const finalAvailabilityCheck = await getBookingsByDateAndTimePeriodOnB({
            date,
            time,
            service_id,
            clinic_id,
            req,
        });



        if (!finalAvailabilityCheck?.data?.available) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Booking for ${finalAvailabilityCheck?.data?.date} at ${finalAvailabilityCheck?.data?.time} is no longer available.`,
            });
        }

        // Generate session dates
        const generateSessionDates = (startDate, timeSlot) => {
            return [
                {
                    sessionNumber: 1,
                    date: new Date(startDate),
                    time: timeSlot,
                    status: 'Pending',
                },
            ];
        };


        const sessionDates = generateSessionDates(date, time);

        // Create payment record
        const paymentRecord = new Payment({
            user_id: user,
            razorpay_order_id: createPaymentData.order.id,
            amount: total,

            paymentMethod: payment_method,
            status: 'pending',
            payment_details: {
                subtotal,
                tax: taxAmount,
                creditCardFee: creditCardAmount,
                total
            },
            paidAt: new Date()
        });

        const savedPayment = await paymentRecord.save({ session });

        // Create booking
        const newBooking = new Bookings({
            treatment_id: service_id,
            no_of_session_book: sessions,
            patient_details,
            SessionDates: sessionDates,
            session_booking_user: user,
            session_booking_for_clinic: clinic_id,
            session_booking_for_doctor: "68526dc0730bac32941b587c",
            session_status: 'Payment Not Completed',
            payment_id: savedPayment._id,
            totalAmount: total,
            amountPerSession: amountPerSession,
            bookingSource: 'web'
        });

        const savedBooking = await newBooking.save({ session });

        // Update payment with booking reference
        savedPayment.bookingId = savedBooking._id;
        await savedPayment.save({ session });

        await session.commitTransaction();
        committed = true;
        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'booking_availability*');

        return res.status(201).json({
            success: true,
            message: "Booking created successfully. Please complete payment.",
            data: {
                booking: {
                    id: savedBooking._id,
                    bookingNumber: savedBooking.bookingNumber,
                    sessionDates: savedBooking.SessionDates,
                    totalAmount: savedBooking.totalAmount,
                    status: savedBooking.session_status
                },
                payment: {
                    orderId: createPaymentData.order.id,
                    amount: total,
                    currency: 'INR',
                    key: createPaymentData?.key
                },
                razorpayOrder: createPaymentData.order
            }
        });

    } catch (error) {
        if (!committed) {
            await session.abortTransaction();
        }
        console.error("Error creating booking:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        session.endSession();
    }
};

// Verify payment and update booking status
exports.verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    let committed = false;
    let bookingId = null;
    let paymentId = null;

    const logContext = {
        timestamp: new Date().toISOString(),
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: session.id
    };

    console.log("🔍 Payment verification started", logContext);

    try {
        const redisClient = getRedisClient(req, res);

        // Extract parameters from both query and body
        const {
            booking_id,
            payment_id,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            timestamp
        } = req.method === 'GET' ? req.query : { ...req.query, ...req.body };

        bookingId = booking_id;
        paymentId = payment_id;



        // Validate required parameters
        const missingParams = [];
        if (!razorpay_order_id) missingParams.push('razorpay_order_id');
        if (!razorpay_payment_id) missingParams.push('razorpay_payment_id');
        if (!razorpay_signature) missingParams.push('razorpay_signature');
        if (!booking_id) missingParams.push('booking_id');

        if (missingParams.length > 0) {


            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=missing-parameters&missing=${missingParams.join(',')}&booking_id=${booking_id || 'unknown'}`
            );
        }

        console.log("🔐 Verifying Razorpay signature");

        // Verify Razorpay signature
        let isValidSignature = false;
        try {
            isValidSignature = razorpay.verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });

            console.log("✅ Razorpay signature verification result", {
                isValid: isValidSignature,
                razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id.substring(0, 10) + "...",
                ...logContext
            });

        } catch (signatureError) {

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=signature-verification-failed&booking_id=${booking_id}`
            );
        }

        if (!isValidSignature) {
            console.error("❌ Invalid Razorpay signature", {
                razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id.substring(0, 10) + "...",
                booking_id,
                ...logContext
            });

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=invalid-signature&booking_id=${booking_id}`
            );
        }

        console.log("🔍 Fetching booking and payment records from database");

        // Fetch booking and payment records
        const booking = await Bookings.findById(booking_id)
            .populate('treatment_id')
            .populate('session_booking_user')
            .session(session);

        if (!booking) {


            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=booking-not-found&booking_id=${booking_id}`
            );
        }



        const payment = await Payment.findById(booking.payment_id).session(session);

        if (!payment) {


            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=payment-not-found&booking_id=${booking_id}`
            );
        }

        console.log("💳 Payment record found", {
            payment_id: payment._id,
            current_status: payment.payment_status,
            amount: payment.amount,
            razorpay_order_id: payment.razorpay_order_id,
            already_processed: payment.razorpay_payment_id ? true : false,
            ...logContext
        });

        // Check if payment is already processed
        if (payment.payment_status === 'completed' && payment.razorpay_payment_id) {
            console.warn("⚠️ Payment already processed", {
                booking_id,
                payment_id: payment._id,
                existing_razorpay_payment_id: payment.razorpay_payment_id,
                new_razorpay_payment_id: razorpay_payment_id,
                ...logContext
            });

            await session.abortTransaction();

            // Redirect to success page since payment is already completed
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-success?sessions=${booking.sessions}&price=${payment.amount}&service=${booking.service_id?.service_name || 'service'}&bookingId=${booking._id}&status=already-processed`
            );
        }

        // Verify the order ID matches
        if (payment.razorpay_order_id !== razorpay_order_id) {
            console.error("❌ Order ID mismatch", {
                booking_id,
                payment_id: payment._id,
                expected_order_id: payment.razorpay_order_id,
                received_order_id: razorpay_order_id,
                ...logContext
            });

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=order-id-mismatch&booking_id=${booking_id}`
            );
        }

        console.log("💾 Updating payment and booking records");

        // Update payment record
        const paymentUpdateData = {
            razorpay_payment_id,
            razorpay_signature,
            status: 'completed',
            completed_at: new Date(),
            verification_timestamp: new Date(),
            verification_ip: req.ip || req.connection.remoteAddress,
            verification_user_agent: req.get('User-Agent')
        };

        Object.assign(payment, paymentUpdateData);
        await payment.save({ session });

        console.log("✅ Payment record updated", {
            payment_id: payment._id,
            razorpay_payment_id: razorpay_payment_id.substring(0, 10) + "...",
            new_status: payment.payment_status,
            ...logContext
        });

        // Update booking record
        const bookingUpdateData = {
            session_status: 'Confirmed',
            payment_verified_at: new Date(),
            last_updated: new Date()
        };

        Object.assign(booking, bookingUpdateData);
        await booking.save({ session });



        // Commit transaction
        await session.commitTransaction();
        committed = true;



        // Clear Redis cache
        try {
            await flushAllData(redisClient);
            console.log("🗑️ Redis cache cleared");
        } catch (cacheError) {
            console.error("⚠️ Failed to clear Redis cache (non-critical)", {
                error: cacheError.message,
                ...logContext
            });
        }

        // Prepare success redirect URL
        const successUrl = new URL(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-success?bookingId=${booking?._id}`);

        return res.redirect(successUrl.toString());

    } catch (error) {
        console.error("🚨 Payment verification error", {
            error: error.message,
            stack: error.stack,
            booking_id: bookingId,
            payment_id: paymentId,
            committed,
            ...logContext
        });

        // Abort transaction if not committed
        if (!committed) {
            try {
                await session.abortTransaction();
                console.log("🔄 Transaction aborted due to error");
            } catch (abortError) {
                console.error("🚨 Failed to abort transaction", {
                    error: abortError.message,
                    ...logContext
                });
            }
        }

        // Log error details for debugging
        const errorDetails = {
            message: error.message,
            type: error.constructor.name,
            booking_id: bookingId,
            payment_id: paymentId,
            timestamp: new Date().toISOString()
        };

        // Determine appropriate error response
        if (error.name === 'ValidationError') {
            console.error("📋 Validation error during payment verification", errorDetails);
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=validation-error&booking_id=${bookingId || 'unknown'}`
            );
        }

        if (error.name === 'MongoError' || error.name === 'MongooseError') {
            console.error("🗄️ Database error during payment verification", errorDetails);
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=database-error&booking_id=${bookingId || 'unknown'}`
            );
        }

        // Generic error response
        return res.redirect(
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking-failed?reason=verification-failed&booking_id=${bookingId || 'unknown'}&error=${encodeURIComponent(error.message)}`
        );

    } finally {
        // Ensure session is always ended
        try {
            await session.endSession();
            console.log("🔚 Database session ended", {
                sessionId: session.id,
                committed,
                ...logContext
            });
        } catch (sessionError) {
            console.error("🚨 Failed to end database session", {
                error: sessionError.message,
                sessionId: session.id,
                ...logContext
            });
        }
    }
};


// Handle payment failure
exports.handlePaymentFailure = async (req, res) => {
    try {
        const { booking_id, error_description } = req.body;
        console.log(req.body)

        if (!booking_id) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required"
            });
        }

        const booking = await Bookings.findById(booking_id);
        const payment = await Payment.findById(booking.payment_id);

        if (booking) {
            booking.session_status = 'Cancelled';
            booking.cancellation = {
                cancelledAt: new Date(),
                cancelledBy: booking.session_booking_user,
                cancellationReason: 'Payment Issue',
                refundEligible: false
            };
            await booking.save();
        }

        if (payment) {
            payment.status = 'failed';
            payment.failure_reason = error_description;
            await payment.save();
        }

        return res.status(200).json({
            success: true,
            message: "Payment failure handled successfully"
        });

    } catch (error) {
        console.error("Error handling payment failure:", error);
        return res.status(500).json({
            success: false,
            message: "Error handling payment failure"
        });
    }
};


exports.foundBookingViaId = async (req, res) => {
    try {
        // Validate user authentication
        const user = req.user?._id;
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Please log in to view your bookings."
            });
        }

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

        console.log(`Finding booking ${id} for user ${user}`);

        // Find booking with proper query structure
        const foundBooking = await Bookings.findOne({
            _id: id,
            session_booking_user: user
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