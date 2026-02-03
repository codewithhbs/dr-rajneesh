const mongoose = require('mongoose');
const { getRedisClient, cleanRedisDataFlush } = require("../../utils/redis.utils");
const Bookings = require("../../models/booking/bookings.sessions.model");
const Settings = require("../../models/settings/settings.model");

exports.getBookingsByDateAndTimePeriod = async (req, res) => {
    try {
        const redis = getRedisClient(req, res);

        const { date, time, service_id, clinic_id } = req.body;



        // Validation
        if (!date || !time || !service_id) {
            return res.status(400).json({
                success: false,
                message: "Date, time, and service_id are required",
                data: null
            });
        }

        // Validate date format
        const bookingDate = new Date(date)

        if (isNaN(bookingDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format",
                data: null
            });
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return res.status(400).json({
                success: false,
                message: "Invalid time format. Use HH:MM format",
                data: null
            });
        }



        // Get settings for booking configuration
        const settings = await Settings.findOne().lean();
        if (!settings) {
            return res.status(500).json({
                success: false,
                message: "System settings not found",
                data: null
            });
        }

        const bookingConfig = settings.booking_config;
        const specialRestrictions = settings.special_slot_restrictions || [];

        // Check if the requested time slot has special restrictions
        const hasSpecialRestriction = await checkSpecialRestrictions(
            bookingDate,
            time,
            clinic_id,
            specialRestrictions
        );

        if (hasSpecialRestriction.isRestricted) {
            return res.status(400).json({
                success: false,
                message: hasSpecialRestriction.reason,
                data: {
                    available: false,
                    availableSlots: 0,
                    bookedSlots: 0,
                    maxBookingsPerSlot: 0,
                    restriction: hasSpecialRestriction
                }
            });
        }

        // Find existing bookings for the specified date and time
        // const foundBookedSessions = await Bookings.aggregate([
        //     {
        //         $match: {
        //             treatment_id: new mongoose.Types.ObjectId(service_id),
        //             ...(clinic_id && { session_booking_for_clinic: new mongoose.Types.ObjectId(clinic_id) })
        //         }
        //     },
        //     {
        //         $unwind: "$SessionDates"
        //     },
        //     {
        //         $match: {
        //             "SessionDates.date": {
        //                 $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        //                 $lt: new Date(bookingDate.setHours(23, 59, 59, 999))
        //             },
        //             "session_booking_for_clinic": clinic_id,
        //             "SessionDates.time": time,
        //             "SessionDates.status": {
        //                 $in: ['Pending', 'Confirmed', 'Rescheduled']
        //             }
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: {
        //                 date: "$SessionDates.date",
        //                 time: "$SessionDates.time"
        //             },
        //             bookingCount: { $sum: 1 },
        //             bookings: {
        //                 $push: {
        //                     bookingId: "$_id",
        //                     sessionNumber: "$SessionDates.sessionNumber",
        //                     status: "$SessionDates.status",
        //                     user: "$session_booking_user",
        //                     doctor: "$session_booking_for_doctor",
        //                     clinic: "$session_booking_for_clinic",
        //                     rescheduleHistory: "$SessionDates.rescheduleHistory"
        //                 }
        //             }
        //         }
        //     }
        // ]);
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Build query filter
        const filter = {
            treatment_id: new mongoose.Types.ObjectId(service_id),
            ...(clinic_id && {
                session_booking_for_clinic: new mongoose.Types.ObjectId(clinic_id),
            }),
            SessionDates: {
                $elemMatch: {
                    date: { $gte: startOfDay, $lt: endOfDay },
                    time: time,
                    status: { $in: ["Pending", "Confirmed", "Rescheduled"] },
                },
            },
        };

        // Fetch bookings
        const bookings = await Bookings.find(filter);

        // Extract matching sessions
        let totalBookedSlots = 0;
        const bookingDetails = [];

        bookings.forEach((booking) => {
            booking.SessionDates.forEach((session) => {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);

                if (
                    sessionDate.getTime() === startOfDay.getTime() &&
                    session.time === time &&
                    ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
                ) {
                    totalBookedSlots++;
                    bookingDetails.push({
                        bookingId: booking._id,
                        sessionNumber: session.sessionNumber,
                        status: session.status,
                        user: booking.session_booking_user,
                        doctor: booking.session_booking_for_doctor,
                        clinic: booking.session_booking_for_clinic,
                        rescheduleHistory: session.rescheduleHistory,
                    });
                }
            });
        });
        console.log("Total Booked Slots: Have Bia req", totalBookedSlots);


        // Calculate availability
        const currentBookings = bookings.length > 0 ? bookings[0].bookingCount : 0;
        const maxBookingsPerSlot = bookingConfig.booking_limit_per_slot;
        const availableSlots = Math.max(0, maxBookingsPerSlot - currentBookings);

        // Check if slot is available
        const isAvailable = availableSlots > 0;

        // Prepare response data
        const availabilityData = {
            available: isAvailable,
            availableSlots: availableSlots,
            bookedSlots: currentBookings,
            maxBookingsPerSlot: maxBookingsPerSlot,
            date: date,
            time: time,
            service_id: service_id,
            clinic_id: clinic_id,
            bookingDetails: bookings.length > 0 ? bookings[0].bookings : [],
            configuration: {
                slotsPerHour: bookingConfig.slots_per_hour,
                bookingLimitPerSlot: bookingConfig.booking_limit_per_slot
            },
            restrictions: hasSpecialRestriction
        };

        // Cache the result for 5 minutes


        return res.status(200).json({
            success: true,
            message: isAvailable
                ? `${availableSlots} slot(s) available for booking`
                : "No slots available for the requested time",
            data: availabilityData
        });

    } catch (error) {
        console.error('Error in getBookingsByDateAndTimePeriod:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while checking booking availability",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            data: null
        });
    }
};
exports.getBookingsByDateAndTimePeriodOnB = async ({ date, time, service_id, clinic_id, req }) => {
    try {
        // Validation
        if (!date || !time) {
            return {
                success: false,
                message: "Date, and time are required",
                data: null
            }
        }

        // Validate date format
        const bookingDate = new Date(date);
        if (isNaN(bookingDate.getTime())) {
            return {
                success: false,
                message: "Invalid date format",
                data: null
            }
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(time)) {
            return {
                success: false,
                message: "Invalid time format. Use HH:MM format",
                data: null
            }
        }

        // Get settings for booking configuration
        const settings = await Settings.findOne().lean();
        if (!settings) {
            return {
                success: false,
                message: "System settings not found",
                data: null
            }
        }

        const bookingConfig = settings.booking_config;
        const specialRestrictions = settings.special_slot_restrictions || [];

        // Check if the requested time slot has special restrictions
        const hasSpecialRestriction = await checkSpecialRestrictions(
            bookingDate,
            time,
            clinic_id,
            specialRestrictions
        );

        if (hasSpecialRestriction.isRestricted) {
            return {
                success: false,
                message: hasSpecialRestriction.reason,
                data: {
                    available: false,
                    availableSlots: 0,
                    bookedSlots: 0,
                    maxBookingsPerSlot: 0,
                    restriction: hasSpecialRestriction
                }
            }
        }

        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Build query filter
        const filter = {
            treatment_id: service_id ? new mongoose.Types.ObjectId(service_id) : null,
            ...(clinic_id && {
                session_booking_for_clinic: new mongoose.Types.ObjectId(clinic_id),
            }),
          session_status: { $ne: "Payment Not Completed" },

            SessionDates: {
                $elemMatch: {
                    date: { $gte: startOfDay, $lt: endOfDay },
                    time: time,
                    status: { $in: ["Pending", "Confirmed", "Rescheduled"] },
                },
            },
        };

        // Fetch bookings
        const bookings = await Bookings.find(filter);

        // Extract matching sessions and calculate booked slots
        let totalBookedSlots = 0;
        const bookingDetails = [];

        bookings.forEach((booking) => {
            booking.SessionDates.forEach((session) => {
                const sessionDate = new Date(session.date);
                sessionDate.setHours(0, 0, 0, 0);

                if (
                    sessionDate.getTime() === startOfDay.getTime() &&
                    session.time === time &&
                    ["Pending", "Confirmed", "Rescheduled"].includes(session.status)
                ) {
                    totalBookedSlots++;
                    bookingDetails.push({
                        bookingId: booking._id,
                        sessionNumber: session.sessionNumber,
                        status: session.status,
                        user: booking.session_booking_user,
                        doctor: booking.session_booking_for_doctor,
                        clinic: booking.session_booking_for_clinic,
                        rescheduleHistory: session.rescheduleHistory,
                    });
                }
            });
        });

        console.log("Total Booked Slots:", totalBookedSlots);

        // Calculate availability using the correct variables
        const maxBookingsPerSlot = bookingConfig.booking_limit_per_slot || 0;
        const availableSlots = Math.max(0, maxBookingsPerSlot - totalBookedSlots);

        // Check if slot is available
        const isAvailable = availableSlots > 0;

        // Prepare response data
        const availabilityData = {
            available: isAvailable,
            availableSlots: availableSlots,
            bookedSlots: totalBookedSlots, // Use totalBookedSlots instead of currentBookings
            maxBookingsPerSlot: maxBookingsPerSlot,
            date: date,
            time: time,
            service_id: service_id ? service_id : null,
            clinic_id: clinic_id,
            bookingDetails: bookingDetails, // Use the actual bookingDetails array
            configuration: {
                slotsPerHour: bookingConfig.slots_per_hour,
                bookingLimitPerSlot: bookingConfig.booking_limit_per_slot
            },
            restrictions: hasSpecialRestriction
        };

        return {
            success: true,
            message: isAvailable
                ? `${availableSlots} slot(s) available for booking`
                : "No slots available for the requested time",
            data: availabilityData
        }

    } catch (error) {
        console.error('Error in getBookingsByDateAndTimePeriod:', error);
        return {
            success: false,
            message: "Internal server error while checking booking availability",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            data: null
        }
    }
};



// Helper function to check special restrictions
async function checkSpecialRestrictions(bookingDate, requestedTime, clinicId, specialRestrictions) {
    try {
        // Format the booking date to match stored dates (without time)
        const dateOnly = new Date(bookingDate.setHours(0, 0, 0, 0));

        // Find matching special restrictions
        for (const restriction of specialRestrictions) {
            if (!restriction.is_active) continue;

            // Check if restriction applies to this clinic (if clinic_id is specified)
            if (restriction.clinic_id && clinicId &&
                restriction.clinic_id.toString() !== clinicId.toString()) {
                continue;
            }

            // Check if restriction applies to this date
            if (restriction.date) {
                const restrictionDate = new Date(restriction.date);
                restrictionDate.setHours(0, 0, 0, 0);

                if (dateOnly.getTime() !== restrictionDate.getTime()) {
                    continue;
                }
            }

            // Check if requested time falls within restricted time slots
            if (restriction.time_slots && restriction.time_slots.length > 0) {
                for (const timeSlot of restriction.time_slots) {
                    if (isTimeInRange(requestedTime, timeSlot.start_time, timeSlot.end_time)) {
                        return {
                            isRestricted: true,
                            reason: `Time slot ${requestedTime} is restricted on ${bookingDate.toDateString()}`,
                            restrictionDetails: {
                                date: restriction.date,
                                timeSlot: timeSlot,
                                clinic_id: restriction.clinic_id
                            }
                        };
                    }
                }
            }
        }

        return {
            isRestricted: false,
            reason: null,
            restrictionDetails: null
        };

    } catch (error) {
        console.error('Error checking special restrictions:', error);
        return {
            isRestricted: false,
            reason: null,
            restrictionDetails: null
        };
    }
}

// Helper function to check if a time falls within a range
function isTimeInRange(timeToCheck, startTime, endTime) {
    try {
        const timeToCheckMinutes = timeToMinutes(timeToCheck);
        const startTimeMinutes = timeToMinutes(startTime);
        const endTimeMinutes = timeToMinutes(endTime);

        // Handle overnight time ranges (e.g., 22:00 to 06:00)
        if (endTimeMinutes < startTimeMinutes) {
            return timeToCheckMinutes >= startTimeMinutes || timeToCheckMinutes <= endTimeMinutes;
        } else {
            return timeToCheckMinutes >= startTimeMinutes && timeToCheckMinutes <= endTimeMinutes;
        }
    } catch (error) {
        console.error('Error checking time range:', error);
        return false;
    }
}

// Helper function to convert HH:MM to minutes
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Additional utility function to get availability for multiple time slots
exports.getAvailabilityForTimeRange = async (req, res) => {
    try {
        const { date, start_time, end_time, service_id, clinic_id } = req.body;

        if (!date || !start_time || !end_time || !service_id) {
            return res.status(400).json({
                success: false,
                message: "Date, start_time, end_time, and service_id are required",
                data: null
            });
        }

        const settings = await Settings.findOne().lean();
        const slotsPerHour = settings?.booking_config?.slots_per_hour || 2;

        // Generate time slots between start_time and end_time
        const timeSlots = generateTimeSlots(start_time, end_time, slotsPerHour);

        const availabilityPromises = timeSlots.map(async (time) => {
            // Simulate the availability check for each time slot
            const mockReq = { body: { date, time, service_id, clinic_id } };
            const mockRes = {
                status: () => ({ json: (data) => data }),
                json: (data) => data
            };

            try {
                const result = await exports.getBookingsByDateAndTimePeriod(mockReq, mockRes);
                return {
                    time,
                    ...result.data
                };
            } catch (error) {
                return {
                    time,
                    available: false,
                    error: error.message
                };
            }
        });

        const availabilityResults = await Promise.all(availabilityPromises);

        return res.status(200).json({
            success: true,
            message: "Time range availability retrieved successfully",
            data: {
                date,
                timeRange: { start_time, end_time },
                service_id,
                clinic_id,
                slots: availabilityResults
            }
        });

    } catch (error) {
        console.error('Error in getAvailabilityForTimeRange:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            data: null
        });
    }
};

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, slotsPerHour) {
    const slots = [];
    const minutesPerSlot = 60 / slotsPerHour;

    let currentTime = timeToMinutes(startTime);
    const endTimeMinutes = timeToMinutes(endTime);

    while (currentTime < endTimeMinutes) {
        const hours = Math.floor(currentTime / 60);
        const minutes = currentTime % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
        currentTime += minutesPerSlot;
    }

    return slots;
}