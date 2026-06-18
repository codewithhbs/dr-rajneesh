const mongoose = require("mongoose");

const AppointmentTimelineSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FullBodyBooking",
        required: true
    },

    action: {
        type: String,
        enum: [
            "booked",
            "confirmed",
            "rescheduled",
            "visit_completed",
            "revisit_added",
            "payment_received",
            "cancelled"
        ]
    },

    remark: String,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "createdByModel"
    },

    createdByModel: {
        type: String,
        enum: ["User", "Admin"]
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "AppointmentTimeline",
    AppointmentTimelineSchema
);