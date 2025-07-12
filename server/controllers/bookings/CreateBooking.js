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

        let findService
        // Find service
        if (service_id) {
            findService = await Service.findById(service_id).session(session);
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
            clinic_id,
            req,
        });

        console.log("checkBookings", checkBookings)


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
                (findService?.service_per_session_discount_price ??
                    findService?.service_per_session_price) ?? 10000;

            const subtotal = basePrice * sessions;

            const taxPercentage = findSettings?.payment_config?.tax_percentage || 0;
            const creditCardFee = findSettings?.payment_config?.credit_card_fee || 0;

            const taxAmount = (subtotal * taxPercentage) / 100;

            const creditCardAmount =
                payment_method === "card" ? (subtotal * creditCardFee) / 100 : 0;

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

    let via = 'web';
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

    console.log("Payment verification started", { ...logContext });

    try {
        const redisClient = getRedisClient(req, res);

        // Extract and validate parameters
        const {
            platform,
            booking_id,
            payment_id,
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            timestamp
        } = req.method === 'GET' ? req.query : { ...req.query, ...req.body };

        bookingId = booking_id;
        paymentId = payment_id;

        // Validate platform
        const allowedPlatforms = ['web', 'app', 'admin'];
        if (platform && allowedPlatforms.includes(platform)) {
            via = platform;
        }

        // Validate required parameters
        const requiredParams = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            booking_id
        };

        const missingParams = Object.keys(requiredParams).filter(key => !requiredParams[key]);

        if (missingParams.length > 0) {
            console.error("Missing required parameters", { missingParams, bookingId, ...logContext });
            await session.abortTransaction();

            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=missing-parameters&missing=${missingParams.join(',')}&booking_id=${booking_id || 'unknown'}`
            );
        }

        // Verify Razorpay signature
        let isValidSignature = false;
        try {
            isValidSignature = razorpay.verifyPayment({
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            });

            console.log("Razorpay signature verification completed", {
                isValid: isValidSignature,
                razorpay_order_id,
                bookingId,
                ...logContext
            });

        } catch (signatureError) {
            console.error("Razorpay signature verification failed", {
                error: signatureError.message,
                bookingId,
                ...logContext
            });

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=signature-verification-failed&booking_id=${booking_id}`
            );
        }

        if (!isValidSignature) {
            console.error("Invalid Razorpay signature", {
                razorpay_order_id,
                bookingId,
                ...logContext
            });

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=invalid-signature&booking_id=${booking_id}`
            );
        }

        // Fetch booking record
        const booking = await Bookings.findById(booking_id)
            .populate('treatment_id')
            .populate('session_booking_user')
            .session(session);

        if (!booking) {
            console.error("Booking not found", { bookingId, ...logContext });
            await session.abortTransaction();

            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=booking-not-found&booking_id=${booking_id}`
            );
        }

        // Fetch payment record
        const payment = await Payment.findById(booking.payment_id).session(session);

        if (!payment) {
            console.error("Payment record not found", {
                bookingId,
                paymentId: booking.payment_id,
                ...logContext
            });

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=payment-not-found&booking_id=${booking_id}`
            );
        }

        console.log("Payment record found", {
            payment_id: payment._id,
            current_status: payment.payment_status,
            amount: payment.amount,
            razorpay_order_id: payment.razorpay_order_id,
            already_processed: !!payment.razorpay_payment_id,
            ...logContext
        });

        // Check if payment is already processed
        if (payment.payment_status === 'completed' && payment.razorpay_payment_id) {
            console.warn("Payment already processed", {
                bookingId,
                payment_id: payment._id,
                existing_razorpay_payment_id: payment.razorpay_payment_id,
                new_razorpay_payment_id: razorpay_payment_id,
                ...logContext
            });

            await session.abortTransaction();

            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-success?sessions=${booking.sessions}&price=${payment.amount}&service=${booking.service_id?.service_name || 'service'}&bookingId=${booking._id}&status=already-processed`
            );
        }

        // Verify order ID match
        if (payment.razorpay_order_id !== razorpay_order_id) {
            console.error("Order ID mismatch", {
                bookingId,
                payment_id: payment._id,
                expected_order_id: payment.razorpay_order_id,
                received_order_id: razorpay_order_id,
                ...logContext
            });

            await session.abortTransaction();
            return res.redirect(
                `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=order-id-mismatch&booking_id=${booking_id}`
            );
        }

        console.log("Updating payment and booking records", { bookingId, paymentId: payment._id });

        // Update payment record
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature = razorpay_signature;
        payment.payment_status = 'completed';
        payment.completed_at = new Date();
        payment.verification_timestamp = new Date();
        payment.verification_ip = req.ip || req.connection.remoteAddress;
        payment.verification_user_agent = req.get('User-Agent');

        await payment.save({ session });

        console.log("Payment record updated successfully", {
            payment_id: payment._id,
            new_status: payment.payment_status,
            ...logContext
        });

        // Update booking record
        booking.session_status = 'Confirmed';
        booking.payment_verified_at = new Date();
        booking.last_updated = new Date();
        booking.bookingSource = via

        const savedBooking = await booking.save({ session });

        console.log("Booking record updated successfully", {
            booking_id: savedBooking._id,
            session_status: savedBooking.session_status,
            payment_verified_at: savedBooking.payment_verified_at,
            ...logContext
        });

        // Commit transaction
        await session.commitTransaction();
        committed = true;

        console.log("Transaction committed successfully", {
            bookingId,
            paymentId: payment._id,
            ...logContext
        });

        // Clear Redis cache
        try {
            await flushAllData(redisClient);
            console.log("Redis cache cleared successfully");
        } catch (cacheError) {
            console.warn("Failed to clear Redis cache (non-critical)", {
                error: cacheError.message,
                ...logContext
            });
        }

        // Return response based on platform
        if (via === 'web') {
            const successUrl = `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-success?bookingId=${booking._id}`;
            console.log("Redirecting to success page", { successUrl, ...logContext });
            return res.redirect(successUrl);
        } else {
            console.log("Returning JSON response for API/app", { bookingId, ...logContext });
            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: {
                    booking_id: booking._id,
                    payment_id: payment._id,
                    session_status: booking.session_status,
                    payment_status: payment.payment_status
                }
            });
        }

    } catch (error) {
        console.error("Payment verification error", {
            error: error.message,
            stack: error.stack,
            booking_id: bookingId,
            payment_id: paymentId,
            committed,
            ...logContext
        });

        // Rollback transaction if not committed
        if (!committed) {
            try {
                await session.abortTransaction();
                console.log("Transaction aborted due to error");
            } catch (abortError) {
                console.error("Failed to abort transaction", {
                    error: abortError.message,
                    ...logContext
                });
            }
        }

        // Determine error type and reason
        const errorType = error.name;
        const reason = errorType === 'ValidationError'
            ? 'validation-error'
            : (errorType === 'MongoError' || errorType === 'MongooseError')
                ? 'database-error'
                : 'verification-failed';

        // Return appropriate response
        if (via === 'web') {
            const redirectUrl = `${process.env.FRONTEND_URL || 'https://drkm.adsdigitalmedia.com'}/booking-failed?reason=${reason}&booking_id=${bookingId || 'unknown'}&error=${encodeURIComponent(error.message)}`;
            return res.redirect(redirectUrl);
        } else {
            return res.status(500).json({
                success: false,
                message: 'Payment verification failed',
                reason,
                error: error.message,
                booking_id: bookingId,
                payment_id: paymentId
            });
        }

    } finally {
        // Always end the session
        try {
            await session.endSession();
            console.log("Database session ended", {
                sessionId: session.id,
                committed,
                ...logContext
            });
        } catch (sessionError) {
            console.error("Failed to end database session", {
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
        if (['Completed', 'Cancelled'].includes(currentSession.session_status)) {
            return res.status(400).json({
                success: false,
                message: "Cannot change session information for completed or cancelled bookings."
            });
        }

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
        const { bookingId, newDate, newTime } = req.body;

        if (!bookingId || !newDate || !newTime) {
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

        // Check if the booking is already completed or cancelled
        if (booking.session_status === 'Completed' || booking.session_status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: "Cannot add a session to a completed or cancelled booking."
            });
        }

        //first check no_of_session_book is alloed to add new sessionNumber and Date
        if (booking.SessionDates.length >= booking.no_of_session_book) {
            return res.status(400).json({
                success: false,
                message: "Cannot add more sessions than the allowed limit."
            });
        }

        // Add the new session date
        const nextSessionNumber = booking.SessionDates.length + 1;
        booking.SessionDates.push({
            sessionNumber: nextSessionNumber,
            date: new Date(newDate),
            time: newTime,
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
}