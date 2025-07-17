const express = require('express');
const { upload } = require('../middleware/multer');
const { createClinic, updateClinic, DeleteClinic, GetAllClinic, GetSingleClinic } = require('../controllers/clinic/clinic.controllers');
const { createDoctor, updateDoctor, DeleteDoctor, getAllDoctor, getSingleDoctor } = require('../controllers/doctor/doctor.controllers');
const { createService, getAllServices, getServiceById, updateService, deleteService, getServicesByDoctor, getServicesByClinic, updateServiceStatus, getServiceBySlug } = require('../controllers/service/service.controller');
const { getAllReviews, getReviewById, updateReview, deleteReview } = require('../controllers/service/review.controller');
const { createSettings, getOnlyOneSettings } = require('../controllers/settings/settings');
const { getAdminAllBookings, getAdminSingleBookings, getAdminChangeSessionInformation, addAndUpdateSessionPrescriptions, addNextSessionDate } = require('../controllers/bookings/CreateBooking');
const { getAvailableDates } = require('../controllers/D_Booking/D_Booking_Controoller');
const router = express.Router()


//Clinic Routes For CRUD
router.post('/create-clinic', upload.array('images'), createClinic)
router.put('/update-clinic/:id', upload.array('image'), updateClinic)
router.delete('/delete-clinic/:id', DeleteClinic)
router.get('/get-all-clinic', GetAllClinic)
router.get('/get-clinic/:id', GetSingleClinic)



//doctor Routes For CRUD
router.post('/create-doctor', upload.array('images'), createDoctor)
router.put('/update-doctor/:id', upload.array('images'), updateDoctor)
router.delete('/delete-doctor/:id', DeleteDoctor)
router.get('/get-all-doctor', getAllDoctor)
router.get('/get-doctor/:id', getSingleDoctor)

//services Routes For CRUD
router.post('/create-service', upload.array('images'), createService)
router.put('/update-service/:id', upload.array('images'), updateService)
router.delete('/delete-service/:id', deleteService)
router.get('/get-all-service', getAllServices)
router.get('/get-service/:id', getServiceById)
router.get('/get-service-slug/:slug', getServiceBySlug)
router.get('/get-service-by-doctor/:id', getServicesByDoctor)
router.get('/get-service-by-clinic/:id', getServicesByClinic)
router.put('/update-service-status/:id', updateServiceStatus)



router.get('/reviews', getAllReviews);
router.get('/review/:id', getReviewById);
router.put('/review/:id', updateReview);
router.delete('/review/:id', deleteReview);


router.post('/add-setting', createSettings)
router.get('/get-setting', getOnlyOneSettings)


// ADMIN WEB ROUTES
router.get('/admin-bookings', getAdminAllBookings);
router.get('/admin-bookings/:id', getAdminSingleBookings);
router.post('/admin-changes-sessions', getAdminChangeSessionInformation);
router.post('/admin-add-updated-prescriptions', upload.single('image'), addAndUpdateSessionPrescriptions);
router.post('/admin-add-next-sessions', addNextSessionDate);


// New Bookings
router.get('/get-available-date', getAvailableDates)

module.exports = router;   