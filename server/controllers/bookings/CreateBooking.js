const Service = require("../../models/services/services.model");
const mongoose = require("mongoose");
const {
    getRedisClient,
    cleanRedisDataFlush,
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

        console.log("finalAvailabilityCheck",finalAvailabilityCheck)

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

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            booking_id
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
            return res.status(400).json({
                success: false,
                message: "Missing payment verification parameters"
            });
        }

        // Verify payment signature
        const isValidSignature = razorpay.verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValidSignature) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Find booking and payment
        const booking = await Bookings.findById(booking_id).session(session);
        const payment = await Payment.findById(booking.payment_id).session(session);

        if (!booking || !payment) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking or payment record not found"
            });
        }

        // Update payment status
        payment.razorpay_payment_id = razorpay_payment_id;
        payment.razorpay_signature = razorpay_signature;
        payment.payment_status = 'completed';
        payment.completed_at = new Date();
        await payment.save({ session });

        // Update booking status
        booking.session_status = 'Confirmed';
        await booking.save({ session });

        await session.commitTransaction();

        // Clear Redis cache
        await cleanRedisDataFlush();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully. Booking confirmed!",
            data: {
                booking: {
                    id: booking._id,
                    bookingNumber: booking.bookingNumber,
                    status: booking.session_status,
                    nextSession: booking.nextSession
                },
                payment: {
                    id: payment._id,
                    status: payment.payment_status,
                    amount: payment.amount
                }
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error verifying payment:", error);
        return res.status(500).json({
            success: false,
            message: "Payment verification failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        session.endSession();
    }
};

// Handle payment failure
exports.handlePaymentFailure = async (req, res) => {
    try {
        const { booking_id, error_description } = req.body;

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
            payment.payment_status = 'failed';
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