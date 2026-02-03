const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    review_message: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    review_ratings: {
        type: Number,
        default: 5,
        min: 0,
        max: 5
    },
    review_for_what_service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'service',
        required: true
    },
    review_status: {
        type: String,
        trim: true,
        enum: ['Draft', 'Published'],
        default: 'Draft'
    }
}, { timestamps: true });

module.exports = mongoose.model('review', reviewSchema);
