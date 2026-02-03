
const Service = require("../../models/services/services.model");
const { deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");
const mongoose = require('mongoose');
const { getRedisClient, cleanRedisDataFlush } = require("../../utils/redis.utils");

function slugToTitle(slug) {
    return slug
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(" ");
}

function slugify(str) {
    return str
        .toLowerCase()           
        .trim()                  
        .replace(/[^\w\s-]/g, '') 
        .replace(/[\s_-]+/g, '-') 
        .replace(/^-+|-+$/g, ''); 
}


// Create Service
exports.createService = async (req, res) => {
    const redisClient = getRedisClient(req, res);
    let uploadedFiles = [];

    try {
        const {
            service_name,
            service_small_desc,
            service_desc,
            service_status,
            appointment_status,
            service_session_allowed_limit,
            service_per_session_price,
            service_per_session_discount_price,
            service_per_session_discount_percentage,
            service_tag,
            service_doctor,
            service_available_at_clinics,
            position
        } = req.body;

        // Handle file uploads if present
        if (req.files && req.files.length > 0) {
            uploadedFiles = await uploadMultipleFiles(req.files);
        }

        if (service_small_desc.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'Service small description should not exceed 200 characters'
            });
        }
        // Create service object
        const serviceData = {
            service_name,
            service_slug: slugify(service_name),
            service_small_desc,
            service_desc,
            service_status,
            appointment_status,
            service_session_allowed_limit,
            service_per_session_price,
            service_per_session_discount_price,
            service_per_session_discount_percentage,
            service_tag,
            service_doctor,
            service_available_at_clinics,
            position,
            service_images: uploadedFiles
        };

        // Create service
        const service = new Service(serviceData);
        const savedService = await service.save();



        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'service*');

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            data: savedService
        });

    } catch (error) {
        // Delete uploaded files if error occurs
        if (uploadedFiles.length > 0) {
            await deleteMultipleFilesCloud(uploadedFiles.map(file => file.public_id));
        }
        if (req.files && req.files.length > 0) {
            deleteMultipleFiles(req.files);
        }

        console.error('Error creating service:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating service',
            error: error.message
        });
    }
};

// Get All Services
exports.getAllServices = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const {
            page = 1,
            limit = 20,
            status,
            doctor,
            clinic,
            search
        } = req.query;

        const cacheKey = `services:all:${page}:${limit}:${status || 'all'}:${doctor || 'all'}:${clinic || 'all'}:${search || 'all'}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Build query
        let query = {};

        if (status) {
            query.service_status = status;
        }

        if (doctor) {
            query.service_doctor = doctor;
        }

        if (clinic) {
            query.service_available_at_clinics = { $in: [clinic] };
        }

        if (search) {
            query.$or = [
                { service_name: { $regex: search, $options: 'i' } },
                { service_small_desc: { $regex: search, $options: 'i' } },
                { service_tag: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Get services with pagination
        const services = await Service.find(query)
            .populate('service_doctor')
            .populate('service_available_at_clinics')

            .sort({ position: 1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count
        const totalServices = await Service.countDocuments(query);
        const totalPages = Math.ceil(totalServices / limit);

        const responseData = {
            success: true,
            message: 'Services retrieved successfully',
            data: services,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalServices,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        };

        // Cache the response
        await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 300);

        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving services',
            error: error.message
        });
    }
};


// Get Service Count
exports.getServiceCount = async (req, res) => {
  try {
    const { status, doctor, clinic, search } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.service_status = status;
    }

    if (doctor) {
      query.service_doctor = doctor;
    }

    if (clinic) {
      query.service_available_at_clinics = { $in: [clinic] };
    }

    if (search) {
      query.$or = [
        { service_name: { $regex: search, $options: 'i' } },
        { service_small_desc: { $regex: search, $options: 'i' } },
        { service_tag: { $regex: search, $options: 'i' } }
      ];
    }

    const totalServices = await Service.countDocuments(query);

    res.status(200).json({
      success: true,
      count: totalServices
    });

  } catch (error) {
    console.error("Error getting service count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve service count",
      error: error.message
    });
  }
};



// Get Service By ID
exports.getServiceById = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }

        const cacheKey = `service:${id}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const service = await Service.findById(id)
            .populate('service_doctor')
            .populate('service_available_at_clinics')
            ;

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        const responseData = {
            success: true,
            message: 'Service retrieved successfully',
            data: service
        };

        // Cache the response
        await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 300);

        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving service',
            error: error.message
        });
    }
};

exports.getServiceBySlug = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const { slug } = req.params;
        const cacheKey = `service:${slug}`;   // ✅ FIX

        console.log(`Fetching service with slug: ${slug}`);

        // 🔹 Check Redis cache first
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        let service = await Service.findOne({ service_slug: slug })
            .select('-service_available_at_clinics')
            .populate('service_doctor');

        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Populate reviews
        if (Array.isArray(service.service_reviews) && service.service_reviews.length > 0) {
            await service.populate({
                path: 'service_reviews',
                populate: { path: 'reviewer_id' }
            });

            // Filter only published reviews
            service.service_reviews = service.service_reviews.filter(
                review => review.review_status === 'Published'
            );
        }

        const responseData = {
            success: true,
            message: 'Service retrieved successfully',
            data: service
        };

        // ✅ Save to Redis (5 minutes)
        await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 300);

        return res.status(200).json(responseData);

    } catch (error) {
        console.error('Error retrieving service by slug:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving service',
            error: error.message
        });
    }
};


// Update Service
exports.updateService = async (req, res) => {
    const redisClient = getRedisClient(req, res);
    let uploadedFiles = [];

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }

        const existingService = await Service.findById(id);
        if (!existingService) {
            if (req.files && req.files.length > 0) {
                deleteMultipleFiles(req.files);
            }
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        const {
            service_name,
            service_small_desc,
            service_desc,
            service_status,
            appointment_status,
            service_session_allowed_limit,
            service_per_session_price,
            service_per_session_discount_price,
            service_per_session_discount_percentage,
            service_tag,
            service_doctor,
            service_available_at_clinics,
            position,
            remove_images
        } = req.body;

        // Handle new file uploads
        if (req.files && req.files.length > 0) {
            uploadedFiles = await uploadMultipleFiles(req.files);
        }

        // Handle image removal
        let currentImages = [...existingService.service_images];
        if (remove_images) {
            const imagesToRemove = Array.isArray(remove_images) ? remove_images : [remove_images];
            const imagesToDelete = currentImages.filter(img => imagesToRemove.includes(img.public_id));

            if (imagesToDelete.length > 0) {
                await deleteMultipleFilesCloud(imagesToDelete.map(img => img.public_id));
                currentImages = currentImages.filter(img => !imagesToRemove.includes(img.public_id));
            }
        }

        // Combine existing and new images
        const finalImages = [...currentImages, ...uploadedFiles];

        // Update service
        const updateData = {
            service_name,
            service_slug: slugify(service_name),
            service_small_desc,
            service_desc,
            service_status,
            appointment_status,
            service_session_allowed_limit,
            service_per_session_price,
            service_per_session_discount_price,
            service_per_session_discount_percentage,
            service_tag,
            service_doctor,
            service_available_at_clinics,
            position,
            service_images: finalImages
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        const updatedService = await Service.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('service_doctor', 'doctor_name doctor_email')
            .populate('service_available_at_clinics', 'clinic_name clinic_address')
            ;

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'service*');

        res.status(200).json({
            success: true,
            message: 'Service updated successfully',
            data: updatedService
        });

    } catch (error) {
        // Delete uploaded files if error occurs
        if (uploadedFiles.length > 0) {
            await deleteMultipleFilesCloud(uploadedFiles.map(file => file.public_id));
        }
        if (req.files && req.files.length > 0) {
            deleteMultipleFiles(req.files);
        }

        res.status(500).json({
            success: false,
            message: 'Error updating service',
            error: error.message
        });
    }
};

// Delete Service
exports.deleteService = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }

        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Delete images from cloud storage
        if (service.service_images && service.service_images.length > 0) {
            const publicIds = service.service_images.map(img => img.public_id);
            await deleteMultipleFilesCloud(publicIds);
        }

        // Delete service
        await Service.findByIdAndDelete(id);

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'service*');

        res.status(200).json({
            success: true,
            message: 'Service deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting service',
            error: error.message
        });
    }
};

// Get Services by Doctor
exports.getServicesByDoctor = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const { doctorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid doctor ID'
            });
        }

        const cacheKey = `services:doctor:${doctorId}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const services = await Service.find({ service_doctor: doctorId })
            .populate('service_doctor')
            .populate('service_available_at_clinics')
            .sort({ position: 1, createdAt: -1 });

        const responseData = {
            success: true,
            message: 'Services retrieved successfully',
            data: services
        };

        // Cache the response
        await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 300);

        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving services by doctor',
            error: error.message
        });
    }
};

// Get Services by Clinic
exports.getServicesByClinic = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const { clinicId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(clinicId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid clinic ID'
            });
        }

        const cacheKey = `services:clinic:${clinicId}`;

        // Check Redis cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const services = await Service.find({
            service_available_at_clinics: { $in: [clinicId] }
        })
            .populate('service_doctor')
            .populate('service_available_at_clinics')
            .sort({ position: 1, createdAt: -1 });

        const responseData = {
            success: true,
            message: 'Services retrieved successfully',
            data: services
        };

        // Cache the response
        await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 300);

        res.status(200).json(responseData);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving services by clinic',
            error: error.message
        });
    }
};

// Update Service Status
exports.updateServiceStatus = async (req, res) => {
    const redisClient = getRedisClient(req, res);

    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service ID'
            });
        }

        const validStatuses = ['Booking Open', 'Booking Close', 'Draft', 'Published'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { service_status: status },
            { new: true, runValidators: true }
        ).populate('service_doctor', 'doctor_name doctor_email')
            .populate('service_available_at_clinics', 'clinic_name clinic_address');

        if (!updatedService) {
            return res.status(404).json({
                success: false,
                message: 'Service not found'
            });
        }

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'service*');

        res.status(200).json({
            success: true,
            message: 'Service status updated successfully',
            data: updatedService
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating service status',
            error: error.message
        });
    }
};

