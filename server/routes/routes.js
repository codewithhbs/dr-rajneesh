const express = require('express');
const { upload } = require('../middleware/multer');
const { createClinic, updateClinic, DeleteClinic, GetAllClinic, GetSingleClinic } = require('../controllers/clinic/clinic.controllers');
const { createDoctor, updateDoctor, DeleteDoctor, getAllDoctor, getSingleDoctor } = require('../controllers/doctor/doctor.controllers');
const { createService, getAllServices, getServiceById, updateService, deleteService, getServicesByDoctor, getServicesByClinic, updateServiceStatus, getServiceBySlug } = require('../controllers/service/service.controller');
const { createReview, getAllReviews, getReviewById, updateReview, deleteReview } = require('../controllers/service/review.controller');
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


router.post('/review',createReview);
router.get('/reviews',getAllReviews);
router.get('/review/:id',getReviewById);
router.put('/review/:id',updateReview);
router.delete('/review/:id',deleteReview);






module.exports = router;