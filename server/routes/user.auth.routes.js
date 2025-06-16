const express = require('express');
const { registerNormalUser, verifyEmailOtp } = require('../controllers/auth/user.controller');
const user_auth_router = express.Router()


user_auth_router.post('/register',registerNormalUser)
user_auth_router.post('/verify-email-otp',verifyEmailOtp)

module.exports = user_auth_router;