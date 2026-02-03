const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    service_name: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    service_slug: {
        type: String,
        unique: true,
        trim: true,
    },
    service_small_desc: {
        type: String,
        trim: true,
        required: true,
        maxlength: 200
    },
    service_desc: {
        type: String,
        trim: true
    },
    service_images: [
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
    service_status: {
        type: String,
        trim: true,
        enum: ['Booking Open', 'Booking Close', 'Draft', 'Published'],
        default: 'Draft'
    },
    appointment_status: {
        type: String,
        trim: true,
    },
    service_session_allowed_limit: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    service_per_session_price: {
        type: Number,
        required: true,
        min: 0
    },
    service_per_session_discount_price: {
        type: Number,
        min: 0
    },
    service_per_session_discount_percentage: {
        type: Number,
        min: 0,
        max: 100
    },
    service_tag: {
        type: String,
        trim: true
    },
    service_doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctor',
        required: false
    },
    service_available_at_clinics: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'clinic'
        }
    ],
    service_reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'review'
        }
    ],
    position: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('service', serviceSchema);
