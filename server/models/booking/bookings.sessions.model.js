const mongoose = require('mongoose');

const BookingSessionSchema = new mongoose.Schema({

    bookingNumber: {
        type: String,
    },

    // Treatment details
    treatment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'service'
    },
    direct_booking: {
        type: Boolean,
        default: false
    },
    no_of_session_book: {
        type: Number,
        required: true,
        min: [1, 'At least one session must be booked'],

    },

    // paitent details

    patient_details: {
        name: String,
        email: String,
        phone: String,
        aadhar: String,
    },

    // Session details with enhanced tracking
    SessionDates: [{

        sessionNumber: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true,
            index: true
        },
        time: {
            type: String,
            required: true,

        },

        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Rescheduled', 'No-Show'],
            default: 'Pending'
        },
        cancellationReason: {
            type: String,
            maxlength: 500
        },
        rescheduleHistory: [{
            previousDate: Date,
            previousTime: String,
            rescheduledAt: {
                type: Date,
                default: Date.now
            },
            reason: String
        }],
        completedAt: Date
    }],


    session_booking_user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },

    session_booking_for_clinic: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'clinic',
        index: true
    },

    session_booking_for_doctor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'doctor',
        index: true
    },

    // Prescription management
    session_prescriptions: [{
        sessionNumber: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        prescriptionType: {
            type: String,
            enum: ['Pre-Treatment', 'Post-Treatment', 'Follow-up', 'Emergency'],
            default: 'Post-Treatment'
        },
        url: {
            type: String,
            default: ''
        },
        public_id: {
            type: String,
            default: ''
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }

    }],

    // Overall booking status
    session_status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Payment Not Completed', 'Cancelled', 'Completed', 'Rescheduled', 'Partially Completed'],
        default: 'Pending',
        index: true
    },

    // Payment information
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Payment'
    },

    // Pricing details
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
    },

    amountPerSession: {
        type: Number,
        required: true
    },
    payment_verified_at: {
        type: Date,
    },

    // Booking source and metadata
    bookingSource: {
        type: String,
        enum: ['web', 'mobile', 'phone', 'walk-in', 'referral','app'],
        default: 'web'
    },

    // Cancellation and refund 
    cancellation: {
        cancelledAt: Date,
        cancelledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        cancellationReason: {
            type: String,
            enum: ['Patient Request', 'Doctor Unavailable', 'Clinic Closed', 'Emergency', 'Payment Issue', 'Other'],
        },
        refundEligible: {
            type: Boolean,
            default: false
        },
        refundAmount: Number
    },



    // Internal tracking
    priority: {
        type: String,
        enum: ['Low', 'Normal', 'High', 'Urgent'],
        default: 'Normal'
    },



}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
BookingSessionSchema.index({ session_booking_user: 1, createdAt: -1 });
BookingSessionSchema.index({ session_booking_for_doctor: 1, 'SessionDates.date': 1 });
BookingSessionSchema.index({ session_booking_for_clinic: 1, session_status: 1 });
BookingSessionSchema.index({ 'SessionDates.date': 1, 'SessionDates.status': 1 });
BookingSessionSchema.index({ bookingNumber: 1 });

// Virtual for completed sessions count
BookingSessionSchema.virtual('completedSessionsCount').get(function () {
    return this.SessionDates.filter(session => session.status === 'Completed').length;
});

// Virtual for next session
BookingSessionSchema.virtual('nextSession').get(function () {
    const now = new Date();
    return this.SessionDates
        .filter(session => session.date > now && ['Pending', 'Confirmed'].includes(session.status))
        .sort((a, b) => a.date - b.date)[0];
});

// Virtual for booking progress
BookingSessionSchema.virtual('progressPercentage').get(function () {
    const completed = this.completedSessionsCount;
    return Math.round((completed / this.no_of_session_book) * 100);
});

// Pre-save middleware to generate booking number
BookingSessionSchema.pre('save', async function (next) {
    if (this.isNew && !this.bookingNumber) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 4);
        this.bookingNumber = `BK-${timestamp}-${random}`.toUpperCase();
    }
    next();
});

// Method to reschedule a session
BookingSessionSchema.methods.rescheduleSession = function (sessionNumber, newDate, newTime, reason) {
    const session = this.SessionDates.find(s => s.sessionNumber === sessionNumber);
    if (session) {
        session.rescheduleHistory.push({
            previousDate: session.date,
            previousTime: session.time,
            reason: reason
        });
        session.date = newDate;
        session.time = newTime;
        session.status = 'Confirmed';
        return this.save();
    }
    throw new Error('Session not found');
};

// Method to complete a session
BookingSessionSchema.methods.completeSession = function (sessionNumber) {
    const session = this.SessionDates.find(s => s.sessionNumber === sessionNumber);
    if (session) {
        session.status = 'Completed';
        session.completedAt = new Date();


        // Update overall status if all sessions completed
        if (this.completedSessionsCount === this.no_of_session_book - 1) {
            this.session_status = 'Completed';
        }
        return this.save();
    }
    throw new Error('Session not found');
};



BookingSessionSchema.methods.cancelSession = function (sessionNumber, cancellationReason) {
    const session = this.SessionDates.find(s => s.sessionNumber === sessionNumber);
    if (session) {
        session.status = 'Cancelled';
        session.cancellationReason = cancellationReason;
        session.completedAt = new Date();

        // Update overall status if all sessions completed
        if (this.completedSessionsCount === this.no_of_session_book - 1) {
            this.session_status = 'Completed';
        }
        return this.save();
    }
    throw new Error('Session not found');
};




module.exports = mongoose.model('BookingSession', BookingSessionSchema);