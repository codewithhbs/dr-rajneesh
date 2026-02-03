const Clinic = require("../../models/clinic/clinic.model");
const Doctor = require("../../models/doctor/doctor.model");
const {  deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");
const mongoose = require('mongoose');
const { getRedisClient, cleanRedisDataFlush } = require("../../utils/redis.utils");

// Create Doctor
exports.createDoctor = async (req, res) => {
    try {
        const {
            doctor_name,
            specialization,
            languagesSpoken,
            doctor_status,
            doctor_ratings,
            any_special_note,
            clinic_ids
        } = req.body;

        // Validate required fields
        if (!doctor_name) {
            await deleteMultipleFiles(req.files);

            return res.status(400).json({
                success: false,
                message: "Doctor name is required"
            });
        }

        // Check if doctor already exists
        const existingDoctor = await Doctor.findOne({ doctor_name });
        if (existingDoctor) {
            await deleteMultipleFiles(req.files);

            return res.status(400).json({
                success: false,
                message: "Doctor with this name already exists"
            });
        }

        // Validate clinic IDs if provided
        if (clinic_ids && clinic_ids.length > 0) {
            const validClinicIds = clinic_ids.filter(id => mongoose.Types.ObjectId.isValid(id));
            if (validClinicIds.length !== clinic_ids.length) {
                await deleteMultipleFiles(req.files);

                return res.status(400).json({
                    success: false,
                    message: "Invalid clinic IDs provided"
                });
            }

            // Check if all clinics exist
            const existingClinics = await Clinic.find({ _id: { $in: validClinicIds } });
            if (existingClinics.length !== validClinicIds.length) {
                await deleteMultipleFiles(req.files);

                return res.status(400).json({
                    success: false,
                    message: "One or more clinics not found"
                });
            }
        }

        // Handle file uploads
        let doctor_images = [];
        if (req.files && req.files.length > 0) {
            try {
                doctor_images = await uploadMultipleFiles(req.files);
            } catch (uploadError) {
                await deleteMultipleFiles(req.files);

                return res.status(500).json({
                    success: false,
                    message: "Failed to upload images",
                    error: uploadError.message
                });
            }
        }

        // Create doctor object
        const doctorData = {
            doctor_name,
            doctor_images,
            specialization: specialization ? (Array.isArray(specialization) ? specialization : [specialization]) : [],
            languagesSpoken: languagesSpoken ? (Array.isArray(languagesSpoken) ? languagesSpoken : [languagesSpoken]) : [],
            doctor_status: doctor_status || 'Draft',
            doctor_ratings: doctor_ratings || 5,
            any_special_note,
            clinic_ids: clinic_ids || []
        };

        const newDoctor = new Doctor(doctorData);
        await newDoctor.save();

        // Clear Redis cache
        const redisClient = getRedisClient(req,res);
        if (redisClient) {
            await cleanRedisDataFlush(redisClient,'doctors*');
        }

        res.status(201).json({
            success: true,
            message: "Doctor created successfully",
            data: newDoctor
        });

    } catch (error) {
        await deleteMultipleFiles(req.files);

        console.error("Error creating doctor:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Update Doctor
exports.updateDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            doctor_name,
            specialization,
            languagesSpoken,
            doctor_status,
            doctor_ratings,
            any_special_note,
            clinic_ids
        } = req.body;

        // Validate doctor ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        // Check if doctor exists
        const existingDoctor = await Doctor.findById(id);
        if (!existingDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Check if doctor name is unique (excluding current doctor)
        if (doctor_name && doctor_name !== existingDoctor.doctor_name) {
            const duplicateDoctor = await Doctor.findOne({
                doctor_name,
                _id: { $ne: id }
            });
            if (duplicateDoctor) {
                return res.status(400).json({
                    success: false,
                    message: "Doctor with this name already exists"
                });
            }
        }

        // Validate clinic IDs if provided
        if (clinic_ids && clinic_ids.length > 0) {
            const validClinicIds = clinic_ids.filter(clinicId => mongoose.Types.ObjectId.isValid(clinicId));
            if (validClinicIds.length !== clinic_ids.length) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid clinic IDs provided"
                });
            }

            // Check if all clinics exist
            const existingClinics = await Clinic.find({ _id: { $in: validClinicIds } });
            if (existingClinics.length !== validClinicIds.length) {
                return res.status(400).json({
                    success: false,
                    message: "One or more clinics not found"
                });
            }
        }

        // Handle file uploads
        let newImages = [];
        if (req.files && req.files.length > 0) {
            try {
                newImages = await uploadMultipleFiles(req.files);

                // Delete old images from cloud if new images are uploaded
                if (existingDoctor.doctor_images && existingDoctor.doctor_images.length > 0) {
                    const publicIds = existingDoctor.doctor_images.map(img => img.public_id).filter(Boolean);
                    if (publicIds.length > 0) {
                        await deleteMultipleFilesCloud(publicIds);
                    }
                }
            } catch (uploadError) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload images",
                    error: uploadError.message
                });
            }
        }

        // Prepare update data
        const updateData = {};
        if (doctor_name) updateData.doctor_name = doctor_name;
        if (newImages.length > 0) updateData.doctor_images = newImages;
        if (specialization !== undefined) {
            updateData.specialization = Array.isArray(specialization) ? specialization : [specialization];
        }
        if (languagesSpoken !== undefined) {
            updateData.languagesSpoken = Array.isArray(languagesSpoken) ? languagesSpoken : [languagesSpoken];
        }
        if (doctor_status) updateData.doctor_status = doctor_status;
        if (doctor_ratings !== undefined) updateData.doctor_ratings = doctor_ratings;
        if (any_special_note !== undefined) updateData.any_special_note = any_special_note;
        if (clinic_ids !== undefined) updateData.clinic_ids = clinic_ids;

        const updatedDoctor = await Doctor.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('clinic_ids', 'clinic_name clinic_address');

        // Clear Redis cache
       const redisClient = getRedisClient(req,res);
        if (redisClient) {
             await cleanRedisDataFlush(redisClient,'doctors*');
        }

        res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            data: updatedDoctor
        });

    } catch (error) {
        console.error("Error updating doctor:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Delete Doctor
exports.DeleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate doctor ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        // Check if doctor exists
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Delete associated images from cloud
        if (doctor.doctor_images && doctor.doctor_images.length > 0) {
            try {
                const publicIds = doctor.doctor_images.map(img => img.public_id).filter(Boolean);
                if (publicIds.length > 0) {
                    await deleteMultipleFilesCloud(publicIds);
                }
            } catch (deleteError) {
                console.error("Error deleting images:", deleteError);
                // Continue with doctor deletion even if image deletion fails
            }
        }

        // Delete doctor
        await Doctor.findByIdAndDelete(id);

        // Clear Redis cache
      const redisClient = getRedisClient(req,res);
        if (redisClient) {
             await cleanRedisDataFlush(redisClient,'doctors*');
        }

        res.status(200).json({
            success: true,
            message: "Doctor deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting doctor:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get All Doctors
exports.getAllDoctor = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            specialization,
            doctor_status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        const filter = {};

        if (search) {
            filter.doctor_name = { $regex: search, $options: 'i' };
        }

        if (specialization) {
            filter.specialization = { $in: [specialization] };
        }

        if (doctor_status) {
            filter.doctor_status = doctor_status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Check Redis cache first
           const redisClient = getRedisClient(req,res);
        const cacheKey = `doctors:${JSON.stringify(filter)}:${page}:${limit}:${sortBy}:${sortOrder}`;

        if (redisClient) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json({
                        success: true,
                        message: "Doctors retrieved successfully (from cache)",
                        ...JSON.parse(cachedData)
                    });
                }
            } catch (cacheError) {
                console.error("Redis cache error:", cacheError);
            }
        }

        // Fetch doctors with population
        const doctors = await Doctor.find(filter)
            .populate('clinic_ids', 'clinic_name clinic_address clinic_contact')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const totalCount = await Doctor.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / parseInt(limit));

        const responseData = {
            data: doctors,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCount,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        };

        // Cache the result
        if (redisClient) {
            try {
                await redisClient.set(cacheKey,  JSON.stringify(responseData),'EX',300,); 
            } catch (cacheError) {
                console.error("Redis cache set error:", cacheError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Doctors retrieved successfully",
            ...responseData
        });

    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};




exports.getDoctorCount = async (req, res) => {
    try {
        const totalDoctors = await Doctor.countDocuments();

        return res.status(200).json({
            success: true,
            count: totalDoctors
        });
    } catch (error) {
        console.error("Error getting doctor count:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get doctor count",
            error: error.message
        });
    }
};



// Get Single Doctor
exports.getSingleDoctor = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate doctor ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        // Check Redis cache first
          const redisClient = getRedisClient(req,res);
        const cacheKey = `doctor:${id}`;

        if (redisClient) {
            try {
                const cachedData = await redisClient.get(cacheKey);
                if (cachedData) {
                    return res.status(200).json({
                        success: true,
                        message: "Doctor retrieved successfully (from cache)",
                        data: JSON.parse(cachedData)
                    });
                }
            } catch (cacheError) {
                console.error("Redis cache error:", cacheError);
            }
        }

        // Fetch doctor with populated clinic data
        const doctor = await Doctor.findById(id)
            .populate('clinic_ids', 'clinic_name clinic_address clinic_contact clinic_timing')
            .lean();

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Cache the result
        if (redisClient) {
            try {
                await redisClient.set(cacheKey, JSON.stringify(doctor),'EX',600); // 10 minutes cache
            } catch (cacheError) {
                console.error("Redis cache set error:", cacheError);
            }
        }

        res.status(200).json({
            success: true,
            message: "Doctor retrieved successfully",
            data: doctor
        });

    } catch (error) {
        console.error("Error fetching doctor:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};