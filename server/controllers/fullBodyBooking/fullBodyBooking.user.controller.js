const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");

const FullBodyBooking = require("../../models/NewService/FullBodyBooking");
const FullBodyService = require("../../models/NewService/FullBodyService");
const PaymentHistory = require("../../models/NewService/PaymentHistory");
const AppointmentTimeline = require("../../models/NewService/AppointmentTimeline");

const ICICI_MERCHANT_ID = process.env.ICICI_MERCHANT_ID;
const ICICI_AGGREGATOR_ID = process.env.ICICI_AGGREGATOR_ID;
const ICICI_SECRET_KEY = process.env.ICICI_SECRET_KEY;
const ICICI_INITIATE_URL = process.env.ICICI_INITIATE_URL || "https://pgpayuat.icicibank.com/tsp/pg/api/v2/initiateSale";
const ICICI_COMMAND_URL = process.env.ICICI_COMMAND_URL || "https://pgpayuat.icicibank.com/tsp/pg/api/command";
const ICICI_RETURN_URL = process.env.ICICI_RETURN_URL;

function genBookingId() {
    return "FB" + Date.now() + Math.floor(Math.random() * 900 + 100);
}

function genTxnNo() {
    return "TXN" + Date.now() + Math.floor(Math.random() * 900 + 100);
}

function buildSecureHash(paramsInOrder) {
    const hashText = paramsInOrder.join("");
    return crypto.createHmac("sha256", ICICI_SECRET_KEY).update(hashText).digest("hex");
}

function verifySecureHash(payload, receivedHash, paramsInOrder) {
    const expected = buildSecureHash(paramsInOrder);
    return expected === receivedHash;
}

function formatTxnDate(date) {
    const d = date || new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return (
        d.getFullYear() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
    );
}

function isSameDate(d1, d2) {
    const a = new Date(d1);
    const b = new Date(d2);
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// ---------------------------------------------------------------------
// GET AVAILABLE SERVICES (active, not deleted)
// ---------------------------------------------------------------------
exports.getActiveServices = async (req, res) => {
    try {
        const services = await FullBodyService.find({
            is_active: true,
            is_deleted: false
        }).sort({ createdAt: -1 });

        const sanitized = services.map((svc) => {
            const obj = svc.toObject();
            obj.included_services = (obj.included_services || []).filter(
                (item) => item.is_active
            );
            return obj;
        });

        return res.status(200).json({
            success: true,
            data: sanitized
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch services",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// GET SINGLE SERVICE DETAIL (with active included services only)
// ---------------------------------------------------------------------
exports.getServiceDetail = async (req, res) => {
    try {
        const { serviceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ success: false, message: "Invalid service id" });
        }

        const service = await FullBodyService.findOne({
            _id: serviceId,
            is_active: true,
            is_deleted: false
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found or unavailable"
            });
        }

        const obj = service.toObject();
        obj.included_services = (obj.included_services || []).filter((s) => s.is_active);

        return res.status(200).json({ success: true, data: obj });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// CHECK SLOT AVAILABILITY (blocked dates + per_day_booking_allow_limit + same-time conflict)
// ---------------------------------------------------------------------
exports.checkSlotAvailability = async (req, res) => {
    try {
        const { serviceId, appointmentDate, appointmentTime } = req.body;

        if (!serviceId || !appointmentDate) {
            return res.status(400).json({
                success: false,
                message: "serviceId and appointmentDate are required"
            });
        }

        const service = await FullBodyService.findOne({
            _id: serviceId,
            is_active: true,
            is_deleted: false
        });

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found or unavailable"
            });
        }

        const reqDate = new Date(appointmentDate);

        const isBlocked = (service.blocked_dates || []).some((bd) =>
            isSameDate(bd, reqDate)
        );

        if (isBlocked) {
            return res.status(200).json({
                success: true,
                available: false,
                reason: "DATE_BLOCKED",
                message: "Selected date is blocked for this service"
            });
        }

        const startOfDay = new Date(reqDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(reqDate);
        endOfDay.setHours(23, 59, 59, 999);

        const sameDayCount = await FullBodyBooking.countDocuments({
            service: serviceId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            bookingStatus: { $nin: ["cancelled", "no_show"] }
        });

        if (sameDayCount >= service.per_day_booking_allow_limit) {
            return res.status(200).json({
                success: true,
                available: false,
                reason: "DAY_LIMIT_REACHED",
                message: "Booking limit reached for selected date"
            });
        }

        if (appointmentTime) {
            const slotTaken = await FullBodyBooking.findOne({
                service: serviceId,
                appointmentDate: { $gte: startOfDay, $lte: endOfDay },
                appointmentTime: appointmentTime,
                bookingStatus: { $nin: ["cancelled", "no_show"] }
            });

            if (slotTaken) {
                return res.status(200).json({
                    success: true,
                    available: false,
                    reason: "SLOT_ALREADY_BOOKED",
                    message: "Selected time slot is already booked"
                });
            }
        }

        return res.status(200).json({
            success: true,
            available: true,
            message: "Slot available"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to check availability",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// CREATE BOOKING (validates service active, date not blocked, slot free)
// ---------------------------------------------------------------------
exports.createBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const userId = req.user._id;
        const {
            serviceId,
            appointmentDate,
            appointmentTime,
            chiefComplaint,
            clinic,

            selectedIncludedServices,
            notes
        } = req.body;
        console.log(req.body)
        if (!serviceId || !appointmentDate || !appointmentTime) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "serviceId, appointmentDate and appointmentTime are required"
            });
        }

        const service = await FullBodyService.findOne({
            _id: serviceId,
            is_active: true,
            is_deleted: false
        }).session(session);

        if (!service) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Service not found or currently unavailable"
            });
        }
        if (selectedIncludedServices && !Array.isArray(selectedIncludedServices)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "selectedIncludedServices must be an array"
            });
        }
        const reqDate = new Date(appointmentDate);

        const isBlocked = (service.blocked_dates || []).some((bd) =>
            isSameDate(bd, reqDate)
        );
        if (isBlocked) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Selected date is blocked for this service"
            });
        }

        const startOfDay = new Date(reqDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(reqDate);
        endOfDay.setHours(23, 59, 59, 999);

        const sameDayCount = await FullBodyBooking.countDocuments({
            service: serviceId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            bookingStatus: { $nin: ["cancelled", "no_show"] }
        }).session(session);

        if (sameDayCount >= service.per_day_booking_allow_limit) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Booking limit reached for selected date"
            });
        }

        const slotTaken = await FullBodyBooking.findOne({
            service: serviceId,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            appointmentTime: appointmentTime,
            bookingStatus: { $nin: ["cancelled", "no_show"] }
        }).session(session);

        if (slotTaken) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Selected time slot is already booked"
            });
        }

        const price =
            service.discount_price && service.discount_price > 0
                ? service.discount_price
                : service.price;

        const booking = await FullBodyBooking.create(
            [
                {
                    bookingId: genBookingId(),
                    patient: userId,
                    service: serviceId,
                    appointmentDate: reqDate,
                    appointmentTime,
                    amount: price,
                    discountAmount:
                        service.discount_price > 0
                            ? service.price - service.discount_price
                            : 0,
                    paidAmount: 0,
                    dueAmount: price,
                    paymentStatus: "pending",
                    bookingStatus: "scheduled",
                    chiefComplaint: chiefComplaint || "",
                    notes: notes || "",
                    totalVisits: 1,
                    completedVisits: 0,
                    clinic: clinic?._id,
                    selectedIncludedServices: selectedIncludedServices || [],
                }
            ],
            { session }
        );

        await AppointmentTimeline.create(
            [
                {
                    booking: booking[0]._id,
                    action: "booked",
                    remark: "Booking created by patient",
                    createdBy: userId,
                    createdByModel: "User"
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking[0]
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// INITIATE PAYMENT (ICICI Orange PG - Initiate Sale)
// ---------------------------------------------------------------------
exports.initiatePayment = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId, amount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({
                success: false,
                message: "bookingId and amount are required"
            });
        }

        const booking = await FullBodyBooking.findOne({
            _id: bookingId,
            patient: userId
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.bookingStatus === "cancelled") {
            return res.status(409).json({
                success: false,
                message: "Cannot pay for a cancelled booking"
            });
        }

        if (Number(amount) > Number(booking.dueAmount)) {
            return res.status(400).json({
                success: false,
                message: "Amount exceeds due amount"
            });
        }

        const merchantTxnNo = genTxnNo();
        const txnDate = formatTxnDate();
        const amountStr = Number(amount).toFixed(2);
        const customerEmail = req.user.email || "test@gmail.com";
        const customerMobile = req.user.phone || "0000000000";
        const customerName = req.user.name || "Patient";

        const params = {
            addlParam1: bookingId.toString(),
            addlParam2: userId,
            aggregatorID: ICICI_AGGREGATOR_ID,
            amount: amountStr,
            currencyCode: "356",
            customerEmailID: customerEmail,
            customerMobileNo: customerMobile,
            customerName,
            merchantId: ICICI_MERCHANT_ID,
            merchantTxnNo,
            payType: "0",
            returnURL: 'https://api.drrajneeshkant.in/api/v1/full/user/payment/verify',
            transactionType: "SALE",
            txnDate
        };

        const hashOrder = [
            params.addlParam1,
            params.addlParam2,
            params.aggregatorID,
            params.amount,
            params.currencyCode,
            params.customerEmailID,
            params.customerMobileNo,
            params.customerName,
            params.merchantId,
            params.merchantTxnNo,
            params.payType,
            params.returnURL,
            params.transactionType,
            params.txnDate
        ];

        const secureHash = buildSecureHash(hashOrder);
        console.log(secureHash)
        const payload = { ...params, secureHash };

        const iciciRes = await axios.post(ICICI_INITIATE_URL, payload, {
            headers: { "Content-Type": "application/json" }
        });

        const data = iciciRes.data;

        await PaymentHistory.create({
            booking: booking._id,
            amount: Number(amount),
            mode: "card",
            transactionId: merchantTxnNo,
            remarks: "Payment initiated - awaiting confirmation"
        });

        return res.status(200).json({
            success: true,
            message: "Payment initiated",
            data: {
                merchantTxnNo,
                redirectURI: data.redirectURI || data.redirectURl || null,
                tranCtx: data.tranCtx || null,
                raw: data
            }
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Failed to initiate payment",
            error: err.response ? err.response.data : err.message
        });
    }
};

// ---------------------------------------------------------------------
// VERIFY PAYMENT (Status Check API) + update booking + ledger + timeline
// ---------------------------------------------------------------------

exports.verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        console.log("ICICI CALLBACK");
        console.log(JSON.stringify(req.body, null, 2));

        const {
            addlParam1: bookingId,
            addlParam2: userId,
            merchantTxnNo,
            responseCode,
            respDescription,
            amount,
            paymentID,
            txnID
        } = req.body;

        if (!bookingId || !merchantTxnNo) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "bookingId and merchantTxnNo are required"
            });
        }

        const booking = await FullBodyBooking.findOne({
            _id: bookingId,
            patient: userId
        }).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // ------------------------------
        // Handle Payment Record
        // ------------------------------
        let paymentRecord = await PaymentHistory.findOne({
            booking: booking._id,
            transactionId: merchantTxnNo
        }).session(session);

        if (!paymentRecord) {
            [paymentRecord] = await PaymentHistory.create(
                [{
                    booking: booking._id,
                    amount: Number(amount || 0),
                    transactionId: merchantTxnNo,
                    gatewayTxnId: txnID,
                    gatewayPaymentId: paymentID,
                    remarks: "Payment callback received"
                }],
                { session, ordered: true }
            );
        }

        // ------------------------------
        // Idempotency check
        // ------------------------------
        if (paymentRecord.status === "success") {
            await session.commitTransaction();
            const redirect_url = `https://drrajneeshkant.in/payment/success?order_id=${booking?._id}&merchent=${ICICI_MERCHANT_ID}&redirect_via=dashboard&pay_via=icici`;

            return res.redirect(redirect_url);


        }

        // ------------------------------
        // ICICI Callback Success Check
        // ------------------------------
        const callbackSuccess = responseCode === "0000";

        if (!callbackSuccess) {
            paymentRecord.status = "failed";
            paymentRecord.remarks = respDescription || "Payment failed";

            await paymentRecord.save({ session });
            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                paymentSuccess: false,
                message: "Payment failed",
                data: req.body
            });
        }

        // ------------------------------
        // Optional STATUS API Verify
        // ------------------------------
        let statusVerified = true;

        try {
            const statusParams = {
                merchantId: ICICI_MERCHANT_ID,
                aggregatorID: ICICI_AGGREGATOR_ID,
                merchantTxnNo,
                originalTxnNo: merchantTxnNo,
                transactionType: "STATUS"
            };

            const secureHash = buildSecureHash([
                statusParams.aggregatorID,
                statusParams.merchantId,
                statusParams.merchantTxnNo,
                statusParams.originalTxnNo,
                statusParams.transactionType
            ]);

            const statusRes = await axios.post(
                ICICI_COMMAND_URL,
                { ...statusParams, secureHash },
                { headers: { "Content-Type": "application/json" } }
            );

            console.log("ICICI STATUS RESPONSE", JSON.stringify(statusRes.data, null, 2));

            const result = statusRes.data;

            statusVerified =
                result.txnStatus === "SUC" ||
                result.txnResponseCode === "0000" ||
                result.responseCode === "0000";

        } catch (statusError) {
            console.log("STATUS API FAILED", statusError.message);
            // Trust callback if status API fails
            statusVerified = true;
        }

        if (!statusVerified) {
            paymentRecord.status = "failed";
            paymentRecord.remarks = "Status verification failed";

            await paymentRecord.save({ session });
            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                paymentSuccess: false,
                message: "Payment verification failed"
            });
        }

        // ------------------------------
        // Update Booking
        // ------------------------------
        const paidNow = Number(amount || 0);

        booking.paidAmount = Number(booking.paidAmount || 0) + paidNow;
        booking.dueAmount = Math.max(0, Number(booking.amount) - booking.paidAmount);

        booking.paymentStatus =
            booking.dueAmount <= 0 ? "paid" :
                booking.paidAmount > 0 ? "partial" : "pending";

        if (booking.bookingStatus === "scheduled" || booking.bookingStatus === "payment_pending") {
            booking.bookingStatus = "confirmed";
        }

        await booking.save({ session });

        // ------------------------------
        // Update Payment Record
        // ------------------------------
        paymentRecord.status = "success";
        paymentRecord.gatewayTxnId = txnID;
        paymentRecord.gatewayPaymentId = paymentID;
        paymentRecord.remarks = "Payment verified successfully";

        await paymentRecord.save({ session });

        // ------------------------------
        // Timeline Entries
        // ------------------------------
        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "payment_received",
                    remark: `Payment of ₹${paidNow} received via ICICI Orange PG`,
                    createdBy: userId,
                    createdByModel: "User"
                },
                {
                    booking: booking._id,
                    action: "confirmed",
                    remark: "Booking confirmed after successful payment",
                    createdBy: userId,
                    createdByModel: "User"
                }
            ],
            { session, ordered: true }
        );

        await session.commitTransaction();


        const redirect_url = `https://drrajneeshkant.in/payment/success?order_id=${booking?._id}&merchent=${ICICI_MERCHANT_ID}&redirect_via=dashboard&pay_via=icici`;

        return res.redirect(redirect_url);

    } catch (err) {
        await session.abortTransaction();
        console.error("Payment Verification Error:", err);
        const failed_redirect_url = `https://drrajneeshkant.in/payment/failed?order_id=${booking?._id}&merchent=${ICICI_MERCHANT_ID}&redirect_via=dashboard&pay_via=icici&error=${encodeURIComponent(err.response?.data)}`

        return res.redirect(failed_redirect_url);

        // return res.status(500).json({
        //     success: false,
        //     message: "Failed to verify payment",
        //     error: err.response?.data || err.message
        // });
    } finally {
        session.endSession();
    }
};

// ---------------------------------------------------------------------
// GET MY BOOKINGS
// ---------------------------------------------------------------------
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        const filter = { patient: userId };
        if (status) filter.bookingStatus = status;

        const bookings = await FullBodyBooking.find(filter)
            .populate("service", "title price discount_price tag")
            .populate("assignedDoctor", "name")
            .populate("clinic", "clinic_name clinic_contact_details")
            
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: bookings });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// GET SINGLE BOOKING DETAIL + timeline + payment history
// ---------------------------------------------------------------------
exports.getBookingDetail = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookingId } = req.params;


        const booking = await FullBodyBooking.findOne({
            _id: bookingId,
            patient: userId,
        }).populate("clinic")
            .populate("service")
            .populate("assignedDoctor", "name");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        let selectedIncludedServices = [];

        if (
            booking.selectedIncludedServices?.length &&
            booking.service?.included_services?.length
        ) {
            const selectedIds = booking.selectedIncludedServices.map((id) =>
                String(id)
            );


            booking.service.included_services.forEach((service) => {
                console.log({
                    _id: String(service?._id),
                    title: service?.title,
                });
            });

            selectedIncludedServices = booking.service.included_services
                .filter((service) => {
                    const serviceId = String(service?._id);
                    const matched = selectedIds.includes(serviceId);



                    return matched;
                })
                .map((service) => ({
                    _id: service._id,
                    title: service.title,
                    desc: service.desc,
                    order: service.order,
                }));


        } else {
            console.log("No selectedIncludedServices or included_services found");

        }
        const responseData = {
            bookingId: booking.bookingId,
            bookingMongoId: booking._id,

            appointmentDate: booking.appointmentDate,
            appointmentTime: booking.appointmentTime,

            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            clinic: booking?.clinic,
            amount: booking.amount,
            discountAmount: booking.discountAmount,
            paidAmount: booking.paidAmount,
            dueAmount: booking.dueAmount,

            totalVisits: booking.totalVisits,
            completedVisits: booking.completedVisits,

            doctor: booking.assignedDoctor
                ? {
                    _id: booking.assignedDoctor._id,
                    name: booking.assignedDoctor.name,
                }
                : null,

            service: {
                _id: booking.service?._id,
                title: booking.service?.title,
                desc: booking.service?.desc,
                price: booking.service?.price,
                discount_price: booking.service?.discount_price,
                tag: booking.service?.tag,
            },

            selectedIncludedServices,

            createdAt: booking.createdAt,
        };

        return res.status(200).json({
            success: true,
            message: "Booking details fetched successfully",
            data: responseData,
        });


    } catch (err) {
        console.error("Get Booking Detail Error:", err);


        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking detail",
            error: err.message,
        });

    }
};

// ---------------------------------------------------------------------
// RESCHEDULE (by patient) - checks blocked dates + slot conflict again
// ---------------------------------------------------------------------
exports.rescheduleBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const userId = req.user._id;
        const { bookingId } = req.params;
        const { newDate, newTime, reason } = req.body;

        if (!newDate || !newTime) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "newDate and newTime are required"
            });
        }

        const booking = await FullBodyBooking.findOne({
            _id: bookingId,
            patient: userId
        }).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (["completed", "cancelled"].includes(booking.bookingStatus)) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: `Cannot reschedule a ${booking.bookingStatus} booking`
            });
        }

        const service = await FullBodyService.findOne({
            _id: booking.service,
            is_active: true,
            is_deleted: false
        }).session(session);

        if (!service) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Service is currently unavailable"
            });
        }

        const reqDate = new Date(newDate);

        const isBlocked = (service.blocked_dates || []).some((bd) =>
            isSameDate(bd, reqDate)
        );
        if (isBlocked) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Selected date is blocked for this service"
            });
        }

        const startOfDay = new Date(reqDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(reqDate);
        endOfDay.setHours(23, 59, 59, 999);

        const sameDayCount = await FullBodyBooking.countDocuments({
            service: booking.service,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            bookingStatus: { $nin: ["cancelled", "no_show"] },
            _id: { $ne: booking._id }
        }).session(session);

        if (sameDayCount >= service.per_day_booking_allow_limit) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Booking limit reached for selected date"
            });
        }

        const slotTaken = await FullBodyBooking.findOne({
            service: booking.service,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay },
            appointmentTime: newTime,
            bookingStatus: { $nin: ["cancelled", "no_show"] },
            _id: { $ne: booking._id }
        }).session(session);

        if (slotTaken) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: "Selected time slot is already booked"
            });
        }

        const oldDate = booking.appointmentDate;

        booking.rescheduleHistory.push({
            oldDate,
            newDate: reqDate,
            reason: reason || "",
            changedBy: "patient",
            changedAt: new Date()
        });

        booking.appointmentDate = reqDate;
        booking.appointmentTime = newTime;
        booking.bookingStatus = "scheduled";

        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "rescheduled",
                    remark: reason || "Rescheduled by patient",
                    createdBy: userId,
                    createdByModel: "User"
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Booking rescheduled successfully",
            data: booking
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to reschedule booking",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// CANCEL BOOKING (by patient)
// ---------------------------------------------------------------------
exports.cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const userId = req.user._id;
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await FullBodyBooking.findOne({
            _id: bookingId,
            patient: userId
        }).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (["completed", "cancelled"].includes(booking.bookingStatus)) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: `Booking already ${booking.bookingStatus}`
            });
        }

        booking.bookingStatus = "cancelled";
        booking.cancelledReason = reason || "Cancelled by patient";

        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "cancelled",
                    remark: reason || "Cancelled by patient",
                    createdBy: userId,
                    createdByModel: "User"
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to cancel booking",
            error: err.message
        });
    }
};

// ---------------------------------------------------------------------
// GET MY PAYMENT HISTORY (across all bookings)
// ---------------------------------------------------------------------
exports.getMyPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const myBookings = await FullBodyBooking.find({ patient: userId }).select("_id");
        const bookingIds = myBookings.map((b) => b._id);

        const payments = await PaymentHistory.find({
            booking: { $in: bookingIds }
        })
            .populate({
                path: "booking",
                select: "bookingId appointmentDate appointmentTime service",
                populate: { path: "service", select: "title" }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: payments });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch payment history",
            error: err.message
        });
    }
};