const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Basic App Information
    app_name: {
        type: String,
        required: [true, 'App name is required'],
        trim: true,
        minlength: [2, 'App name must be at least 2 characters'],
        maxlength: [120, 'App name cannot exceed 50 characters']
    },

    app_id: {
        type: String,
        required: [true, 'App ID is required'],
        trim: true,
        uppercase: true
    },

    website_url: {
        type: String,
        required: [true, 'Website URL is required'],
        trim: true,
        match: [/^https?:\/\/.+\..+/, 'Please enter a valid website URL']
    },

    // Booking Configuration
    booking_config: {
        slots_per_hour: {
            type: Number,
            required: [true, 'Slots per hour is required'],
            min: [1, 'Must have at least 1 slot per hour'],
            max: [12, 'Cannot exceed 12 slots per hour'],
            default: 2
        },
        booking_limit_per_slot: {
            type: Number,
            required: [true, 'Booking limit per slot is required'],
            min: [1, 'Must allow at least 1 booking per slot'],
            max: [10, 'Cannot exceed 10 bookings per slot'],
            default: 1
        }
    },

    // Special Day/Time Slot Management
    special_slot_restrictions: [{
        date: {
            type: Date,
            required: [false, 'Date is required for special restrictions']
        },
        time_slots: [{
            start_time: {
                type: String,
                required: [false, 'Start time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
            },
            end_time: {
                type: String,
                required: [false, 'End time is required'],
                match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
            }
        }],
        clinic_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Clinic',
            required: [false, 'Clinic ID is required']
        },

        is_active: {
            type: Boolean,
            default: true
        }
    }],

    // Payment Configuration
    payment_config: {
        enabled_methods: [{
            type: String,
            enum: ['razorpay', 'stripe', 'paypal', 'paytm', 'phonepe', 'gpay', 'cash', 'card'],
            required: true
        }],
        default_currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD', 'EUR', 'GBP'],
            required: true
        },
        tax_percentage: {
            type: Number,
            default: 0,
            min: [0, 'Tax percentage cannot be negative'],
            max: [100, 'Tax percentage cannot exceed 100%']
        },
        convenience_fee: {
            type: Number,
            default: 0,
            min: [0, 'Convenience fee cannot be negative']
        },
        credit_card_fee: {
            type: Number,
            default: 3,
           
        }
    },

    // Branding
    branding: {
        logo: {
            url: {
                type: String,
                required: [true, 'Logo URL is required'],
                trim: true
            },
            public_id: {
                type: String,
                required: [true, 'Logo public ID is required'],
                trim: true
            }
        },

    },


    social_links: {
        facebook: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?facebook\.com\/.*/, 'Please enter a valid Facebook URL']
        },
        instagram: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?instagram\.com\/.*/, 'Please enter a valid Instagram URL']
        },
        whatsapp: {
            type: String,
            trim: true,
           
        },
        youtube: {
            type: String,
            trim: true,
            match: [/^https?:\/\/(www\.)?youtube\.com\/.*/, 'Please enter a valid YouTube URL']
        }
    },

    // Contact Information
    contact_details: {
        phone_number: {
            type: String,
            required: [true, 'Primary phone number is required'],
            trim: true,
            match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        support_email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        }

    },

    // System Settings
    system_settings: {
        maintenance_mode: {
            type: Boolean,
            default: false
        },
        allow_registrations: {
            type: Boolean,
            default: true
        },
        max_file_upload_size: {
            type: Number,
            default: 5, // in MB
            min: [1, 'File size must be at least 1MB'],
            max: [50, 'File size cannot exceed 50MB']
        }
    },

    // SEO Settings
    seo_settings: {

        google_analytics_id: {
            type: String,
            trim: true
        },
        facebook_pixel_id: {
            type: String,
            trim: true
        }
    },

    // Version and Status
    version: {
        type: String,
        default: '1.0.0',
        required: true
    },

    is_active: {
        type: Boolean,
        default: true
    },


}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
settingsSchema.index({ app_id: 1 });
settingsSchema.index({ is_active: 1 });
settingsSchema.index({ 'special_slot_restrictions.date': 1, 'special_slot_restrictions.clinic_id': 1 });



// Pre-save middleware to ensure at least one payment method is enabled
settingsSchema.pre('save', function (next) {
    if (!this.payment_config.enabled_methods || this.payment_config.enabled_methods.length === 0) {
        this.payment_config.enabled_methods = ['cash'];
    }
    next();
});

// Method to check if app is in maintenance mode
settingsSchema.methods.isInMaintenanceMode = function () {
    return this.system_settings.maintenance_mode;
};

// Method to get active payment methods
settingsSchema.methods.getActivePaymentMethods = function () {
    return this.payment_config.enabled_methods || [];
};

// Method to check if a specific date/time is restricted for a clinic
settingsSchema.methods.isSlotRestricted = function (date, time, clinicId) {
    const restriction = this.special_slot_restrictions.find(r =>
        r.clinic_id.toString() === clinicId.toString() &&
        r.date.toDateString() === new Date(date).toDateString() &&
        r.is_active
    );

    if (!restriction) return false;

    return restriction.time_slots.some(slot =>
        time >= slot.start_time && time <= slot.end_time
    );
};

// Static method to get current settings (singleton pattern)
settingsSchema.statics.getCurrentSettings = function () {
    return this.findOne({ is_active: true }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Settings', settingsSchema);