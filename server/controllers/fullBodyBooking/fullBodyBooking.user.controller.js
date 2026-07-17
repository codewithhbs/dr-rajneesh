const mongoose = require("mongoose");
const crypto = require("crypto");
const axios = require("axios");

const FullBodyBooking = require("../../models/NewService/FullBodyBooking");
const FullBodyService = require("../../models/NewService/FullBodyService");
const PaymentHistory = require("../../models/NewService/PaymentHistory");
const AppointmentTimeline = require("../../models/NewService/AppointmentTimeline");
const { sendEmail } = require("../../utils/sendEmail");

const ICICI_MERCHANT_ID = process.env.ICICI_MERCHANT_ID;
const ICICI_AGGREGATOR_ID = process.env.ICICI_AGGREGATOR_ID;
const ICICI_SECRET_KEY = process.env.ICICI_SECRET_KEY;
const ICICI_INITIATE_URL = process.env.ICICI_INITIATE_URL || "https://pgpay.icicibank.com/pg/api/v2/initiateSale";
const ICICI_COMMAND_URL = process.env.ICICI_COMMAND_URL || "https://pgpay.icicibank.com/pg/api/command";
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
                    clinic: clinic ? clinic : clinic?._id,
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
        console.log(err.message)
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
        const { bookingId, amount, source = "web" } = req.body;
        console.log("source", source)
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

        // if (Number(amount) > Number(booking.dueAmount)) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Amount exceeds due amount"
        //     });
        // }

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
            returnURL: `http://192.168.1.21:7900/api/v1/full/user/payment/verify?source=${source}`,
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


const SUCCESS_URL = (id) =>
    `https://drrajneeshkant.in?order_id=${id}&merchent=${ICICI_MERCHANT_ID}&redirect_via=dashboard&pay_via=icici`;
const FAILED_URL = (id, reason) =>
    `https://drrajneeshkant.in/payment/failed?order_id=${id}&merchent=${ICICI_MERCHANT_ID}&redirect_via=dashboard&pay_via=icici&reason=${encodeURIComponent(reason || "declined")}`;
const PENDING_URL = (id) =>
    `https://drrajneeshkant.in/payment/pending?order_id=${id}&merchent=${ICICI_MERCHANT_ID}&redirect_via=dashboard&pay_via=icici`;

const APP_SCREEN = {
    SUCCESS: "BookingResult",
    FAILED: "BookingResult",
    PENDING: "BookingResult"
};

function respond(res, isApp, status, { bookingId, txnId, amount, message, summary }) {
    if (isApp) {
        return res.status(200).json({
            success: status === "SUCCESS",
            source: "app",
            status,
            screen: APP_SCREEN[status],
            params: {
                orderId: String(bookingId || ""),
                txnId: txnId || null,
                amount: amount != null ? String(amount) : null,
                payVia: "icici",
                message: message || null,
                status,
                summary: summary || null
            }
        });
    }
    if (status === "SUCCESS") return res.redirect(SUCCESS_URL(bookingId));
    if (status === "PENDING") return res.redirect(PENDING_URL(bookingId));
    return res.redirect(FAILED_URL(bookingId, message));
}

async function fetchIciciStatus(merchantTxnNo) {
    const params = {
        merchantId: ICICI_MERCHANT_ID,
        aggregatorID: ICICI_AGGREGATOR_ID,
        merchantTxnNo,
        originalTxnNo: merchantTxnNo,
        transactionType: "STATUS"
    };
    const secureHash = buildSecureHash([
        params.aggregatorID,
        params.merchantId,
        params.merchantTxnNo,
        params.originalTxnNo,
        params.transactionType
    ]);
    const { data } = await axios.post(
        ICICI_COMMAND_URL,
        { ...params, secureHash },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
    );
    return data;
}

function mapStatus(data) {
    const st = (data?.txnStatus || "").toUpperCase();
    const rc = data?.txnResponseCode || data?.responseCode;
    if (st === "SUC" || rc === "0000" || rc === "000") return "SUCCESS";
    if (st === "REJ" || st === "ERR") return "FAILED";
    return "PENDING";
}

function statusFromRecord(rec) {
    if (rec?.status === "success") return "SUCCESS";
    if (rec?.status === "failed") return "FAILED";
    return null;
}

// booking doc -> summary object for app + email
function buildSummary(booking, user) {
    return {
        bookingRefId: booking.bookingRefId || null,
        serviceTitle: booking.serviceTitle || booking.service?.title || null,
        appointmentDate: booking.appointmentDate ? String(booking.appointmentDate).slice(0, 10) : null,
        appointmentTime: booking.appointmentTime || null,
        name: user?.name || null,
        email: user?.email || null,
        amount: booking.amount || null
    };
}

async function sendConfirmationEmail(user, booking, txnId) {
    if (!user?.email) return;
    const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;">
      <h2 style="color:#1a6b3c;">✅ Booking Confirmed!</h2>
      <p>नमस्ते ${user.name || ""},</p>
      <p>आपकी अपॉइंटमेंट सफलतापूर्वक बुक हो गई है। विवरण नीचे दिए गए हैं:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Booking ID</td><td style="padding:8px;font-weight:600;">${booking.bookingRefId || "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Treatment</td><td style="padding:8px;font-weight:600;">${booking.serviceTitle || booking.service?.title || "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Date</td><td style="padding:8px;font-weight:600;">${booking.appointmentDate ? String(booking.appointmentDate).slice(0, 10) : "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Time</td><td style="padding:8px;font-weight:600;">${booking.appointmentTime || "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Amount Paid</td><td style="padding:8px;font-weight:600;">₹${booking.paidAmount || booking.amount || "-"}</td></tr>
        <tr><td style="padding:8px;color:#666;">Transaction ID</td><td style="padding:8px;font-weight:600;">${txnId || "-"}</td></tr>
      </table>
      <p style="color:#555;">कृपया अपनी अपॉइंटमेंट से <strong>10 मिनट पहले</strong> पहुँचें।</p>
      <p style="color:#555;">Dr. Rajneesh Kant Clinic</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="font-size:12px;color:#999;">यह एक स्वचालित ईमेल है। किसी सहायता के लिए क्लिनिक से संपर्क करें।</p>
    </div>`;

    await sendEmail({
        to: user.email,
        subject: "Booking Confirmed – Dr. Rajneesh Kant Clinic",
        html
    });
}

exports.verifyPayment = async (req, res) => {
    const session = await mongoose.startSession();
    let booking = null;
    const isApp =
        req.query?.source === "app" ||
        req.body?.source === "app" ||
        req.body?.txnChannel === "MOBILE";

    const bookingId = req.body?.addlParam1 || req.body?.bookingId;
    const userId = req.body?.addlParam2 || req.body?.userId;
    const { merchantTxnNo, respDescription, amount, paymentID, txnID } = req.body;

    try {
        session.startTransaction();

        console.log("ICICI CALLBACK", isApp ? "[APP]" : "[WEB]");
        console.log(JSON.stringify(req.body, null, 2));

        if (!bookingId || !merchantTxnNo) {
            await session.abortTransaction();
            return respond(res, isApp, "FAILED", { bookingId, message: "missing_params" });
        }

        const bookingQuery = userId ? { _id: bookingId, patient: userId } : { _id: bookingId };
        booking = await FullBodyBooking.findOne(bookingQuery).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const user = await User.findById(booking.patient).lean();

        let paymentRecord = await PaymentHistory.findOne({
            booking: booking._id,
            transactionId: merchantTxnNo
        }).session(session);

        // already terminal -> short-circuit + include summary
        const terminal = statusFromRecord(paymentRecord);
        if (terminal) {
            await session.commitTransaction();
            return respond(res, isApp, terminal, {
                bookingId: booking._id,
                txnId: paymentRecord.gatewayTxnId,
                amount: paymentRecord.amount,
                message: terminal === "SUCCESS" ? "Payment successful" : (paymentRecord.remarks || "Transaction declined"),
                summary: terminal === "SUCCESS" ? buildSummary(booking, user) : null
            });
        }

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

        let finalStatus = "PENDING";
        let statusData = null;
        try {
            statusData = await fetchIciciStatus(merchantTxnNo);
            console.log("ICICI STATUS RESPONSE", JSON.stringify(statusData, null, 2));
            finalStatus = mapStatus(statusData);
        } catch (statusError) {
            console.log("STATUS API FAILED", statusError.message);
            finalStatus = "PENDING";
        }

        const paidNow = Number(statusData?.amount || amount || 0);
        const gwTxnId = statusData?.txnID || txnID;
        const gwAuthId = statusData?.txnAuthID || statusData?.authCode;

        // FAILED
        if (finalStatus === "FAILED") {
            paymentRecord.status = "failed";
            paymentRecord.gatewayTxnId = gwTxnId;
            paymentRecord.remarks = statusData?.txnRespDescription || respDescription || "Transaction declined";
            await paymentRecord.save({ session });
            await session.commitTransaction();
            return respond(res, isApp, "FAILED", {
                bookingId: booking._id, txnId: gwTxnId, amount: paidNow,
                message: paymentRecord.remarks
            });
        }

        // PENDING
        if (finalStatus === "PENDING") {
            paymentRecord.status = "pending";
            paymentRecord.gatewayTxnId = gwTxnId;
            paymentRecord.remarks = "Awaiting confirmation from gateway";
            await paymentRecord.save({ session });
            await session.commitTransaction();
            return respond(res, isApp, "PENDING", {
                bookingId: booking._id, txnId: gwTxnId, amount: paidNow,
                message: paymentRecord.remarks,
                summary: buildSummary(booking, user)
            });
        }

        // SUCCESS
        booking.paidAmount = Number(booking.paidAmount || 0) + paidNow;
        booking.dueAmount = Math.max(0, Number(booking.amount) - booking.paidAmount);
        booking.paymentStatus = booking.dueAmount <= 0 ? "paid" : booking.paidAmount > 0 ? "partial" : "pending";
        if (booking.bookingStatus === "scheduled" || booking.bookingStatus === "payment_pending") {
            booking.bookingStatus = "confirmed";
        }
        await booking.save({ session });

        paymentRecord.status = "success";
        paymentRecord.gatewayTxnId = gwTxnId;
        paymentRecord.gatewayPaymentId = paymentID || statusData?.paymentInstId;
        paymentRecord.remarks = "Payment verified via STATUS API";
        if (gwAuthId) paymentRecord.authId = gwAuthId;
        await paymentRecord.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "payment_received",
                    remark: `Payment of ₹${paidNow} received via ICICI Orange PG`,
                    createdBy: userId || booking.patient,
                    createdByModel: "User"
                },
                {
                    booking: booking._id,
                    action: "confirmed",
                    remark: "Booking confirmed after successful payment",
                    createdBy: userId || booking.patient,
                    createdByModel: "User"
                }
            ],
            { session, ordered: true }
        );

        await session.commitTransaction();

        // email after commit (non-blocking)
        sendConfirmationEmail(user, booking, gwTxnId).catch((e) =>
            console.error("Confirmation email failed:", e.message)
        );

        return respond(res, isApp, "SUCCESS", {
            bookingId: booking._id,
            txnId: gwTxnId,
            amount: paidNow,
            message: "Payment successful",
            summary: buildSummary(booking, user)
        });

    } catch (err) {
        await session.abortTransaction();
        console.error("Payment Verification Error:", err);
        return respond(res, isApp, "FAILED", {
            bookingId,
            message: err.response?.data?.respDescription || "server_error"
        });
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
        console.log("user id hit me", userId)
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

const ADMIN_EMAIL = "hr.rkmspine@gmail.com";
 
exports.cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
 
        const userId = req.user._id;
        const { bookingId } = req.params;
        const { reason="personal reson" } = req.body;
        console.log( req.body)
 
        const booking = await FullBodyBooking.findOne({ _id: bookingId, patient: userId })
            .populate("patient", "name email phone")
            .populate("service", "title price discount_price")
            .populate("clinic", "clinic_name")
            .session(session);
 
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
 
        if (["completed", "cancelled"].includes(booking.bookingStatus)) {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: `Booking already ${booking.bookingStatus}` });
        }
 
        const cancelReason = reason || "Cancelled by patient";
        booking.bookingStatus = "cancelled";
        booking.cancelledReason = cancelReason;
        await booking.save({ session });
 
        await AppointmentTimeline.create(
            [{ booking: booking._id, action: "cancelled", remark: cancelReason, createdBy: userId, createdByModel: "User" }],
            { session }
        );
 
        await session.commitTransaction();
 
        // emails after commit (non-blocking)
        _sendCancelEmails(booking, cancelReason).catch((e) =>
            console.error("Cancel email failed:", e.message)
        );
 
        return res.status(200).json({ success: true, message: "Booking cancelled successfully", data: booking });
    } catch (err) {
        console.log(err)
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Failed to cancel booking", error: err.message });
    } finally {
        session.endSession();
    }
};
 
async function _sendCancelEmails(booking, reason) {
    const user = booking.patient;
    const serviceName = booking.service?.title || "Full Body Treatment";
    const clinicName  = booking.clinic?.clinic_name || "Dr. Rajneesh Kant Clinic";
    const paidAmount  = booking.paidAmount || 0;
    const apptDate    = booking.appointmentDate ? String(booking.appointmentDate).slice(0, 10) : "-";
    const apptTime    = booking.appointmentTime || "-";
    const bookingRef  = booking.bookingId || String(booking._id);
 
    // ---- email to user ----
    const userHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;">
      <h2 style="color:#c0392b;">❌ Booking Cancelled</h2>
      <p>नमस्ते ${user?.name || ""},</p>
      <p>आपकी निम्नलिखित अपॉइंटमेंट रद्द कर दी गई है:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Booking ID</td>    <td style="padding:8px;font-weight:600;">${bookingRef}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Treatment</td>    <td style="padding:8px;font-weight:600;">${serviceName}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Date</td>         <td style="padding:8px;font-weight:600;">${apptDate}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Time</td>         <td style="padding:8px;font-weight:600;">${apptTime}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Clinic</td>       <td style="padding:8px;font-weight:600;">${clinicName}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Paid Amount</td>  <td style="padding:8px;font-weight:600;">₹${paidAmount}</td></tr>
        <tr>                                        <td style="padding:8px;color:#666;">Reason</td>      <td style="padding:8px;font-weight:600;">${reason}</td></tr>
      </table>
      ${paidAmount > 0
        ? `<p style="color:#555;background:#fff8e1;padding:12px;border-radius:8px;border-left:4px solid #f39c12;">
            💰 <strong>Refund:</strong> यदि आपने भुगतान किया था, तो हमारी टीम जल्द ही आपसे संपर्क कर रिफंड की प्रक्रिया शुरू करेगी।
           </p>`
        : ''}
      <p style="color:#555;">किसी भी प्रश्न के लिए क्लिनिक से संपर्क करें।</p>
      <p style="color:#555;">${clinicName}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
      <p style="font-size:12px;color:#999;">यह एक स्वचालित ईमेल है।</p>
    </div>`;
 
    // ---- email to admin ----
    const adminHtml = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:24px;">
      <h2 style="color:#c0392b;">⚠️ Booking Cancelled – Refund Required</h2>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Booking ID</td>    <td style="padding:8px;font-weight:600;">${bookingRef}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Patient Name</td>  <td style="padding:8px;font-weight:600;">${user?.name || "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Patient Email</td> <td style="padding:8px;font-weight:600;">${user?.email || "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Patient Phone</td> <td style="padding:8px;font-weight:600;">${user?.phone || "-"}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Treatment</td>     <td style="padding:8px;font-weight:600;">${serviceName}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Date</td>          <td style="padding:8px;font-weight:600;">${apptDate}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Time</td>          <td style="padding:8px;font-weight:600;">${apptTime}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Clinic</td>        <td style="padding:8px;font-weight:600;">${clinicName}</td></tr>
        <tr style="border-bottom:1px solid #eee;"><td style="padding:8px;color:#666;">Paid Amount</td>   <td style="padding:8px;font-weight:600;color:${paidAmount > 0 ? '#c0392b' : 'inherit'};">₹${paidAmount}</td></tr>
        <tr>                                        <td style="padding:8px;color:#666;">Cancel Reason</td><td style="padding:8px;font-weight:600;">${reason}</td></tr>
      </table>
      ${paidAmount > 0
        ? `<p style="background:#fdecea;padding:12px;border-radius:8px;border-left:4px solid #c0392b;color:#c0392b;font-weight:600;">
            ₹${paidAmount} refund pending – please process manually via ICICI PG dashboard.
           </p>`
        : `<p style="color:#555;">No payment was made. No refund required.</p>`}
    </div>`;
 
    const promises = [];
    if (user?.email) {
        promises.push(sendEmail({ to: user.email, subject: `Booking Cancelled – ${bookingRef}`, html: userHtml }));
    }
    promises.push(sendEmail({ to: ADMIN_EMAIL, subject: `[REFUND REQUIRED] Booking ${bookingRef} cancelled by patient`, html: adminHtml }));
    await Promise.allSettled(promises);
}
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