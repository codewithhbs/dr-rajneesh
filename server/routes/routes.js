const express = require('express');
const { upload } = require('../middleware/multer');
const { createClinic, updateClinic, DeleteClinic, GetAllClinic, GetClinicCount, GetSingleClinic } = require('../controllers/clinic/clinic.controllers');
const { createDoctor, updateDoctor, DeleteDoctor, getAllDoctor, getDoctorCount, getSingleDoctor } = require('../controllers/doctor/doctor.controllers');
const { createService, getAllServices, getServiceCount, getServiceById, updateService, deleteService, getServicesByDoctor, getServicesByClinic, updateServiceStatus, getServiceBySlug } = require('../controllers/service/service.controller');
const { getAllReviews, getReviewById, updateReview, deleteReview } = require('../controllers/service/review.controller');
const { createSettings, getOnlyOneSettings } = require('../controllers/settings/settings');
const { getAdminAllBookings, getAllBookingCount, getAdminSingleBookings, getAdminChangeSessionInformation, addAndUpdateSessionPrescriptions, addNextSessionDate, changeSessionStatus, deleteSession } = require('../controllers/bookings/CreateBooking');
const { getAvailableDates } = require('../controllers/D_Booking/D_Booking_Controoller');
const { createNotification, getAllValidNotifications, deleteNotification, updateNotification } = require('../controllers/settings/notification');
const { getAllUsers, getUserCount, adminLogin, adminProfile, adminLogout, updateAdminProfile, changeAdminPassword } = require('../controllers/auth/user.controller');
const { isAdmin } = require('../middleware/protect');
const { createCategory, getAllCategories, getSingleCategory, updateCategory, deleteCategory } = require('../controllers/Blogs/BlogCategory');
const { createBlog, getAllBlogs, getBlogsCount, updateBlog, deleteBlog, getSingleBlog, getSingleBlogBySlug } = require('../controllers/Blogs/Blogs');
const { updateConfigSettings, getSettings } = require("../controllers/settings/settings.controller");
const { createAddOn, getAllAddOns, getAddOnById, updateAddOn, deleteAddOn } = require('../controllers/service/addOn.controller');
const { getServices } = require('../controllers/service/other.controller');
const { createContact, getAllContacts, markAsSeen, solveContact } = require('../controllers/Contact/Contact.controller');

const router = express.Router()


//Clinic Routes For CRUD
router.post('/create-clinic', upload.array('images'), createClinic)
router.put('/update-clinic/:id', upload.array('image'), updateClinic)
router.delete('/delete-clinic/:id', DeleteClinic)
router.get('/get-all-clinic', GetAllClinic)
router.get('/get-clinic-count', GetClinicCount);
router.get('/get-clinic/:id', GetSingleClinic)



//doctor Routes For CRUD
router.post('/create-doctor', upload.array('images'), createDoctor)
router.put('/update-doctor/:id', upload.array('images'), updateDoctor)
router.delete('/delete-doctor/:id', DeleteDoctor)
router.get('/get-all-doctor', getAllDoctor)
router.get("/get-doctor-count", getDoctorCount);
router.get('/get-doctor/:id', getSingleDoctor)

//services Routes For CRUD
router.post('/create-service', upload.array('images'), createService)
router.put('/update-service/:id', upload.array('images'), updateService)
router.delete('/delete-service/:id', deleteService)
router.get('/get-all-service', getAllServices)
router.get('/get-service-count', getServiceCount);
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
router.get("/get-booking-count", getAllBookingCount);
router.get('/admin-bookings', getAdminAllBookings);
router.get('/admin-bookings/:id', getAdminSingleBookings);
router.post('/admin-changes-sessions', getAdminChangeSessionInformation);
router.post('/admin-add-updated-prescriptions', upload.single('image'), addAndUpdateSessionPrescriptions);
router.post('/admin-add-next-sessions', addNextSessionDate);

// ADMIN WEB ROUTES
router.put("/admin-session-change-status/:id", isAdmin, changeSessionStatus);
router.post("/admin-session-delete", deleteSession);




// New Bookings
router.get('/get-available-date', getAvailableDates)



// New Notification Routes
router.post('/add-notification', createNotification);
router.get('/get-notifications', getAllValidNotifications);
router.delete('/delete-notification/:id', deleteNotification);
router.put('/update-notification/:id', updateNotification);


// for admin web
router.get('/admin/get-all-user',  getAllUsers);

// Route to get user count for dashboard
router.get('/get-user-count', getUserCount);

// Route to for addons 

router.post("/add-on", createAddOn);
router.get("/add-on", getAllAddOns);
router.get("/add-on/:id", getAddOnById);
router.put("/add-on/:id", updateAddOn);
router.delete("/add-on/:id", deleteAddOn);

//for admin login
router.post("/admin/login", adminLogin);
router.get("/admin/profile", isAdmin, adminProfile);
router.get("/admin/logout", isAdmin, adminLogout);
router.put("/admin/update-profile", isAdmin, updateAdminProfile);
router.put("/admin/change-password", isAdmin, changeAdminPassword);


router.get("/admin/check-auth", (req, res) => {
  if (req.session && req.session.role === "admin") {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});


router.post("/create-category", isAdmin, createCategory);
router.get("/all-categories", getAllCategories);
router.get("/get-category/:id", getSingleCategory);
router.put("/update-category/:id", isAdmin, updateCategory);
router.delete("/delete-category/:id", isAdmin, deleteCategory);

// contact
router.post("/contact", createContact);
router.get("/admin/contacts", getAllContacts);
router.patch("/admin/contacts/:id/seen", markAsSeen);
router.patch("/admin/contacts/:id/solve", solveContact);



router.post("/other-service", createService);
router.get("/other-service", getServices);
router.get("/other-service/:id", getServiceById);
router.put("/other-service/:id", updateService);
router.delete("/other-service/:id", deleteService);


router.post("/create-blog", isAdmin, upload.single("image"), createBlog);
router.get("/get-all-blogs", getAllBlogs);
router.get("/get-blogs-count", getBlogsCount);
router.get("/get-blog/:id", getSingleBlog);
router.get("/get-blog/slug/:slug", getSingleBlogBySlug);
router.put("/update-blog/:id", isAdmin, upload.single("image"), updateBlog);
router.delete("/delete-blog/:id", isAdmin, deleteBlog)

router.get("/get-config-settings", getSettings);
router.put("/update-config-settings/:id", (req, res, next) => {
  if (req.session && req.session.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
}, updateConfigSettings);




module.exports = router;   