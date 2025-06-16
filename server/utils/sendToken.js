const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate a JWT token
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME || '1h'
  });
};

// Send token as cookie + response
const sendToken = async (user, statusCode, res, message) => {
  try {
    console.log('🔐 Generating token...');

    // Payload for JWT
    const payload = {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name,
      isGoogleAuth: user.isGoogleAuth,
      profileImage: user.profileImage?.url || null,
      status: user.status
    };

    const token = createToken(payload);

    const cookieOptions = {
      expires: new Date(Date.now() + (process.env.COOKIE_EXPIRES_TIME || 1) * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Set cookie
    console.log('🍪 Setting cookies...');
    res.cookie('_usertoken', token, cookieOptions);

    // Avoid leaking password
    user.password = undefined;

    // Send response
    console.log('📤 Sending response...');
    res.status(statusCode).json({
      success: true,
      message,
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isGoogleAuth: user.isGoogleAuth,
        profileImage: user.profileImage?.url || null,
        status: user.status,
        termsAccepted: user.termsAccepted,
        emailVerified: user.emailVerification?.isVerified || false
      }
    });

  } catch (error) {
    console.error('❌ Error in sendToken:', error);
    res.status(500).json({ success: false, message: 'Token handling failed' });
  }
};

// Verify JWT
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  sendToken,
  createToken,
  verifyToken
};
