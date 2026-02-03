const rateLimit = require('express-rate-limit');

const NODE_ENV = process.env.NODE_ENV || 'development';


const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 9650,
  standardHeaders: true, 
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});

// API-specific rate limiter (stricter)
const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many API requests from this IP, please try again later.',
});

module.exports = {
  corsOptions,
  globalLimiter,
  apiLimiter,
};
