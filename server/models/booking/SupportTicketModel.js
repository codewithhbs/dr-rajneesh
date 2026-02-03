const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
    ticketId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookingSession',
        required: true,
        index: true
    },

    sessionNumber: {
        type: Number,
        default: null
    },

    issueType: {
        type: String,
        enum: [
            'booking_issue',
            'payment_issue',
            'reschedule_request',
            'cancellation_query',
            'refund_query',
            'medical_concern',
            'prescription_issue',
            'technical_issue',
            'feedback',
            'complaint',
            'other'
        ],
        required: true
    },

    subject: {
        type: String,
        maxlength: 200
    },

    description: {
        type: String,
        required: true,
        maxlength: 2000
    },

    contactPreference: {
        type: String,
        enum: ['email', 'phone', 'both'],
        default: 'email'
    },

    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
        default: 'open',
        index: true
    },

    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
        index: true
    },

    userDetails: {
        name: String,
        email: String,
        phone: String
    },

    bookingDetails: {
        bookingNumber: String,
        treatmentName: String
    },

    responses: [{
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' 
        },
        respondedByRole: {
            type: String,
            enum: ['admin', 'support', 'doctor', 'system']
        },
        message: {
            type: String,
            required: true
        },
        attachments: [{
            url: String,
            public_id: String,
            filename: String
        }],
        isInternal: {
            type: Boolean,
            default: false
        },
        respondedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Attachments from user
    attachments: [{
        url: String,
        public_id: String,
        filename: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    },

    assignedAt: Date,

    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    resolvedAt: Date,

    resolutionNotes: String,

    rating: {
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String,
        ratedAt: Date
    },

    // Escalation
    escalated: {
        type: Boolean,
        default: false
    },

    escalatedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    escalatedAt: Date,

    escalationReason: String,

    // Metadata
    tags: [String],

    category: {
        type: String,
        enum: ['booking', 'payment', 'medical', 'technical', 'general']
    },

    // Response time tracking
    firstResponseAt: Date,

    lastUpdatedAt: {
        type: Date,
        default: Date.now
    },

    // SLA tracking
    slaBreached: {
        type: Boolean,
        default: false
    },

    expectedResponseBy: Date,

    // Auto-close
    autoCloseScheduledAt: Date

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
SupportTicketSchema.index({ userId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: -1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });
SupportTicketSchema.index({ createdAt: -1 });

// Virtual for response time (in hours)
SupportTicketSchema.virtual('responseTimeHours').get(function() {
    if (this.firstResponseAt) {
        return Math.round((this.firstResponseAt - this.createdAt) / (1000 * 60 * 60));
    }
    return null;
});

// Virtual for resolution time (in hours)
SupportTicketSchema.virtual('resolutionTimeHours').get(function() {
    if (this.resolvedAt) {
        return Math.round((this.resolvedAt - this.createdAt) / (1000 * 60 * 60));
    }
    return null;
});

// Virtual for age (in days)
SupportTicketSchema.virtual('ageDays').get(function() {
    return Math.round((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate ticket ID
SupportTicketSchema.pre('save', async function(next) {
    if (this.isNew && !this.ticketId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.ticketId = `TKT-${timestamp}-${random}`;
    }

    // Update lastUpdatedAt
    this.lastUpdatedAt = new Date();

    // Set expected response time based on priority
    if (this.isNew) {
        const responseHours = {
            urgent: 2,
            high: 4,
            medium: 24,
            low: 48
        };
        const hours = responseHours[this.priority] || 24;
        this.expectedResponseBy = new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    next();
});

// Method to add response
SupportTicketSchema.methods.addResponse = function(responderId, message, role = 'support', isInternal = false) {
    this.responses.push({
        respondedBy: responderId,
        respondedByRole: role,
        message,
        isInternal,
        respondedAt: new Date()
    });

    // Set first response time if this is the first response
    if (!this.firstResponseAt && !isInternal) {
        this.firstResponseAt = new Date();
    }

    // If status is still 'open', change to 'in_progress'
    if (this.status === 'open') {
        this.status = 'in_progress';
    }

    return this.save();
};

// Method to resolve ticket
SupportTicketSchema.methods.resolve = function(resolvedBy, resolutionNotes) {
    this.status = 'resolved';
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.resolutionNotes = resolutionNotes;

    // Schedule auto-close after 7 days if no response
    this.autoCloseScheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.save();
};

// Method to escalate ticket
SupportTicketSchema.methods.escalate = function(escalatedTo, reason) {
    this.escalated = true;
    this.escalatedTo = escalatedTo;
    this.escalatedAt = new Date();
    this.escalationReason = reason;
    this.priority = 'urgent';
    this.status = 'escalated';

    return this.save();
};

// Method to rate resolution
SupportTicketSchema.methods.rateResolution = function(score, feedback) {
    this.rating = {
        score,
        feedback,
        ratedAt: new Date()
    };

    // Close ticket after rating
    this.status = 'closed';

    return this.save();
};

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);