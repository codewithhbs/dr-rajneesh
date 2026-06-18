const mongoose = require("mongoose");

const RescheduleSchema = new mongoose.Schema({
    oldDate: Date,
    newDate: Date,
    reason: String,
    changedBy: {
        type: String,
        enum: ["admin", "patient"]
    },
    changedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const VisitSchema = new mongoose.Schema({
    visitNo: Number,
    visitDate: Date,
    notes: String,
    doctorNotes: String,
    status: {
        type: String,
        enum: ["completed", "cancelled", "missed"],
        default: "completed"
    }
}, { _id: false });

const FullBodyBookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        unique: true
    },
    clinic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "clinic",
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FullBodyService",
        required: true
    },

    appointmentDate: {
        type: Date,
        required: true
    },

    appointmentTime: {
        type: String,
        required: true
    },

    amount: Number,

    discountAmount: {
        type: Number,
        default: 0
    },
    selectedIncludedServices: [String],
    paidAmount: {
        type: Number,
        default: 0
    },

    dueAmount: {
        type: Number,
        default: 0
    },

    paymentStatus: {
        type: String,
        enum: [
            "pending",
            "partial",
            "paid",
            "refunded"
        ],
        default: "pending"
    },

    bookingStatus: {
        type: String,
        enum: [
            "scheduled",
            "confirmed",
            "in_progress",
            "completed",
            "cancelled",
            "no_show"
        ],
        default: "scheduled"
    },

    chiefComplaint: String,

    notes: String,

    rescheduleHistory: [RescheduleSchema],

    revisitHistory: [VisitSchema],

    totalVisits: {
        type: Number,
        default: 0
    },

    completedVisits: {
        type: Number,
        default: 0
    },

    cancelledReason: String,

    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,

    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "FullBodyBooking",
    FullBodyBookingSchema
);