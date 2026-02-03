const express = require('express');
const router = express.Router();

const {
    getUserBookings,
    getUserSingleBooking,
    userRescheduleSession,
    userCancelSession,
    userRequestRefund,
    userSessionHelpSupport,
    downloadSessionPrescription,
    getUserUpcomingSessions,
    getUserBookingHistory
} = require('../controllers/bookings/UserBookingManage');
const { isAuthenticated } = require('../middleware/protect');


router.get('/my-bookings',isAuthenticated, getUserBookings);
router.get('/my-bookings/:bookingId', getUserSingleBooking);

// Get upcoming sessions
router.get('/my-bookings/upcoming/sessions',isAuthenticated, getUserUpcomingSessions);

// Get booking history (past/completed sessions)
router.get('/my-bookings/history/all',isAuthenticated, getUserBookingHistory);

// Reschedule a session
router.post('/my-bookings/reschedule',isAuthenticated, userRescheduleSession);

// Cancel a session
router.post('/my-bookings/cancel',isAuthenticated, userCancelSession);

// Request refund
router.post('/my-bookings/refund/request',isAuthenticated, userRequestRefund);

// Submit help & support request
router.post('/my-bookings/support',isAuthenticated, userSessionHelpSupport);

// Download session prescription
router.get('/my-bookings/:bookingId/prescription/:sessionNumber',isAuthenticated, downloadSessionPrescription);

module.exports = router;