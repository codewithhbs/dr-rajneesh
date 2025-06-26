const mongoose = require('mongoose');

const DriectBookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clinic',
    required: true
  },

  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  patientPhone: {
    type: String,
    required: [true, 'Patient phone is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  sessions: {
    type: Number,
    required: [true, 'Number of sessions is required'],
    min: [1, 'At least 1 session is required'],
    max: [6, 'Maximum 6 sessions allowed']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'card', 'cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    sparse: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'confirmed'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  
  checkInTime: Date,
  checkOutTime: Date
}, {
  timestamps: true
});

// Generate booking ID before saving
DriectBookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    this.bookingId = 'BK' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// Index for efficient queries
DriectBookingSchema.index({ user: 1, createdAt: -1 });
DriectBookingSchema.index({ clinic: 1, timeSlot: 1 });
DriectBookingSchema.index({ bookingId: 1 });
DriectBookingSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', DriectBookingSchema);
