const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    doctor_name: {
        type: String,
        unique: true,
        trim: true,
        required: true,
        maxlength: 100
    },
    doctor_images: [
        {
            url: {
                type: String,
                trim: true
            },
            public_id: {
                type: String,
                trim: true
            }
        }
    ],
    specialization: [
        {
            type: String,
            trim: true
        }
    ],
    languagesSpoken: [
        {
            type: String,
            trim: true
        }
    ],
    doctor_status: {
        type: String,
        trim: true,
        enum: ['Booking takes', 'Booking Closed', 'Draft', 'Published'],
        default: 'Draft'
    },
    doctor_ratings: {
        type: Number,
        default: 5,
        min: 0,
        max: 5
    },
    any_special_note: {
        type: String,
        trim: true,
        maxlength: 300
    },
    clinic_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clinic'

    }]
}, { timestamps: true });

module.exports = mongoose.model('doctor', doctorSchema);
