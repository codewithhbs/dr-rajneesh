const mongoose = require('mongoose');

const ClinicSchema = new mongoose.Schema({
    clinic_name: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        maxlength: 100
    },
    clinic_images: [
        {
            url: {
                type: String,
                trim: true,
                required: false
            },
            public_id: {
                type: String,
                trim: true,
                required: false
            }
        }
    ],
    clinic_contact_details: {
        email: {
            type: String,
            trim: true,
            required: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
        },
        phone_numbers: [
            {
                type: String,
                trim: true,
                required: true,
                match: [/^[0-9\-\+\s]{10,15}$/, 'Invalid phone number format']
            }
        ],
        clinic_address: {
            type: String,
            trim: true,
            required: true,
            maxlength: 300
        }
    },
    clinic_map: {
        type: String,
        trim: true,
        required: true
    },
    clinic_timings: {
        open_time: {
            type: String,
            trim: true,
            required: true
        },
        close_time: {
            type: String,
            trim: true,
            required: true
        },
        off_day: {
            type: String,
            trim: true,
            required: true,
            enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        }
    },
    BookingAvailabeAt: {
        start_date: {
            type: Date,
            required: true
        },
        end_date: {
            type: Date,
            required: true
        }
    },
    BookingAvailabePastHistory: [
        {
            start_date: {
                type: Date
            },
            end_date: {
                type: Date
            },
            closed_reason: {
                type: String,
                trim: true
            }
        }
    ],
    clinic_stauts: {
        type: String,
        trim: true,
        enum: ['Booking Open', 'Booking Close', 'Draft', 'Published'],
        default: 'Draft'
    },
    clinic_ratings: {
        type: Number,
        default: 5,
        min: 0,
        max: 5
    },
    any_special_note: {
        type: String,
        trim: true,
        maxlength: 300
    }
}, { timestamps: true });


ClinicSchema.pre('save', async function (next) {
    if (!this.isModified('BookingAvailabeAt')) {
        return next();
    }

    if (this.isNew) return next();

    const existing = await this.constructor.findById(this._id);

    if (existing && existing.BookingAvailabeAt) {
        this.BookingAvailabePastHistory.push({
            start_date: existing.BookingAvailabeAt.start_date,
            end_date: existing.BookingAvailabeAt.end_date
        });
    }

    next();
});

module.exports = mongoose.model('clinic', ClinicSchema);
