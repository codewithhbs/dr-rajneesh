const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  clinic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'clinic',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
  },
  maxBookings: {
    type: Number,
    required: [true, 'Max bookings is required'],
    min: [1, 'Max bookings must be at least 1'],
    max: [10, 'Max bookings cannot exceed 10']
  },
  currentBookings: {
    type: Number,
    default: 0,
    min: 0
  },
  sessionType: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  duration: {
    type: Number, 
    default: 12,
    min: [5, 'Duration must be at least 5 minutes'],
    max: [60, 'Duration cannot exceed 60 minutes']
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
timeSlotSchema.index({ clinic: 1, date: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ date: 1, sessionType: 1 });
timeSlotSchema.index({ clinic: 1, date: 1 });

// Virtual for availability
timeSlotSchema.virtual('isAvailable').get(function() {
  return this.isActive && this.currentBookings < this.maxBookings;
});

// Virtual for remaining slots
timeSlotSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.maxBookings - this.currentBookings);
});

// Method to check if slot can be booked
timeSlotSchema.methods.canBook = function(requestedSlots = 1) {
  return this.isActive && 
         (this.currentBookings + requestedSlots) <= this.maxBookings &&
         new Date(this.date) >= new Date().setHours(0, 0, 0, 0);
};

// Method to book slots
timeSlotSchema.methods.bookSlots = function(slotsToBook = 1) {
  if (!this.canBook(slotsToBook)) {
    throw new Error('Cannot book the requested number of slots');
  }
  this.currentBookings += slotsToBook;
  return this.save();
};

// Method to release slots
timeSlotSchema.methods.releaseSlots = function(slotsToRelease = 1) {
  this.currentBookings = Math.max(0, this.currentBookings - slotsToRelease);
  return this.save();
};

// Ensure virtuals are included in JSON output
timeSlotSchema.set('toJSON', { virtuals: true });
timeSlotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
