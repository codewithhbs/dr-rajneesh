const express = require('express');
const { registerNormalUser, verifyEmailOtp, googleAuthRegisterAndLogin } = require('../controllers/auth/user.controller');
const { createReview } = require('../controllers/service/review.controller');
const { isAuthenticated } = require('../middleware/protect');
const { getBookingsByDateAndTimePeriod } = require('../controllers/bookings/BookingService');
const { createAorderForSession } = require('../controllers/bookings/CreateBooking');
const user_auth_router = express.Router()
const { CLIENT_ID, REDIRECT_URI } = process.env;

user_auth_router.post('/register', registerNormalUser)
user_auth_router.post('/verify-email-otp', verifyEmailOtp)

// Demo code 
user_auth_router.get('/auth/google', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
    res.status(200).json({
        success: true,
        redirect: url
    })
});


user_auth_router.post('/review', isAuthenticated, createReview);
user_auth_router.get('/google/callback', googleAuthRegisterAndLogin);


user_auth_router.post('/bookings/availability', isAuthenticated, getBookingsByDateAndTimePeriod);
user_auth_router.post('/bookings/sessions', isAuthenticated, createAorderForSession);





module.exports = user_auth_router;