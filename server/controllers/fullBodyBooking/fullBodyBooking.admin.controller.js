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
const ICICI_COMMAND_URL = process.env.ICICI_COMMAND_URL || "https://pgpay.icicibank.com/pg/api/command";

function buildSecureHash(paramsInOrder) {
    const hashText = paramsInOrder.join("");
    return crypto.createHmac("sha256", ICICI_SECRET_KEY).update(hashText).digest("hex");
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

// =======================================================================
// SERVICE MANAGEMENT
// =======================================================================

// CREATE SERVICE
exports.createService = async (req, res) => {
    try {
        const {
            title,
            desc,
            price,
            discount_price,
            tag,
            included_services,
            per_day_booking_allow_limit,
            blocked_dates
        } = req.body;

        if (!title || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "title and price are required"
            });
        }

        const service = await FullBodyService.create({
            title,
            desc,
            price,
            discount_price: discount_price || 0,
            tag,
            included_services: included_services || [],
            per_day_booking_allow_limit: per_day_booking_allow_limit || 1,
            blocked_dates: blocked_dates || []
        });

        return res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to create service",
            error: err.message
        });
    }
};

// GET ALL SERVICES (admin - includes inactive but excludes soft deleted unless requested)
exports.getAllServicesAdmin = async (req, res) => {
    try {
        const { includeDeleted } = req.query;

        const filter = {};
        if (includeDeleted !== "true") filter.is_deleted = false;

        const services = await FullBodyService.find(filter).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: services });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch services",
            error: err.message
        });
    }
};

// GET SINGLE SERVICE (admin)
exports.getServiceByIdAdmin = async (req, res) => {
    try {
        const { serviceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
            return res.status(400).json({ success: false, message: "Invalid service id" });
        }

        const service = await FullBodyService.findById(serviceId);

        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        return res.status(200).json({ success: true, data: service });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch service",
            error: err.message
        });
    }
};

// UPDATE SERVICE (full update - schema-fidelity preserved)
exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const {
            title,
            desc,
            price,
            discount_price,
            tag,
            per_day_booking_allow_limit
        } = req.body;

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        if (title !== undefined) service.title = title;
        if (desc !== undefined) service.desc = desc;
        if (price !== undefined) service.price = price;
        if (discount_price !== undefined) service.discount_price = discount_price;
        if (tag !== undefined) service.tag = tag;
        if (per_day_booking_allow_limit !== undefined) {
            service.per_day_booking_allow_limit = per_day_booking_allow_limit;
        }

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Service updated successfully",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update service",
            error: err.message
        });
    }
};

// TOGGLE SERVICE ACTIVE / DEACTIVATE (stops new bookings, does not touch existing bookings)
exports.toggleServiceActive = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { is_active } = req.body;

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        service.is_active = !!is_active;
        await service.save();

        return res.status(200).json({
            success: true,
            message: `Service ${service.is_active ? "activated" : "deactivated"} successfully`,
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to toggle service status",
            error: err.message
        });
    }
};

// SOFT DELETE SERVICE
exports.softDeleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        service.is_deleted = true;
        service.is_active = false;
        await service.save();

        return res.status(200).json({
            success: true,
            message: "Service deleted successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete service",
            error: err.message
        });
    }
};

// ADD INCLUDED SERVICE ITEM
exports.addIncludedService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { title, desc, is_active, order, any_image } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: "title is required" });
        }

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        service.included_services.push({
            title,
            desc: desc || "",
            is_active: is_active !== undefined ? is_active : true,
            order: order || 0,
            any_image: any_image || ""
        });

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Included service added",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to add included service",
            error: err.message
        });
    }
};

// UPDATE INCLUDED SERVICE ITEM (by index)
exports.updateIncludedService = async (req, res) => {
    try {
        const { serviceId, index } = req.params;
        const { title, desc, order, any_image } = req.body;

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const idx = Number(index);
        if (!service.included_services[idx]) {
            return res.status(404).json({ success: false, message: "Included service not found" });
        }

        if (title !== undefined) service.included_services[idx].title = title;
        if (desc !== undefined) service.included_services[idx].desc = desc;
        if (order !== undefined) service.included_services[idx].order = order;
        if (any_image !== undefined) service.included_services[idx].any_image = any_image;

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Included service updated",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update included service",
            error: err.message
        });
    }
};

// TOGGLE / STOP INCLUDED SERVICE (deactivate single included item without removing it)
exports.toggleIncludedServiceActive = async (req, res) => {
    try {
        const { serviceId, index } = req.params;
        const { is_active } = req.body;

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const idx = Number(index);
        if (!service.included_services[idx]) {
            return res.status(404).json({ success: false, message: "Included service not found" });
        }

        service.included_services[idx].is_active = !!is_active;
        await service.save();

        return res.status(200).json({
            success: true,
            message: `Included service ${is_active ? "activated" : "stopped"} successfully`,
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to toggle included service",
            error: err.message
        });
    }
};

// REMOVE INCLUDED SERVICE ITEM
exports.removeIncludedService = async (req, res) => {
    try {
        const { serviceId, index } = req.params;

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const idx = Number(index);
        if (!service.included_services[idx]) {
            return res.status(404).json({ success: false, message: "Included service not found" });
        }

        service.included_services.splice(idx, 1);
        await service.save();

        return res.status(200).json({
            success: true,
            message: "Included service removed",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to remove included service",
            error: err.message
        });
    }
};

// ADD BLOCKED DATE (stop bookings on this date)
exports.addBlockedDate = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { date } = req.body;

        if (!date) {
            return res.status(400).json({ success: false, message: "date is required" });
        }

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const newDate = new Date(date);

        const alreadyBlocked = (service.blocked_dates || []).some((bd) =>
            isSameDate(bd, newDate)
        );

        if (alreadyBlocked) {
            return res.status(409).json({
                success: false,
                message: "Date is already blocked"
            });
        }

        service.blocked_dates.push(newDate);
        await service.save();

        return res.status(200).json({
            success: true,
            message: "Date blocked successfully",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to block date",
            error: err.message
        });
    }
};

// REMOVE BLOCKED DATE
exports.removeBlockedDate = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { date } = req.body;

        if (!date) {
            return res.status(400).json({ success: false, message: "date is required" });
        }

        const service = await FullBodyService.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        const targetDate = new Date(date);

        service.blocked_dates = (service.blocked_dates || []).filter(
            (bd) => !isSameDate(bd, targetDate)
        );

        await service.save();

        return res.status(200).json({
            success: true,
            message: "Date unblocked successfully",
            data: service
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to unblock date",
            error: err.message
        });
    }
};

// =======================================================================
// BOOKING MANAGEMENT (ADMIN)
// =======================================================================

// GET ALL BOOKINGS (filters: status, paymentStatus, date range, search)
exports.getAllBookingsAdmin = async (req, res) => {
    try {
        const {
            bookingStatus,
            paymentStatus,
            fromDate,
            toDate,
            search,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // filters
        if (bookingStatus) filter.bookingStatus = bookingStatus;
        if (paymentStatus) filter.paymentStatus = paymentStatus;

        // date range filter
        if (fromDate || toDate) {
            filter.appointmentDate = {};
            if (fromDate) filter.appointmentDate.$gte = new Date(fromDate);
            if (toDate) filter.appointmentDate.$lte = new Date(toDate);
        }

        // search by bookingId
        if (search) {
            filter.bookingId = { $regex: search, $options: "i" };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [bookings, total] = await Promise.all([
            FullBodyBooking.find(filter)
                .populate("patient", "name email phone")
                .populate("service", "title price included_services")
                .populate("assignedDoctor", "name")
                .populate("clinic", "clinic_name clinic_contact_details")

                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),

            FullBodyBooking.countDocuments(filter)
        ]);

        // helper: map included services per booking
        const enrichedBookings = bookings.map((booking) => {
            let selectedIncludedServices = [];

            if (
                booking?.selectedIncludedServices?.length &&
                booking?.service?.included_services?.length
            ) {
                const selectedIds = booking.selectedIncludedServices.map((id) =>
                    String(id)
                );

                selectedIncludedServices = booking.service.included_services
                    .filter((service) =>
                        selectedIds.includes(String(service?._id))
                    )
                    .map((service) => ({
                        _id: service._id,
                        title: service.title,
                        desc: service.desc,
                        order: service.order
                    }));
            }

            return {
                ...booking,
                selectedIncludedServices
            };
        });

        return res.status(200).json({
            success: true,
            data: enrichedBookings,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: err.message
        });
    }
};
// GET SINGLE BOOKING DETAIL (admin)
exports.getBookingDetailAdmin = async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await FullBodyBooking.findById(bookingId)
            .populate("patient", "name email phone")
            .populate("clinic", "clinic_name clinic_contact_details")

            .populate("service")

            .lean(); // important for safe mutation

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });
        }

        // timeline
        const timeline = await AppointmentTimeline.find({ booking: booking._id })
            // .populate("createdBy", "name")
            .sort({ createdAt: 1 })
            .lean();

        // payments
        const payments = await PaymentHistory.find({ booking: booking._id })
            .sort({ createdAt: -1 })
            .lean();

        // ✅ compute included services
        let selectedIncludedServices = [];

        if (
            booking?.selectedIncludedServices?.length &&
            booking?.service?.included_services?.length
        ) {
            const selectedIds = booking.selectedIncludedServices.map((id) =>
                String(id)
            );

            selectedIncludedServices = booking.service.included_services
                .filter((service) =>
                    selectedIds.includes(String(service?._id))
                )
                .map((service) => ({
                    _id: service._id,
                    title: service.title,
                    desc: service.desc,
                    order: service.order
                }));
        }

        // attach computed field
        const enrichedBooking = {
            ...booking,
            selectedIncludedServices
        };

        return res.status(200).json({
            success: true,
            data: {
                booking: enrichedBooking,
                timeline,
                payments
            }
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Failed to fetch booking detail",
            error: err.message
        });
    }
};
// CONFIRM BOOKING (admin)
exports.confirmBooking = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { remark } = req.body;

        const booking = await FullBodyBooking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (["completed", "cancelled"].includes(booking.bookingStatus)) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: `Cannot confirm a ${booking.bookingStatus} booking`
            });
        }

        booking.bookingStatus = "confirmed";
        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "confirmed",
                    remark: remark || "Confirmed by admin",
                    createdBy: adminId,
                    createdByModel: "Admin"
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Booking confirmed",
            data: booking
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to confirm booking",
            error: err.message
        });
    }
};

// ASSIGN DOCTOR
exports.assignDoctor = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { doctorId } = req.body;

        if (!doctorId) {
            return res.status(400).json({ success: false, message: "doctorId is required" });
        }

        const booking = await FullBodyBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        booking.assignedDoctor = doctorId;
        await booking.save();

        return res.status(200).json({
            success: true,
            message: "Doctor assigned successfully",
            data: booking
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to assign doctor",
            error: err.message
        });
    }
};

// RESCHEDULE (admin)
exports.rescheduleBookingAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { newDate, newTime, reason } = req.body;

        if (!newDate || !newTime) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "newDate and newTime are required"
            });
        }

        const booking = await FullBodyBooking.findById(bookingId).session(session);
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

        const service = await FullBodyService.findById(booking.service).session(session);
        const reqDate = new Date(newDate);

        if (service) {
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
        }

        const startOfDay = new Date(reqDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(reqDate);
        endOfDay.setHours(23, 59, 59, 999);

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
            changedBy: "admin",
            changedAt: new Date()
        });

        booking.appointmentDate = reqDate;
        booking.appointmentTime = newTime;

        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "rescheduled",
                    remark: reason || "Rescheduled by admin",
                    createdBy: adminId,
                    createdByModel: "Admin"
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

// MARK VISIT COMPLETED + ADD REVISIT
exports.addVisit = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { visitDate, notes, doctorNotes, status } = req.body;

        const booking = await FullBodyBooking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const visitNo = (booking.revisitHistory || []).length + 1;

        booking.revisitHistory.push({
            visitNo,
            visitDate: visitDate ? new Date(visitDate) : new Date(),
            notes: notes || "",
            doctorNotes: doctorNotes || "",
            status: status || "completed"
        });

        booking.totalVisits = (booking.totalVisits || 0) + 1;

        if ((status || "completed") === "completed") {
            booking.completedVisits = (booking.completedVisits || 0) + 1;
            booking.bookingStatus = "completed";
        }

        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: visitNo === 1 ? "visit_completed" : "revisit_added",
                    remark: notes || `Visit #${visitNo} recorded`,
                    createdBy: adminId,
                    createdByModel: "Admin"
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Visit recorded successfully",
            data: booking
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to record visit",
            error: err.message
        });
    }
};

// CANCEL BOOKING (admin)
exports.cancelBookingAdmin = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        console.log(req.user)
        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { reason } = req.body;

        const booking = await FullBodyBooking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.bookingStatus === "cancelled") {
            await session.abortTransaction();
            return res.status(409).json({ success: false, message: "Booking already cancelled" });
        }

        booking.bookingStatus = "cancelled";
        booking.cancelledReason = reason || "Cancelled by admin";

        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "cancelled",
                    remark: reason || "Cancelled by admin",
                    createdBy: adminId,
                    createdByModel: "Admin"
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

// MARK NO SHOW
exports.markNoShow = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { remark } = req.body;

        const booking = await FullBodyBooking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        booking.bookingStatus = "no_show";
        await booking.save();

        await AppointmentTimeline.create({
            booking: booking._id,
            action: "cancelled",
            remark: remark || "Marked as no-show by admin",
            createdBy: adminId,
            createdByModel: "Admin"
        });

        return res.status(200).json({
            success: true,
            message: "Booking marked as no-show",
            data: booking
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to mark no-show",
            error: err.message
        });
    }
};

// =======================================================================
// PAYMENT MANAGEMENT (ADMIN)
// =======================================================================

// RECORD MANUAL/OFFLINE PAYMENT (cash / upi / card / bank_transfer at desk)
exports.recordManualPayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { amount, mode, transactionId, remarks } = req.body;

        if (!amount || !mode) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "amount and mode are required"
            });
        }

        const booking = await FullBodyBooking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (Number(amount) > Number(booking.dueAmount)) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Amount exceeds due amount"
            });
        }

        await PaymentHistory.create(
            [
                {
                    booking: booking._id,
                    amount: Number(amount),
                    mode,
                    transactionId: transactionId || "",
                    remarks: remarks || "Manual payment recorded by admin"
                }
            ],
            { session }
        );

        booking.paidAmount = Number(booking.paidAmount) + Number(amount);
        booking.dueAmount = Math.max(0, Number(booking.amount) - booking.paidAmount);
        booking.paymentStatus =
            booking.dueAmount <= 0
                ? "paid"
                : booking.paidAmount > 0
                    ? "partial"
                    : "pending";

        await booking.save({ session });

        await AppointmentTimeline.create(
            [
                {
                    booking: booking._id,
                    action: "payment_received",
                    remark: `Manual payment of ${amount} via ${mode} recorded by admin`,
                    createdBy: adminId,
                    createdByModel: "Admin"
                }
            ],
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Payment recorded successfully",
            data: booking
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to record payment",
            error: err.message
        });
    }
};

// REFUND (ICICI Orange PG Refund API + ledger update)
exports.refundPayment = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const adminId = req.user._id;
        const { bookingId } = req.params;
        const { amount, originalTxnNo, reason } = req.body;

        if (!amount || !originalTxnNo) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "amount and originalTxnNo are required"
            });
        }

        const booking = await FullBodyBooking.findById(bookingId).session(session);
        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const refundTxnNo = "RFD" + Date.now();
        const amountStr = Number(amount).toFixed(2);

        const refundParams = {
            merchantId: ICICI_MERCHANT_ID,
            aggregatorID: ICICI_AGGREGATOR_ID,
            merchantTxnNo: refundTxnNo,
            originalTxnNo,
            amount: amountStr,
            transactionType: "REFUND"
        };

        const hashOrder = [
            refundParams.aggregatorID,
            refundParams.amount,
            refundParams.merchantId,
            refundParams.merchantTxnNo,
            refundParams.originalTxnNo,
            refundParams.transactionType
        ];

        const secureHash = buildSecureHash(hashOrder);

        const refundRes = await axios.post(
            ICICI_COMMAND_URL,
            { ...refundParams, secureHash },
            { headers: { "Content-Type": "application/json" } }
        );

        const result = refundRes.data;
        const success = result.responseCode === "R1000" || result.responseCode === "000";

        if (!success) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: "Refund failed at gateway",
                data: result
            });
        }

        await PaymentHistory.create(
            [
                {
                    booking: booking._id,
                    amount: -Number(amount),
                    mode: "bank_transfer",
                    transactionId: refundTxnNo,
                    remarks: reason || "Refund processed via ICICI Orange PG"
                }
            ],
            { session }
        );

        booking.paidAmount = Math.max(0, Number(booking.paidAmount) - Number(amount));
        booking.dueAmount = Number(booking.amount) - booking.paidAmount;
        booking.paymentStatus = "refunded";

        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: { booking, gatewayResponse: result }
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            success: false,
            message: "Failed to process refund",
            error: err.response ? err.response.data : err.message
        });
    }
};

// GET ALL PAYMENT HISTORY (admin - across all bookings, filterable)
exports.getAllPaymentHistoryAdmin = async (req, res) => {
    try {
        const { mode, fromDate, toDate, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (mode) filter.mode = mode;
        if (fromDate || toDate) {
            filter.createdAt = {};
            if (fromDate) filter.createdAt.$gte = new Date(fromDate);
            if (toDate) filter.createdAt.$lte = new Date(toDate);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [payments, total] = await Promise.all([
            PaymentHistory.find(filter)
                .populate({
                    path: "booking",
                    select: "bookingId patient appointmentDate",
                    populate: { path: "patient", select: "name email phone" }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            PaymentHistory.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: payments,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch payment history",
            error: err.message
        });
    }
};

// DASHBOARD STATS
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalBookings,
            scheduled,
            confirmed,
            completed,
            cancelled,
            noShow,
            revenueAgg
        ] = await Promise.all([
            FullBodyBooking.countDocuments({}),
            FullBodyBooking.countDocuments({ bookingStatus: "scheduled" }),
            FullBodyBooking.countDocuments({ bookingStatus: "confirmed" }),
            FullBodyBooking.countDocuments({ bookingStatus: "completed" }),
            FullBodyBooking.countDocuments({ bookingStatus: "cancelled" }),
            FullBodyBooking.countDocuments({ bookingStatus: "no_show" }),
            FullBodyBooking.aggregate([
                { $group: { _id: null, totalPaid: { $sum: "$paidAmount" }, totalDue: { $sum: "$dueAmount" } } }
            ])
        ]);

        return res.status(200).json({
            success: true,
            data: {
                totalBookings,
                scheduled,
                confirmed,
                completed,
                cancelled,
                noShow,
                totalPaid: revenueAgg[0] ? revenueAgg[0].totalPaid : 0,
                totalDue: revenueAgg[0] ? revenueAgg[0].totalDue : 0
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats",
            error: err.message
        });
    }
};