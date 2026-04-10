const express = require('express');
const { registerNormalUser, verifyEmailOtp, googleAuthRegisterAndLogin, getUserProfile, getBookingHistory, registerNormal, resendVerificationEmail, loginUser, requestPasswordReset, verifyPasswordResetOtp, googleVerifyRegisterAndLogin, updateUserProfile, verifyOtpWhileUpdating, verifyOtpViaNumber, sendLoginOtp, verifyLoginOtp, resendLoginOtp } = require('../controllers/auth/user.controller');
const { createReview } = require('../controllers/service/review.controller');
const { isAuthenticated } = require('../middleware/protect');
const { getBookingsByDateAndTimePeriod } = require('../controllers/bookings/BookingService');
const { createBookingForSession, verifyPayment, handlePaymentFailure, foundBookingViaId, verifyRazorpayPayment, verifyPhonePeCallback, checkPhonePeStatus } = require('../controllers/bookings/CreateBooking');
const { getAllUser, getSingleUser, updateUser, deleteUser } = require('../controllers/admin/userRealated');
const user_auth_router = express.Router()
const { CLIENT_ID, REDIRECT_URI } = process.env;

user_auth_router.post('/register', registerNormalUser)
user_auth_router.post('/verify-email-otp', verifyEmailOtp)
user_auth_router.post('/resend-email-otp', resendVerificationEmail)
user_auth_router.post('/login-user', loginUser)
user_auth_router.post('/request-password-reset', requestPasswordReset)
user_auth_router.post('/update-profile', isAuthenticated, updateUserProfile)
user_auth_router.post('/verify-otp-update', isAuthenticated, verifyOtpWhileUpdating)
user_auth_router.post('/verify-password-reset', verifyPasswordResetOtp)

// New logins
user_auth_router.post("/login/send-otp", sendLoginOtp);

user_auth_router.post("/login/verify-otp", verifyLoginOtp);

user_auth_router.post("/login/resend-otp", resendLoginOtp);



// Register Via Number and Otp Only

user_auth_router.post('/register-via-number', registerNormal)
user_auth_router.post('/verify-otp-via-number',verifyOtpViaNumber)
// Demo code 
user_auth_router.get('/auth/google', (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&access_type=offline&prompt=consent`;
    res.status(200).json({
        success: true,
        redirect: url
    })
});


user_auth_router.post('/verify-token-google-auth', googleVerifyRegisterAndLogin)
user_auth_router.post('/review', isAuthenticated, createReview);
user_auth_router.get('/profile', isAuthenticated, getUserProfile);
user_auth_router.get('/google/callback', googleAuthRegisterAndLogin);


user_auth_router.post('/bookings/availability', isAuthenticated, getBookingsByDateAndTimePeriod);
user_auth_router.post('/bookings/sessions', isAuthenticated, createBookingForSession);

user_auth_router.post('/bookings/razarpay/verify-payment', verifyRazorpayPayment);
user_auth_router.post('/bookings/phonepe/verify-payment/:bookingId', verifyPhonePeCallback);
user_auth_router.post('/bookings/phonepe/check-status', checkPhonePeStatus);



user_auth_router.post('/bookings/payment-failed', isAuthenticated, handlePaymentFailure);
user_auth_router.get('/found-booking/:id', foundBookingViaId);

user_auth_router.get('/found-bookings', isAuthenticated, getBookingHistory)




// Admin
user_auth_router.get('/users', getAllUser);
user_auth_router.get('/users/:id', getSingleUser);
user_auth_router.put('/users/:id', updateUser);
user_auth_router.delete('/users/:id', deleteUser);


module.exports = user_auth_router;
