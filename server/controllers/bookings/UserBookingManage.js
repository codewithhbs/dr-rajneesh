const mongoose = require("mongoose");
const Bookings = require("../../models/booking/bookings.sessions.model");
const Payment = require("../../models/booking/payment.model");
const Settings = require("../../models/settings/settings.model");
const { getRedisClient, cleanRedisDataFlush } = require("../../utils/redis.utils");
const { getBookingsByDateAndTimePeriodOnB } = require("./BookingService");

// ================================ USER BOOKING MANAGEMENT CONTROLLERS ================================


exports.getUserBookings = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to view your bookings"
            });
        }

        const { status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

        const query = { session_booking_user: userId };

        // Filter by status if provided
        if (status) {
            query.session_status = status;
        }

        const skip = (page - 1) * limit;
        const sortOrder = order === 'asc' ? 1 : -1;

        const bookings = await Bookings.find(query)
            .populate('treatment_id', 'service_name service_image service_per_session_price')
            .populate('session_booking_for_clinic', 'clinic_name clinic_address clinic_contact')
            .populate('payment_id', 'payment_status amount paymentMethod')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(parseInt(limit));

        const totalBookings = await Bookings.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            data: {
                bookings,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalBookings / limit),
                    totalBookings,
                    hasMore: skip + bookings.length < totalBookings
                }
            }
        });

    } catch (error) {
        console.error("Error fetching user bookings:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve bookings",
            error: error.message
        });
    }
};


exports.getUserSingleBooking = async (req, res) => {
    try {
        // const userId = req.user?._id;
        const { bookingId, userId } = req.params;


        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid booking ID"
            });
        }

        const booking = await Bookings.findOne({
            $or: [
                { _id: bookingId },
                { "sessionDates._id": bookingId }
            ]
        })
            .populate("treatment_id")
            .populate("session_booking_for_clinic")
            .populate(
                "session_booking_for_doctor",
                "doctor_name doctor_specialization"
            )
            .populate("payment_id");
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission to view it"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Booking details retrieved successfully",
            data: booking
        });

    } catch (error) {
        console.error("Error fetching booking details:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve booking details",
            error: error.message
        });
    }
};


exports.userRescheduleSession = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user?._id;
        const { bookingId, sessionNumber, newDate, newTime, reason } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to reschedule session"
            });
        }

        // Validate required fields
        if (!bookingId || !sessionNumber || !newDate || !newTime) {
            return res.status(400).json({
                success: false,
                message: "Booking ID, session number, new date, and new time are required"
            });
        }

        const redisClient = getRedisClient(req);

        // Fetch booking
        const booking = await Bookings.findOne({
            _id: bookingId,
            session_booking_user: userId
        }).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission to modify it"
            });
        }

        // Find the session
        const targetSession = booking.SessionDates.find(
            s => s.sessionNumber === Number(sessionNumber)
        );

        if (!targetSession) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        // Check if session can be rescheduled
        if (['Completed', 'Cancelled'].includes(targetSession.status)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Cannot reschedule a ${targetSession.status.toLowerCase()} session`
            });
        }

        const sessionDate = new Date(targetSession.date);
        const now = new Date();
        const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);

        const settings = await Settings.findOne({ is_active: true }).session(session);
        const minRescheduleHours = settings?.booking_config?.min_reschedule_hours || 24;

        if (hoursUntilSession < minRescheduleHours) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Sessions must be rescheduled at least ${minRescheduleHours} hours in advance`
            });
        }

        const availabilityCheck = await getBookingsByDateAndTimePeriodOnB({
            date: newDate,
            time: newTime,
            clinic_id: booking.session_booking_for_clinic,
            req
        });

        if (!availabilityCheck?.data?.available) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `The selected time slot is not available. Please choose another time.`
            });
        }

        // Reschedule the session
        await booking.rescheduleSession(
            Number(sessionNumber),
            new Date(newDate),
            newTime,
            reason || 'User requested reschedule'
        );

        await session.commitTransaction();

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'booking_availability*');

        return res.status(200).json({
            success: true,
            message: "Session rescheduled successfully",
            data: {
                bookingId: booking._id,
                sessionNumber: targetSession.sessionNumber,
                newDate,
                newTime,
                status: targetSession.status
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error rescheduling session:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reschedule session",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};


exports.userCancelSession = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user?._id;
        const { bookingId, sessionNumber, reason } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to cancel session"
            });
        }

        if (!bookingId || !sessionNumber) {
            return res.status(400).json({
                success: false,
                message: "Booking ID and session number are required"
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: "Please provide a reason for cancellation"
            });
        }

        const redisClient = getRedisClient(req);

        const booking = await Bookings.findOne({
            _id: bookingId,
            session_booking_user: userId
        }).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission to cancel it"
            });
        }

        const targetSession = booking.SessionDates.find(
            s => s.sessionNumber === Number(sessionNumber)
        );

        if (!targetSession) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        if (targetSession.status === 'Cancelled') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Session is already cancelled"
            });
        }

        if (targetSession.status === 'Completed') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Cannot cancel a completed session"
            });
        }

        // Check cancellation policy
        const sessionDate = new Date(targetSession.date);
        const now = new Date();
        const hoursUntilSession = (sessionDate - now) / (1000 * 60 * 60);

        const settings = await Settings.findOne({ is_active: true }).session(session);
        const minCancellationHours = settings?.booking_config?.min_cancellation_hours || 24;
        const refundEligibilityHours = settings?.booking_config?.refund_eligibility_hours || 48;

        // Determine if refund is eligible
        const isRefundEligible = hoursUntilSession >= refundEligibilityHours;

        // Cancel the session
        await booking.cancelSession(Number(sessionNumber), reason);

        // If this is the only session or first session, update booking cancellation
        if (booking.SessionDates.length === 1 || sessionNumber === 1) {
            booking.cancellation = {
                cancelledAt: new Date(),
                cancelledBy: userId,
                cancellationReason: reason,
                refundEligible: isRefundEligible,
                refundAmount: isRefundEligible ? booking.amountPerSession : 0
            };
            booking.session_status = 'Cancelled';
        }

        await booking.save({ session });
        await session.commitTransaction();

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'booking_availability*');

        return res.status(200).json({
            success: true,
            message: "Session cancelled successfully",
            data: {
                bookingId: booking._id,
                sessionNumber: targetSession.sessionNumber,
                cancellationReason: reason,
                refundEligible: isRefundEligible,
                refundAmount: isRefundEligible ? booking.amountPerSession : 0,
                message: isRefundEligible
                    ? "Your refund request has been initiated and will be processed within 5-7 business days"
                    : `Cancellations must be made at least ${refundEligibilityHours} hours in advance for refund eligibility`
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error cancelling session:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel session",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};


exports.userRequestRefund = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId = req.user?._id;
        const { bookingId, refundReason, bankDetails } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to request refund"
            });
        }

        if (!bookingId || !refundReason) {
            return res.status(400).json({
                success: false,
                message: "Booking ID and refund reason are required"
            });
        }

        const booking = await Bookings.findOne({
            _id: bookingId,
            session_booking_user: userId
        })
            .populate('payment_id')
            .session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission"
            });
        }

        // Check if booking is eligible for refund
        if (!booking.cancellation?.refundEligible) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "This booking is not eligible for refund based on the cancellation policy"
            });
        }

        const payment = await Payment.findById(booking.payment_id).session(session);

        if (!payment) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Payment record not found"
            });
        }

        // Check if refund already requested
        if (payment.refund_status === 'requested' || payment.refund_status === 'processed') {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Refund has already been ${payment.refund_status}`
            });
        }

        // Update payment with refund request
        payment.refund_status = 'requested';
        payment.refund_requested_at = new Date();
        payment.refund_reason = refundReason;
        payment.refund_amount = booking.cancellation.refundAmount;

        if (bankDetails) {
            payment.refund_bank_details = bankDetails;
        }

        await payment.save({ session });
        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Refund request submitted successfully. We will process it within 5-7 business days",
            data: {
                bookingId: booking._id,
                refundAmount: payment.refund_amount,
                refundStatus: payment.refund_status,
                requestedAt: payment.refund_requested_at
            }
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error requesting refund:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit refund request",
            error: error.message
        });
    } finally {
        session.endSession();
    }
};


exports.userSessionHelpSupport = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { bookingId, sessionNumber, issueType, description, contactPreference } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to submit support request"
            });
        }

        if (!bookingId || !issueType || !description) {
            return res.status(400).json({
                success: false,
                message: "Booking ID, issue type, and description are required"
            });
        }

        const booking = await Bookings.findOne({
            _id: bookingId,
            session_booking_user: userId
        })
            .populate('treatment_id', 'service_name')
            .populate('session_booking_user', 'name email phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission"
            });
        }

        // Create support ticket (you'll need to create a SupportTicket model)
        const supportTicket = {
            ticketId: `TICKET-${Date.now()}`,
            userId,
            bookingId,
            sessionNumber: sessionNumber || null,
            issueType,
            description,
            contactPreference: contactPreference || 'email',
            status: 'open',
            priority: determineIssuePriority(issueType),
            createdAt: new Date(),
            userDetails: {
                name: booking.session_booking_user.name,
                email: booking.session_booking_user.email,
                phone: booking.session_booking_user.phone
            },
            bookingDetails: {
                bookingNumber: booking.bookingNumber,
                treatmentName: booking.treatment_id?.service_name
            }
        };

        // Here you would save to a SupportTicket collection
        // For now, we'll return the ticket details
        // const savedTicket = await SupportTicket.create(supportTicket);

        // Send notification email to support team
        // await sendSupportNotificationEmail(supportTicket);

        return res.status(201).json({
            success: true,
            message: "Support request submitted successfully. Our team will contact you soon.",
            data: {
                ticketId: supportTicket.ticketId,
                status: supportTicket.status,
                priority: supportTicket.priority,
                estimatedResponseTime: getEstimatedResponseTime(supportTicket.priority)
            }
        });

    } catch (error) {
        console.error("Error submitting support request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to submit support request",
            error: error.message
        });
    }
};


exports.downloadSessionPrescription = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { bookingId, sessionNumber } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to download prescription"
            });
        }

        const booking = await Bookings.findOne({
            _id: bookingId,
            session_booking_user: userId
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found or you don't have permission"
            });
        }

        const prescription = booking.session_prescriptions.find(
            p => p.sessionNumber === Number(sessionNumber)
        );

        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: "Prescription not found for this session"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Prescription retrieved successfully",
            data: {
                url: prescription.url,
                prescriptionType: prescription.prescriptionType,
                uploadedAt: prescription.uploadedAt
            }
        });

    } catch (error) {
        console.error("Error downloading prescription:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to download prescription",
            error: error.message
        });
    }
};


exports.getUserUpcomingSessions = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to view upcoming sessions"
            });
        }

        const bookings = await Bookings.find({
            session_booking_user: userId,
            session_status: { $in: ['Confirmed', 'Pending'] }
        })
            .populate('treatment_id', 'service_name service_image')
            .populate('session_booking_for_clinic', 'clinic_name clinic_address');

        const upcomingSessions = [];
        const now = new Date();

        bookings.forEach(booking => {
            booking.SessionDates.forEach(session => {
                if (
                    new Date(session.date) > now &&
                    ['Pending', 'Confirmed'].includes(session.status)
                ) {
                    upcomingSessions.push({
                        bookingId: booking._id,
                        bookingNumber: booking.bookingNumber,
                        sessionNumber: session.sessionNumber,
                        date: session.date,
                        time: session.time,
                        status: session.status,
                        treatment: booking.treatment_id,
                        clinic: booking.session_booking_for_clinic
                    });
                }
            });
        });

        // Sort by date
        upcomingSessions.sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.status(200).json({
            success: true,
            message: "Upcoming sessions retrieved successfully",
            data: {
                sessions: upcomingSessions,
                count: upcomingSessions.length
            }
        });

    } catch (error) {
        console.error("Error fetching upcoming sessions:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve upcoming sessions",
            error: error.message
        });
    }
};


exports.getUserBookingHistory = async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to view booking history"
            });
        }

        const bookings = await Bookings.find({
            session_booking_user: userId,
            session_status: { $in: ['Completed', 'Cancelled'] }
        })
            .populate('treatment_id', 'service_name service_image')
            .populate('session_booking_for_clinic', 'clinic_name')
            .sort({ createdAt: -1 })
            .limit(20);

        return res.status(200).json({
            success: true,
            message: "Booking history retrieved successfully",
            data: bookings
        });

    } catch (error) {
        console.error("Error fetching booking history:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve booking history",
            error: error.message
        });
    }
};

// ================================ HELPER FUNCTIONS ================================


function determineIssuePriority(issueType) {
    const highPriorityIssues = ['emergency', 'medical_concern', 'payment_issue'];
    const mediumPriorityIssues = ['reschedule_urgent', 'doctor_unavailable'];

    if (highPriorityIssues.includes(issueType)) return 'high';
    if (mediumPriorityIssues.includes(issueType)) return 'medium';
    return 'low';
}


function getEstimatedResponseTime(priority) {
    const responseTimes = {
        high: '2-4 hours',
        medium: '24 hours',
        low: '48-72 hours'
    };
    return responseTimes[priority] || '48-72 hours';
}