const moment = require("moment");
const Clinic = require("../../models/clinic/clinic.model");
const Bookings = require("../../models/booking/bookings.sessions.model");
const Settings = require("../../models/settings/settings.model");

function generateTimeSlots(start = "09:00", end = "18:00", slotsPerHour = 2) {
    const slotDuration = 60 / slotsPerHour;
    const startTime = moment(start, "HH:mm");
    const endTime = moment(end, "HH:mm");

    const slots = [];
    let current = startTime.clone();

    while (current.isBefore(endTime)) {
        slots.push(current.format("HH:mm"));
        current.add(slotDuration, "minutes");
    }

    return slots;
}

exports.getAvailableDates = async (req, res) => {
    try {
        const { _id } = req.query;
        if (!_id) return res.status(403).json({ message: "Clinic ID is required" });

        const clinic = await Clinic.findById(_id);
        if (!clinic) return res.status(404).json({ message: "Clinic not found" });

        const { start_date, end_date } = clinic.BookingAvailabeAt || {};
        if (!start_date || !end_date) {
            return res.status(400).json({ message: "Clinic booking dates not set" });
        }

        const settings = await Settings.findOne();
        if (!settings || !settings.booking_config) {
            return res.status(500).json({ message: "Booking settings not configured" });
        }

        const {
            slots_per_hour = 2,
            booking_limit_per_slot = 1,
        } = settings.booking_config;

        const specialRestrictions = settings.special_slot_restrictions || [];

        const bookings = await Bookings.find({
            session_booking_for_clinic: _id,
            "SessionDates.date": {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            },
        });

        const bookedSlots = {};

        bookings.forEach((booking) => {
            booking.SessionDates.forEach((session) => {
                const key = moment(session.date).format("YYYY-MM-DD") + " " + session.time;
                bookedSlots[key] = (bookedSlots[key] || 0) + 1;

                if (Array.isArray(session.rescheduleHistory)) {
                    session.rescheduleHistory.forEach((res) => {
                        if (res.previousDate && res.previousTime) {
                            const resKey = moment(res.previousDate).format("YYYY-MM-DD") + " " + res.previousTime;
                            bookedSlots[resKey] = (bookedSlots[resKey] || 0) + 1;
                        }
                    });
                }
            });
        });

        const current = moment(start_date);
        const end = moment(end_date);
        const availableDates = [];

        while (current.isSameOrBefore(end, "day")) {
            const dateStr = current.format("YYYY-MM-DD");

            // 🔍 Check for special restrictions on this day
            const special = specialRestrictions.find(
                (r) =>
                    r.is_active &&
                    moment(r.date).format("YYYY-MM-DD") === dateStr &&
                    String(r.clinic_id) === String(clinic._id)
            );

            let timeSlots = [];

            if (special && special.time_slots.length > 0) {
                special.time_slots.forEach(({ start_time, end_time }) => {
                    const generated = generateTimeSlots(start_time, end_time, slots_per_hour);
                    timeSlots = [...timeSlots, ...generated];
                });
            } else {
                // Default 9AM–6PM
                timeSlots = generateTimeSlots("09:00", "18:00", slots_per_hour);
            }

            const slotsForDate = timeSlots.map((slot) => {
                const slotKey = `${dateStr} ${slot}`;
                const booked = bookedSlots[slotKey] || 0;
                const available = Math.max(booking_limit_per_slot - booked, 0);
                return {
                    time: slot,
                    booked,
                    available,
                    status: available > 0 ? "Available" : "Full",
                };
            });

            availableDates.push({
                date: dateStr,
                slots: slotsForDate,
            });

            current.add(1, "day");
        }

        return res.status(200).json({
            clinic: {
                _id: clinic._id,
                name: clinic.name,
            },
            availableDates,
        });
    } catch (error) {
        console.error("getAvailableDates error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
