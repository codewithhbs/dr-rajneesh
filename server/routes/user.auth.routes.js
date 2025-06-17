const express = require('express');
const { registerNormalUser, verifyEmailOtp, googleAuthRegisterAndLogin } = require('../controllers/auth/user.controller');
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

user_auth_router.get('/google/callback', googleAuthRegisterAndLogin);


module.exports = user_auth_router;