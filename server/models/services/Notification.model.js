const mongoose = require('mongoose');


const notificationSchema = new mongoose.Schema({
    messages: {
        type: String,
        required: true,
        trim: true
    },

    expiredThis: {
        type: Date,
        default: Date.now,
        expires: '1d'
    },
    position: {
        type: Number,
        required: true,
    },
    status:{
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }

}, { timestamps: true });

const Notification = mongoose.model('notification', notificationSchema);
module.exports = Notification;
