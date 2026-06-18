const Service = require("../../models/services/services.model");
const mongoose = require("mongoose");
const {
    getRedisClient,
    cleanRedisDataFlush,
    flushAllData,
} = require("../../utils/redis.utils");
const Bookings = require("../../models/booking/bookings.sessions.model");
const Clinic = require("../../models/clinic/clinic.model");

const Settings = require("../../models/settings/settings.model");
const Payment = require("../../models/booking/payment.model"); // Assuming you have a payment model
const { getBookingsByDateAndTimePeriodOnB } = require("./BookingService");
const { uploadSingleFile, deleteFileCloud } = require("../../utils/upload");
const { deleteFile } = require("../../middleware/multer");
const AddOn = require("../../models/services/addon.model");

const crypto = require("crypto");

const { createRazarpayPayment, verifyRazarpayPayment } = require("../../gateways/razorpay");
const { createPhonePePayment, verifyPhonePePayment } = require("../../gateways/phonepe");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const { sendWhatsApp } = require("../../utils/sendWhatsappMessages");
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;

const generateInvoicePDF = async (bookingData) => {
    return new Promise((resolve, reject) => {
        try {
            const {
                bookingNumber,
                patient_details,
                treatment_id,
                session_booking_for_clinic,
                SessionDates,
                totalAmount,
                amountPerSession,
                addOns = [],
                createdAt
            } = bookingData;

            const fs = require('fs');
            const path = require('path');
            const PDFDocument = require('pdfkit');

            // Create invoices directory
            const invoiceDir = path.join(process.cwd(), "invoices");
            if (!fs.existsSync(invoiceDir)) {
                fs.mkdirSync(invoiceDir, { recursive: true });
            }

            const fileName = `invoice_${bookingNumber}_${Date.now()}.pdf`;
            const filePath = path.join(invoiceDir, fileName);

            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // ====================== HEADER ======================
            doc.fontSize(18)
                .font("Helvetica-Bold")
                .fillColor('#1e40af')
                .text("BACK TO NATURE SPINE CLINIC", 50, 40);

            doc.fontSize(10)
                .font("Helvetica")
                .fillColor('#374151')
                .text("Dr. Rajneesh Kant", 50, 70)
                .text("Spine & Pain Management Specialist", 50, 85);

            // Clinic Contact
            const clinicDetails = session_booking_for_clinic?.clinic_contact_details || {};

            const address = clinicDetails?.clinic_address || "N/A";

            const phoneNumbers = Array.isArray(clinicDetails?.phone_numbers)
                ? clinicDetails.phone_numbers.join(", ")
                : clinicDetails?.phone_numbers || "N/A";

            doc.fontSize(9)
                .text(`Address: ${address}`, 50, 105, { width: 300 })
                .text(`Phone: ${phoneNumbers}`, 50, 130, { width: 300 });

            // Invoice Title & Details (Right Side)
            doc.fontSize(18)
                .font("Helvetica-Bold")
                .fillColor('#1e40af')
                .text("INVOICE", 400, 45, { align: "right" });

            doc.fontSize(10)
                .font("Helvetica")
                .fillColor('#6b7280')
                .text(`Invoice No: ${bookingNumber}`, 400, 80, { align: "right" })
                .text(`Date: ${new Date(createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })}`, 400, 105, { align: "right" });

            // Horizontal Line
            doc.moveTo(50, 160).lineTo(545, 160).lineWidth(1).stroke('#e5e7eb');

            // ====================== PATIENT INFO ======================
            doc.fontSize(11)
                .font("Helvetica-Bold")
                .fillColor('#1f2937')
                .text("Patient Details", 50, 180);

            doc.fontSize(10)
                .font("Helvetica")
                .fillColor('#374151')
                .text(`Name: ${patient_details.name}`, 50, 200)
                .text(`Email: ${patient_details.email}`, 50, 215)
                .text(`Phone: ${patient_details.phone}`, 50, 230);

            // ====================== TREATMENT INFO ======================
            doc.fontSize(11)
                .font("Helvetica-Bold")
                .text("Treatment Details", 300, 180);

            doc.fontSize(9)
                .font("Helvetica")
                .text(`Service: ${treatment_id.service_name}`, 300, 200, { width: 300 })
                .text(`Sessions Booked: ${bookingData.no_of_session_book || 1}`, 300, 215);

            if (SessionDates && SessionDates.length > 0) {
                const session = SessionDates[0];
                doc.text(`Date: ${new Date(session.date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                })}`, 300, 230);
            }

            // Horizontal Line
            doc.moveTo(50, 255).lineTo(545, 255).stroke('#e5e7eb');

            // ====================== PAYMENT SUMMARY ======================
            const tableTop = 275;
            let y = tableTop;

            doc.fontSize(11)
                .font("Helvetica-Bold")
                .fillColor('#1f2937')
                .text("Payment Summary", 50, y);

            y += 25;

            // Table Header
            doc.fontSize(10)
                .font("Helvetica-Bold")
                .text("Description", 50, y)
                .text("Qty", 320, y)
                .text("Rate", 380, y)
                .text("Amount", 480, y, { align: "right" });

            doc.moveTo(50, y + 15).lineTo(545, y + 15).stroke('#d1d5db');
            y += 30;

            // Main Service
            doc.fontSize(10)
                .font("Helvetica")
                .text(treatment_id.service_name, 50, y)
                .text(bookingData.no_of_session_book?.toString() || "1", 320, y)
                .text(`Rs ${amountPerSession.toLocaleString('en-IN')}`, 380, y)
                .text(`Rs ${(amountPerSession * (bookingData.no_of_session_book || 1)).toLocaleString('en-IN')}`, 480, y, { align: "right" });

            y += 25;

            // Add-ons
            if (addOns && addOns.length > 0) {
                addOns.forEach((addon) => {
                    doc.fontSize(9.5)
                        .text(`• ${addon.title}`, 50, y)
                        .text("1", 320, y)
                        .text(`Rs ${addon.price.toLocaleString('en-IN')}`, 380, y)
                        .text(`Rs ${addon.price.toLocaleString('en-IN')}`, 480, y, { align: "right" });
                    y += 20;
                });
            }

            y += 15;

            // Total Line
            doc.moveTo(50, y).lineTo(545, y).stroke('#1e40af');
            y += 20;

            doc.fontSize(12)
                .font("Helvetica-Bold")
                .fillColor('#1e40af')
                .text("TOTAL AMOUNT", 50, y)
                .text(`Rs ${totalAmount.toLocaleString('en-IN')}`, 480, y, { align: "right" });

            y += 40;

            // ====================== PAYMENT STATUS ======================
            doc.fontSize(10)
                .font("Helvetica-Bold")
                .fillColor('#166534')
                .text("Payment Status: PAY AT CLINIC", 50, y);

            y += 35;

            // ====================== NOTES ======================
            doc.fontSize(9)
                .font("Helvetica")
                .fillColor('#4b5563')
                .text("Important Notes:", 50, y);

            y += 15;
            doc.fontSize(8.5)
                .text("• Please arrive 10 minutes early for your appointment.", 60, y)
                .text("• Bring this invoice or booking number on the day of visit.", 60, y + 12)
                .text("• Cancellation/Rescheduling must be done 24 hours in advance.", 60, y + 24)
                .text("• This is a computer-generated receipt and does not require signature.", 60, y + 36);

            y += 70;

            // ====================== FOOTER ======================
            doc.fontSize(8)
                .font("Helvetica")
                .fillColor('#6b7280')
                .text("Thank you for choosing Back to Nature Spine Clinic", 50, y, { align: "center" })
                .text("Dr. Rajneesh Kant | Spine & Pain Management Specialist", 50, y + 15, { align: "center" })
                .text("© 2026 Back to Nature Spine Clinic. All Rights Reserved.", 50, y + 30, { align: "center" });

            doc.end();

            stream.on("finish", () => resolve(filePath));
            stream.on("error", (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};


/**
 * Helper function to format time
 */
const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":");
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
};


/**
 * Create Booking for Session with Invoice & WhatsApp
 */
exports.createBookingForSession = async (req, res) => {
    const session = await mongoose.startSession();
    const redis = getRedisClient(req);

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
            addons = []
        } = req.body;

        // ==================== VALIDATION ====================

        if (!userId) {
            throw new Error("Unauthorized user");
        }

        const allowedMethods = ["razorpay", "phonepe", "pay_at_clinic"];

        if (!allowedMethods.includes(payment_method)) {
            throw new Error("Invalid payment method");
        }

        if (!patient_details?.name || !patient_details?.email || !patient_details?.phone) {
            throw new Error("Incomplete patient details");
        }

        // ==================== SLOT LOCK (REDIS) ====================

        const slotKey = `slot_lock:${clinic_id}:${date}:${time}`;

        const slotLocked = await redis.set(slotKey, "locked", {
            NX: true,
            EX: 120
        });

        if (!slotLocked) {
            throw new Error("This slot is being booked by another user.");
        }

        // ==================== SERVICE VALIDATION ====================

        const service = await Service.findById(service_id).session(session);

        if (!service) {
            throw new Error("Service not found");
        }

        if (service.service_status !== "Booking Open") {
            throw new Error("Booking closed for this service");
        }

        // ==================== RACE CONDITION CHECK ====================

        const existingBooking = await Bookings.findOne({
            session_booking_for_clinic: clinic_id,
            "SessionDates.date": new Date(date),
            "SessionDates.time": time,
            session_status: { $in: ["Pending", "Confirmed"] }
        }).session(session);

        if (existingBooking) {
            throw new Error("Selected slot already booked");
        }

        // ==================== ADDONS ====================

        let addOnsData = [];
        let addOnsTotal = 0;

        if (addons.length) {
            const addOnDocs = await AddOn.find({
                _id: { $in: addons },
                is_active: true
            }).session(session);

            addOnsData = addOnDocs.map(a => ({
                addOnId: a._id,
                title: a.title,
                price: a.price
            }));

            addOnsTotal = addOnDocs.reduce((sum, a) => sum + a.price, 0);
        }

        // ==================== SETTINGS ====================

        const settings = await Settings.findOne({ is_active: true }).session(session);

        if (!settings) {
            throw new Error("System settings not configured");
        }

        // ==================== PRICE CALCULATION ====================

        const basePrice =
            service.service_per_session_discount_price ||
            service.service_per_session_price ||
            0;

        const subtotal = basePrice * sessions;

        const subtotalWithAddOns = subtotal + addOnsTotal;

        const taxPercent = settings?.payment_config?.tax_percentage || 0;

        const taxAmount = (subtotalWithAddOns * taxPercent) / 100;

        const total =
            payment_method === "pay_at_clinic"
                ? subtotalWithAddOns
                : subtotalWithAddOns + taxAmount;

        // ==================== SESSION STRUCTURE ====================

        const sessionDates = [{
            sessionNumber: 1,
            date: new Date(date),
            time,
            status: "Pending"
        }];

        // ==================== CREATE BOOKING ====================

        const clinic = await Clinic.findById(clinic_id).session(session);

        const booking = new Bookings({
            treatment_id: service_id,
            no_of_session_book: sessions,
            patient_details,
            SessionDates: sessionDates,
            session_booking_user: userId,
            session_booking_for_clinic: clinic_id,
            session_booking_for_doctor: service?.service_doctor,
            session_status:
                payment_method === "pay_at_clinic"
                    ? "Confirmed"
                    : "Payment Not Completed",
            totalAmount: total,
            amountPerSession: basePrice,
            addOns: addOnsData,
            addOnsTotal,
            bookingSource: "web"
        });

        const savedBooking = await booking.save({ session });

        // ==================== CREATE PAYMENT ====================

        const payment = new Payment({
            userId,
            bookingId: savedBooking._id,
            amount: total,
            paymentMethod: payment_method,
            status: payment_method === "pay_at_clinic" ? "completed" : "pending",
            paymentDetails: {
                subtotal,
                addOnsTotal,
                tax: taxAmount,
                total
            }
        });

        const savedPayment = await payment.save({ session });

        savedBooking.payment_id = savedPayment._id;

        await savedBooking.save({ session });

        // ==================== PAY AT CLINIC ====================

        if (payment_method === "pay_at_clinic") {
            try {
                // Get full booking details for invoice
                const bookingWithDetails = await Bookings.findById(savedBooking._id)
                    .populate("treatment_id")
                    .populate("session_booking_for_clinic")
                    .session(session);

                // Generate invoice PDF
                console.log("Generating invoice PDF...");
                const invoicePath = await generateInvoicePDF(bookingWithDetails);

                console.log("Invoice generated at:", invoicePath);

                // Commit transaction before sending WhatsApp (to avoid holding locks)
                await session.commitTransaction();
                await redis.del(slotKey);

                // Prepare WhatsApp message
                const sessionDate = new Date(bookingWithDetails.SessionDates[0].date);
                const formattedDate = sessionDate.toLocaleDateString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                });

                const whatsappMessage = `
✅ *Booking Confirmed!*
 
Booking Number: ${bookingWithDetails.bookingNumber}
Patient Name: ${patient_details.name}
 
📋 *Treatment Details*
Service: ${bookingWithDetails.treatment_id.service_name}
 
🏥 *Clinic Details*
${clinic.clinic_name}
${clinic.clinic_contact_details.clinic_address}
 
📅 *Appointment*
Date: ${formattedDate}
Time: ${formatTime(bookingWithDetails.SessionDates[0].time)}
 
💰 *Payment Details*
Amount: Rs ${total.toLocaleString("en-IN")}
Payment Method: Pay at Clinic
 
⏳ *Important*
• Arrive 10 minutes early
• Payment due at clinic
• Reschedule up to 24 hours before
 
Thank you for booking with us! 🙏
                `.trim();

                // Send WhatsApp message with invoice PDF
                console.log("Sending WhatsApp message with invoice...");
                const invoiceUrl = `http://localhost:7900/invoices/${path.basename(invoicePath)}`;
                const whatsappResponse = await sendWhatsApp({
                    mobile: patient_details.phone,
                    msg: whatsappMessage,
                    pdf: invoiceUrl // Path to the generated PDF
                });

                console.log("WhatsApp response:", whatsappResponse);

                // Clean up local PDF file after sending (optional)
                // setTimeout(() => {
                //     fs.unlink(invoicePath, (err) => {
                //         if (err) console.error("Error deleting file:", err);
                //     });
                // }, 5000);

                return res.status(201).json({
                    success: true,
                    message: "Booking confirmed and invoice sent via WhatsApp",
                    data: {
                        booking: {
                            id: savedBooking._id,
                            bookingNumber: savedBooking.bookingNumber
                        },
                        gatewayData: {
                            method: "pay_at_clinic"
                        },
                        whatsappStatus: whatsappResponse?.status || "sent"
                    }
                });

            } catch (whatsappError) {
                console.error("WhatsApp sending error:", whatsappError);

                // Even if WhatsApp fails, booking is confirmed
                return res.status(201).json({
                    success: true,
                    message: "Booking confirmed (WhatsApp delivery pending)",
                    data: {
                        booking: {
                            id: savedBooking._id,
                            bookingNumber: savedBooking.bookingNumber
                        },
                        gatewayData: {
                            method: "pay_at_clinic"
                        },
                        warning: "Invoice could not be sent via WhatsApp"
                    }
                });
            }
        }

        // ==================== RAZORPAY ====================

        if (payment_method === "razorpay") {
            const razorpayOrder = await createRazarpayPayment({
                amount: total,
                bookingId: savedBooking._id,
                userId
            });

            savedPayment.gateway = {
                provider: "razorpay",
                orderId: razorpayOrder.orderId
            };

            await savedPayment.save({ session });

            await session.commitTransaction();
            await redis.del(slotKey);

            return res.status(201).json({
                success: true,
                message: "Razorpay order created",
                data: {
                    booking: {
                        id: savedBooking._id,
                        bookingNumber: savedBooking.bookingNumber
                    },
                    gatewayData: {
                        method: "razorpay",
                        key: process.env.RAZORPAY_KEY_ID,
                        order_id: razorpayOrder.orderId,
                        amount: razorpayOrder.amount,
                        currency: razorpayOrder.currency
                    }
                }
            });
        }

        // ==================== PHONEPE ====================

        if (payment_method === "phonepe") {
            const phonepe = await createPhonePePayment({
                amount: total,
                bookingId: savedBooking._id,
                userId,
                patient_details
            });

            savedPayment.gateway = {
                provider: "phonepe",
                transactionId: phonepe.merchantOrderId
            };

            await savedPayment.save({ session });

            await session.commitTransaction();
            await redis.del(slotKey);

            return res.status(201).json({
                success: true,
                message: "PhonePe payment initiated",
                data: {
                    booking: {
                        id: savedBooking._id,
                        bookingNumber: savedBooking.bookingNumber
                    },
                    gatewayData: {
                        method: "phonepe",
                        redirect_url: phonepe.redirectUrl
                    }
                }
            });
        }

    } catch (error) {
        await session.abortTransaction();

        console.error("Create booking error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    } finally {
        session.endSession();
    }
};
exports.verifyRazorpayPayment = async (req, res) => {
    const session = await mongoose.startSession();
    let committed = false;

    const baseFrontendUrl = (process.env.FRONTEND_URL || "https://drrajneeshkant.in").replace(/\/+$/, "");

    try {
        session.startTransaction();

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            booking_id
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
            await session.abortTransaction();
            return res.redirect(`${baseFrontendUrl}/booking-failed?reason=missing-fields&booking_id=${booking_id}`);
        }

        // Verify signature
        const verification = verifyRazarpayPayment({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        });

        if (!verification) {
            await session.abortTransaction();
            return res.redirect(`${baseFrontendUrl}/booking-failed?reason=signature-invalid&booking_id=${booking_id}`);
        }

        // Find booking
        const booking = await Bookings.findById(booking_id).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.redirect(`${baseFrontendUrl}/booking-failed?reason=booking-not-found&booking_id=${booking_id}`);
        }

        // Find payment by booking
        const payment = await Payment.findOne({
            bookingId: booking._id
        }).session(session);

        if (!payment) {
            await session.abortTransaction();
            return res.redirect(`${baseFrontendUrl}/booking-failed?reason=payment-not-found&booking_id=${booking_id}`);
        }

        // Duplicate protection
        if (payment.status === "completed") {
            await session.abortTransaction();
            return res.redirect(`${baseFrontendUrl}/booking-success?bookingId=${booking._id}&status=already-paid`);
        }

        // Verify orderId matches
        if (payment.gateway?.orderId !== razorpay_order_id) {
            await session.abortTransaction();
            return res.redirect(`${baseFrontendUrl}/booking-failed?reason=order-mismatch&booking_id=${booking_id}`);
        }

        // Update payment
        payment.status = "completed";

        payment.gateway = {
            ...payment.gateway,
            provider: "razorpay",
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature
        };

        payment.gatewayResponse = req.body;

        payment.paidAt = new Date();
        payment.completedAt = new Date();

        await payment.save({ session });

        // Update booking
        booking.session_status = "Confirmed";
        booking.payment_verified_at = new Date();

        await booking.save({ session });

        await session.commitTransaction();
        committed = true;

        try { await flushAllData(getRedisClient(req)); } catch (_) { }

        return res.redirect(`${baseFrontendUrl}/booking-success?bookingId=${booking._id}`);

    } catch (error) {

        if (!committed) {
            try { await session.abortTransaction(); } catch (_) { }
        }

        console.error("❌ Razorpay verify error:", error);

        return res.status(500).json({
            success: false,
            message: "Payment verification failed"
        });

    } finally {
        session.endSession();
    }
};

exports.verifyPhonePeCallback = async (req, res) => {

    const session = await mongoose.startSession();
    let committed = false;

    try {

        session.startTransaction();

        const { bookingId } = req.params;

        if (!bookingId) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "bookingId is required"
            });
        }

        // ---------------------------
        // Find Payment
        // ---------------------------
        const payment = await Payment.findOne({ bookingId }).session(session);

        if (!payment) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // Duplicate protection
        if (payment.status === "completed") {
            await session.abortTransaction();
            return res.status(200).json({
                success: true,
                message: "Payment already verified"
            });
        }

        const merchantOrderId = payment.gateway?.transactionId;

        if (!merchantOrderId) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "PhonePe order id missing"
            });
        }

        // ---------------------------
        // Verify PhonePe Payment
        // ---------------------------
        const status = await verifyPhonePePayment(merchantOrderId);

        if (!status.success) {
            await session.abortTransaction();
            return res.status(500).json({
                success: false,
                message: "Unable to verify payment"
            });
        }

        // ---------------------------
        // Find Booking
        // ---------------------------
        const booking = await Bookings.findById(payment.bookingId).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // ---------------------------
        // Handle Status
        // ---------------------------

        if (status.state === "COMPLETED") {

            payment.status = "completed";

            payment.gateway = {
                ...payment.gateway,
                provider: "phonepe",
                transactionId: merchantOrderId,
                paymentId: status.transactionId
            };

            payment.gatewayResponse = status;

            payment.paidAt = new Date();
            payment.completedAt = new Date();

            await payment.save({ session });

            booking.session_status = "Confirmed";
            booking.payment_verified_at = new Date();

            await booking.save({ session });

        }
        else if (status.state === "FAILED") {

            payment.status = "failed";
            payment.failureReason = "PhonePe payment failed";
            payment.gatewayResponse = status;

            await payment.save({ session });

            booking.session_status = "Payment Failed";

            await booking.save({ session });

        }
        else {

            // PENDING
            await session.abortTransaction();

            return res.status(200).json({
                success: true,
                status: "pending"
            });

        }

        // ---------------------------
        // Commit Transaction
        // ---------------------------
        await session.commitTransaction();
        committed = true;

        // Flush Redis Cache
        try {
            await flushAllData(getRedisClient(req));
        } catch (_) { }

        return res.status(200).json({
            success: true,
            status: payment.status
        });

    } catch (error) {

        if (!committed) {
            try { await session.abortTransaction(); } catch (_) { }
        }

        console.error("❌ PhonePe callback error:", error);

        return res.status(500).json({
            success: false,
            message: "PhonePe callback failed"
        });

    } finally {

        session.endSession();

    }
};

exports.checkPhonePeStatus = async (req, res) => {

    const session = await mongoose.startSession();

    try {

        session.startTransaction();

        const { bookingId } = req.params;

        const payment = await Payment.findOne({ bookingId }).session(session);

        if (!payment) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const booking = await Bookings.findById(bookingId).session(session);

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // If already resolved via callback
        if (payment.status === "completed" || payment.status === "failed") {

            await session.abortTransaction();

            return res.json({
                success: true,
                status: payment.status,
                bookingId
            });
        }

        const transactionId = payment.gateway?.transactionId;

        if (!transactionId) {

            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "PhonePe transaction ID not found"
            });
        }

        // Call PhonePe status API
        const phonePeStatus = await verifyPhonePePayment(transactionId);

        if (!phonePeStatus.success) {

            await session.abortTransaction();

            return res.json({
                success: false,
                status: "pending",
                bookingId
            });
        }

        // If payment success
        if (phonePeStatus.state === "COMPLETED") {

            payment.status = "completed";

            payment.gateway = {
                ...payment.gateway,
                provider: "phonepe",
                transactionId: transactionId,
                paymentId: phonePeStatus.transactionId
            };

            payment.paidAt = new Date();
            payment.completedAt = new Date();

            payment.gatewayResponse = phonePeStatus;

            await payment.save({ session });

            booking.session_status = "Confirmed";
            booking.payment_verified_at = new Date();

            await booking.save({ session });

            await session.commitTransaction();

            return res.json({
                success: true,
                status: "completed",
                bookingId
            });

        }

        // If payment failed
        if (phonePeStatus.state === "FAILED") {

            payment.status = "failed";
            payment.failureReason = phonePeStatus.code;

            await payment.save({ session });

            booking.session_status = "Payment Failed";

            await booking.save({ session });

            await session.commitTransaction();

            return res.json({
                success: false,
                status: "failed",
                bookingId
            });

        }

        await session.abortTransaction();

        return res.json({
            success: true,
            status: "pending",
            bookingId
        });

    } catch (error) {

        try { await session.abortTransaction(); } catch (_) { }

        console.error("❌ PhonePe status check error:", error);

        return res.status(500).json({
            success: false,
            message: "Status check failed"
        });

    } finally {

        session.endSession();

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



// exports.verifyPayment = async (req, res) => {

//     const session = await mongoose.startSession();

//     let committed = false;
//     let bookingId = null;
//     let paymentId = null;
//     let via = "web";

//     const baseFrontendUrl =
//         (process.env.FRONTEND_URL || "https://drrajneeshkant.in").replace(/\/+$/, "");

//     const redirectFailure = (reason, extra = {}) => {
//         const query = new URLSearchParams({
//             reason,
//             booking_id: bookingId || "unknown",
//             ...extra,
//         }).toString();

//         return res.redirect(`${baseFrontendUrl}/booking-failed?${query}`);
//     };

//     const redirectSuccess = (booking) => {
//         const query = new URLSearchParams({
//             bookingId: booking._id,
//             status: "success",
//         }).toString();

//         return res.redirect(`${baseFrontendUrl}/booking-success?${query}`);
//     };

//     try {

//         session.startTransaction();

//         const redisClient = getRedisClient(req, res);

//         const params =
//             req.method === "GET"
//                 ? { ...req.query }
//                 : { ...req.query, ...req.body };

//         const {
//             platform,
//             txnid,
//             status,
//             mihpayid,
//             hash,
//             udf1,
//         } = params;

//         bookingId = udf1 || params.booking_id || null;

//         if (platform && ["web", "app", "admin"].includes(platform)) {
//             via = platform;
//         }

//         // Required params validation
//         if (!bookingId || !txnid || !status || !hash) {
//             await session.abortTransaction();
//             return redirectFailure("missing-parameters");
//         }

//         // Find booking
//         const booking = await Bookings.findById(bookingId)
//             .populate("treatment_id")
//             .populate("session_booking_user")
//             .session(session);

//         if (!booking) {
//             await session.abortTransaction();
//             return redirectFailure("booking-not-found");
//         }

//         if (!booking.payment_id) {
//             await session.abortTransaction();
//             return redirectFailure("payment-id-missing");
//         }

//         // Find payment
//         const payment = await Payment.findById(booking.payment_id).session(session);

//         if (!payment) {
//             await session.abortTransaction();
//             return redirectFailure("payment-not-found");
//         }

//         paymentId = payment._id;

//         // Prevent duplicate processing
//         if (payment.status === "completed" && payment.payu_mihpayid) {

//             await session.abortTransaction();

//             if (via === "web") {
//                 return res.redirect(
//                     `${baseFrontendUrl}/booking-success?bookingId=${booking._id}&status=already-processed`
//                 );
//             }

//             return res.json({
//                 success: true,
//                 message: "Payment already processed",
//             });
//         }

//         // Validate txnid
//         if (payment.payu_txn_id !== txnid) {
//             await session.abortTransaction();
//             return redirectFailure("txnid-mismatch");
//         }

//         // Verify payment with PayU
//         const verification = await payu.verifyPayment(params);

//         if (!verification.success || !verification.verified) {

//             payment.status = "failed";
//             payment.failure_reason = verification.error || "verification-failed";
//             payment.payu_mihpayid = mihpayid;
//             payment.payu_response_hash = hash;
//             payment.gateway_response = params;
//             payment.verification_timestamp = new Date();

//             await payment.save({ session });

//             booking.session_status = "Payment Failed";
//             booking.last_updated = new Date();

//             await booking.save({ session });

//             await session.commitTransaction();
//             committed = true;

//             return redirectFailure("verification-failed");
//         }

//         if (status.toLowerCase() !== "success") {

//             payment.status = "failed";
//             payment.failure_reason = status;
//             payment.payu_mihpayid = mihpayid;
//             payment.gateway_response = params;

//             await payment.save({ session });

//             booking.session_status = "Payment Failed";
//             booking.last_updated = new Date();

//             await booking.save({ session });

//             await session.commitTransaction();
//             committed = true;

//             return redirectFailure("payment-failed");
//         }

//         // Payment success
//         payment.status = "completed";
//         payment.payu_mihpayid = mihpayid;
//         payment.payu_response_hash = hash;
//         payment.gateway_response = params;
//         payment.completed_at = new Date();
//         payment.paidAt = new Date();
//         payment.verification_timestamp = new Date();

//         await payment.save({ session });

//         booking.session_status = "Confirmed";
//         booking.payment_verified_at = new Date();
//         booking.last_updated = new Date();
//         booking.bookingSource = via;

//         await booking.save({ session });

//         await session.commitTransaction();
//         committed = true;

//         // Clear cache
//         try {
//             await flushAllData(redisClient);
//         } catch (e) { }

//         if (via === "web") {
//             return redirectSuccess(booking);
//         }

//         return res.json({
//             success: true,
//             booking_id: booking._id,
//             payment_id: payment._id,
//         });

//     } catch (error) {

//         if (!committed) {
//             await session.abortTransaction();
//         }

//         console.error("Payment verification error:", error);

//         if (via === "web") {
//             return redirectFailure("verification-error", {
//                 error: error.message,
//             });
//         }

//         return res.status(500).json({
//             success: false,
//             message: "Payment verification failed",
//             error: error.message,
//             booking_id: bookingId,
//             payment_id: paymentId,
//         });

//     } finally {

//         await session.endSession();

//     }
// };

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

        if (!_id || !sessionNumber || !prescriptionType) {

            if (file.path) deleteFile(file.path);

            return res.status(400).json({
                success: false,
                message: "Booking ID (_id), sessionNumber, and prescriptionType are required."
            });
        }

        const bookings = await Bookings.findById(_id)
            .session(session)
            .populate([
                "session_booking_for_clinic",
                "session_booking_for_doctor",
                "session_booking_user",
                "payment_id"
            ])
            .populate(
                "treatment_id",
                "-service_desc -service_available_at_clinics -service_reviews -service_session_allowed_limit -service_tag -service_doctor -createdAt -updatedAt"
            );

        if (!bookings) {

            if (file.path) deleteFile(file.path);

            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const matchedSession = bookings.SessionDates.find(
            s => s.sessionNumber === Number(sessionNumber)
        );

        if (!matchedSession) {

            if (file.path) deleteFile(file.path);

            return res.status(404).json({
                success: false,
                message: "Session number not found in the booking."
            });
        }

        if (matchedSession.status !== "Completed") {

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

        const existingPrescriptionIndex =
            bookings.session_prescriptions.findIndex(
                p => p.sessionNumber === Number(sessionNumber)
            );

        let uploadedResult = null;

        if (file.path) {
            uploadedResult = await uploadSingleFile(file);
        }

        if (existingPrescriptionIndex !== -1) {

            const existing =
                bookings.session_prescriptions[existingPrescriptionIndex];

            if (existing.public_id) {
                await deleteFileCloud(existing.public_id);
            }

            bookings.session_prescriptions[existingPrescriptionIndex] = {
                sessionNumber: Number(sessionNumber),
                date: new Date(),
                prescriptionType,
                url: uploadedResult?.url || existing.url,
                public_id: uploadedResult?.public_id || existing.public_id,
                uploadedAt: new Date()
            };

        } else {

            bookings.session_prescriptions.push({
                sessionNumber: Number(sessionNumber),
                date: new Date(),
                prescriptionType,
                url: uploadedResult?.url || "",
                public_id: uploadedResult?.public_id || "",
                uploadedAt: new Date()
            });

        }

        await bookings.save({ session });

        await session.commitTransaction();

        session.endSession();

        // =========================
        // SEND WHATSAPP MESSAGE
        // =========================

        try {

            const user = bookings.session_booking_user;
            const phone = user?.phone;

            if (phone) {

                const prescription =
                    bookings.session_prescriptions.find(
                        p => p.sessionNumber === Number(sessionNumber)
                    );

                let message = "";

                if (existingPrescriptionIndex !== -1) {

                    message = `Dear ${user.name},

Your prescription for session ${sessionNumber} has been updated.

Doctor: Dr. Rajneesh Kant
Clinic: Back to Nature Spine Clinic

Please review the updated prescription carefully and follow the medical advice provided.

Stay healthy.`;

                } else {

                    message = `Dear ${user.name},

Your prescription for session ${sessionNumber} is now available.

Doctor: Dr. Rajneesh Kant
Clinic: Back to Nature Spine Clinic

Please check the prescription and follow the instructions carefully for better recovery.

Take care.`;

                }

                await sendWhatsApp({
                    mobile: phone,
                    msg: message,
                    img1: prescription?.url || ""
                });

            }

        } catch (whatsappError) {

            console.error(
                "WhatsApp notification failed:",
                whatsappError.message
            );

        }

        const responsePrescription =
            bookings.session_prescriptions.find(
                p => p.sessionNumber === Number(sessionNumber)
            );

        return res.status(200).json({
            success: true,
            message: "Prescription added/updated successfully.",
            data: responsePrescription
        });

    } catch (error) {

        await session.abortTransaction();

        session.endSession();

        console.error(
            "Error adding/updating session prescription:",
            error
        );

        if (file.path) deleteFile(file.path);

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

        const booking = await Bookings.findById(bookingId)
            .populate("session_booking_user");

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        // Last session
        const lastSession = booking.SessionDates[booking.SessionDates.length - 1];

        if (lastSession && !["Completed", "Cancelled"].includes(lastSession.status)) {
            return res.status(400).json({
                success: false,
                message: "Next session can only be added after the previous session is completed or cancelled."
            });
        }

        // Check session limit
        if (booking.SessionDates.length >= booking.no_of_session_book) {
            return res.status(400).json({
                success: false,
                message: "Cannot add more sessions than the allowed limit."
            });
        }

        // Add session
        const nextSessionNumber = booking.SessionDates.length + 1;

        booking.SessionDates.push({
            sessionNumber: nextSessionNumber,
            date: new Date(new_date),
            time: new_time,
            status: "Pending"
        });

        await booking.save();

        // ===== SEND WHATSAPP =====
        try {

            const phone = booking.session_booking_user?.phone;

            if (phone) {

                const message = `Dear ${booking.session_booking_user.name},

Your next therapy session has been scheduled successfully.

Session Number: ${nextSessionNumber}
Date: ${new_date}
Time: ${new_time}

Clinic: Back to Nature Spine Clinic
Doctor: Dr. Rajneesh Kant

Please arrive 10 minutes before your appointment.

Thank you.`;

                await sendWhatsApp({
                    mobile: phone,
                    msg: message
                });

            }

        } catch (err) {
            console.log("WhatsApp error:", err.message);
        }

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

        const booking = await Bookings.findById(bookingId)
            .populate("session_booking_user")
            .session(sessionDb);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found."
            });
        }

        const sessionToUpdate = booking.SessionDates.find(
            s => s.sessionNumber === Number(sessionNumber)
        );

        if (!sessionToUpdate) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        // Update status
        sessionToUpdate.status = newStatus;
        if (reason) sessionToUpdate.statusReason = reason;

        await booking.save({ session: sessionDb });
        await sessionDb.commitTransaction();

        // ===== WHATSAPP MESSAGE =====
        try {

            const user = booking.session_booking_user;
            const phone = user?.phone;

            if (phone) {

                let message = "";

                if (newStatus === "Completed") {

                    message = `Dear ${user.name},

Your therapy session ${sessionNumber} has been successfully completed.

Doctor: Dr. Rajneesh Kant
Clinic: Back to Nature Spine Clinic

We hope you are feeling better. Follow your prescribed care plan and stay healthy.

Thank you for trusting us.`;

                }

                else if (newStatus === "Cancelled") {

                    message = `Dear ${user.name},

Your therapy session ${sessionNumber} has been cancelled.

Reason: ${reason || "Not specified"}

If you would like to reschedule your appointment, please contact the clinic.

Back to Nature Spine Clinic`;

                }

                else if (newStatus === "Rescheduled") {

                    message = `Dear ${user.name},

Your therapy session ${sessionNumber} has been rescheduled.

Please check your updated appointment details.

Clinic: Back to Nature Spine Clinic
Doctor: Dr. Rajneesh Kant

Thank you.`;

                }

                else if (newStatus === "Pending") {

                    message = `Dear ${user.name},

Your therapy session ${sessionNumber} is currently scheduled and pending.

We look forward to seeing you at Back to Nature Spine Clinic.

Doctor: Dr. Rajneesh Kant`;

                }

                else if (newStatus === "In Progress") {

                    message = `Dear ${user.name},

Your therapy session ${sessionNumber} is currently in progress at the clinic.

Doctor: Dr. Rajneesh Kant
Back to Nature Spine Clinic`;

                }

                if (message) {
                    await sendWhatsApp({
                        mobile: phone,
                        msg: message
                    });
                }

            }

        } catch (err) {
            console.log("WhatsApp error:", err.message);
        }

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
