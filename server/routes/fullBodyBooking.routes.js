const express = require("express");

const userCtrl = require("../controllers/fullBodyBooking/fullBodyBooking.user.controller");
const adminCtrl = require("../controllers/fullBodyBooking/fullBodyBooking.admin.controller");
const { isAuthenticated } = require("../middleware/protect"); // patient auth middleware

const router = express.Router();

// ===================== USER SIDE =====================
router.get("/user/services",  userCtrl.getActiveServices);
router.get("/user/services/:serviceId",  userCtrl.getServiceDetail);
router.post("/user/check-slot",  userCtrl.checkSlotAvailability);

router.post("/user/booking", isAuthenticated, userCtrl.createBooking);
router.get("/user/booking", isAuthenticated, userCtrl.getMyBookings);
router.get("/user/booking/:bookingId", isAuthenticated, userCtrl.getBookingDetail);
router.put("/user/booking/:bookingId/reschedule", isAuthenticated, userCtrl.rescheduleBooking);
router.put("/user/booking/:bookingId/cancel", isAuthenticated, userCtrl.cancelBooking);

router.post("/user/payment/initiate", isAuthenticated, userCtrl.initiatePayment);
router.post("/user/payment/verify", userCtrl.verifyPayment);
router.get("/user/payment/history", isAuthenticated, userCtrl.getMyPaymentHistory);

// ===================== ADMIN SIDE =====================
router.post("/admin/service", isAuthenticated, adminCtrl.createService);
router.get("/admin/service", isAuthenticated, adminCtrl.getAllServicesAdmin);
router.get("/admin/service/:serviceId", isAuthenticated, adminCtrl.getServiceByIdAdmin);
router.put("/admin/service/:serviceId", isAuthenticated, adminCtrl.updateService);
router.put("/admin/service/:serviceId/toggle-active", isAuthenticated, adminCtrl.toggleServiceActive);
router.delete("/admin/service/:serviceId", isAuthenticated, adminCtrl.softDeleteService);

router.post("/admin/service/:serviceId/included", isAuthenticated, adminCtrl.addIncludedService);
router.put("/admin/service/:serviceId/included/:index", isAuthenticated, adminCtrl.updateIncludedService);
router.put(
    "/admin/service/:serviceId/included/:index/toggle-active",
    isAuthenticated,
    adminCtrl.toggleIncludedServiceActive
);
router.delete("/admin/service/:serviceId/included/:index", isAuthenticated, adminCtrl.removeIncludedService);

router.post("/admin/service/:serviceId/blocked-date", isAuthenticated, adminCtrl.addBlockedDate);
router.delete("/admin/service/:serviceId/blocked-date", isAuthenticated, adminCtrl.removeBlockedDate);

router.get("/admin/booking", isAuthenticated, adminCtrl.getAllBookingsAdmin);
router.get("/admin/booking/:bookingId", isAuthenticated, adminCtrl.getBookingDetailAdmin);
router.put("/admin/booking/:bookingId/confirm", isAuthenticated, adminCtrl.confirmBooking);
router.put("/admin/booking/:bookingId/assign-doctor", isAuthenticated, adminCtrl.assignDoctor);
router.put("/admin/booking/:bookingId/reschedule", isAuthenticated, adminCtrl.rescheduleBookingAdmin);
router.post("/admin/booking/:bookingId/visit", isAuthenticated, adminCtrl.addVisit);
router.put("/admin/booking/:bookingId/cancel", isAuthenticated, adminCtrl.cancelBookingAdmin);
router.put("/admin/booking/:bookingId/no-show", isAuthenticated, adminCtrl.markNoShow);

router.post("/admin/booking/:bookingId/manual-payment", isAuthenticated, adminCtrl.recordManualPayment);
router.post("/admin/booking/:bookingId/refund", isAuthenticated, adminCtrl.refundPayment);
router.get("/admin/payment-history", isAuthenticated, adminCtrl.getAllPaymentHistoryAdmin);
router.get("/admin/dashboard-stats", isAuthenticated, adminCtrl.getDashboardStats);

module.exports = router;