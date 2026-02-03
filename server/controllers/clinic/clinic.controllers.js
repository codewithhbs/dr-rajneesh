
const Clinic = require("../../models/clinic/clinic.model");
const {  deleteMultipleFiles } = require("../../middleware/multer");
const { uploadMultipleFiles, deleteMultipleFilesCloud } = require("../../utils/upload");
const mongoose = require('mongoose');
const { validateClinicData, validateBusinessRules, validateClinicUpdateData } = require("../../utils/clinic_utils");
const { getRedisClient, cleanRedisDataFlush } = require("../../utils/redis.utils");

exports.createClinic = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);

        const validationError = validateClinicData(req.body);
        if (validationError) {
            if (req.files && req.files.length > 0) {
                await deleteMultipleFiles(req.files);
            }
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationError
            });
        }

        const existingClinic = await Clinic.findOne({
            clinic_name: req.body.clinic_name.trim()
        });
        if (existingClinic) {
            if (req.files && req.files.length > 0) {
                await deleteMultipleFiles(req.files);
            }
            return res.status(409).json({
                success: false,
                message: "Clinic with this name already exists"
            });
        }

        const businessValidationError = validateBusinessRules(req.body);
        if (businessValidationError) {
            if (req.files && req.files.length > 0) {
                await deleteMultipleFiles(req.files);
            }
            return res.status(400).json({
                success: false,
                message: "Business validation failed",
                errors: businessValidationError
            });
        }

        let uploadedImages = [];
        let uploadedFiles = [];

        if (req.files && req.files.length > 0) {
            if (req.files.length > 10) {
                await deleteMultipleFiles(req.files);
                return res.status(400).json({
                    success: false,
                    message: "Maximum 10 images allowed"
                });
            }

            uploadedFiles = req.files;
            try {
                uploadedImages = await uploadMultipleFiles(req.files);
            } catch (uploadError) {
                await deleteMultipleFiles(uploadedFiles);
                return res.status(400).json({
                    success: false,
                    message: "Image upload failed",
                    error: uploadError.message
                });
            }
        }

        const clinicData = {
            ...req.body,
            clinic_images: uploadedImages,
            clinic_name: req.body.clinic_name.trim(),
            clinic_contact_details: {
                ...req.body.clinic_contact_details,
                email: req.body.clinic_contact_details.email.toLowerCase().trim()
            }
        };

        const newClinic = new Clinic(clinicData);
        const savedClinic = await newClinic.save();

        await deleteMultipleFiles(uploadedFiles);

        await cleanRedisDataFlush(redisClient);

        res.status(201).json({
            success: true,
            message: "Clinic created successfully",
            data: savedClinic
        });

    } catch (error) {
        if (req.files && req.files.length > 0) {
            await deleteMultipleFiles(req.files);
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Clinic name already exists"
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create clinic",
            error: error.message
        });
    }
};


// exports.updateClinic = async (req, res) => {
 
//     try {
//         const redisClient = getRedisClient(req, res);
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             if (req.files && req.files.length > 0) {
//                 await deleteMultipleFiles(req.files);
//             }
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid clinic ID"
//             });
//         }

//         const validationError = validateClinicUpdateData(req.body);
//         if (validationError) {
//             if (req.files && req.files.length > 0) {
//                 await deleteMultipleFiles(req.files);
//             }
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation failed",
//                 errors: validationError
//             });
//         }

//         const existingClinic = await Clinic.findById(id);
//         if (!existingClinic) {
//             if (req.files && req.files.length > 0) {
//                 await deleteMultipleFiles(req.files);
//             }
//             return res.status(404).json({
//                 success: false,
//                 message: "Clinic not found"
//             });
//         }

//         if (req.body.clinic_name && req.body.clinic_name.trim() !== existingClinic.clinic_name) {
//             const duplicateClinic = await Clinic.findOne({
//                 clinic_name: req.body.clinic_name.trim(),
//                 _id: { $ne: id }
//             });
//             if (duplicateClinic) {
//                 if (req.files && req.files.length > 0) {
//                     await deleteMultipleFiles(req.files);
//                 }
//                 return res.status(409).json({
//                     success: false,
//                     message: "Clinic with this name already exists"
//                 });
//             }
//         }

//         const businessValidationError = validateBusinessRules(req.body, existingClinic);
//         if (businessValidationError) {
//             if (req.files && req.files.length > 0) {
//                 await deleteMultipleFiles(req.files);
//             }
//             return res.status(400).json({
//                 success: false,
//                 message: "Business validation failed",
//                 errors: businessValidationError
//             });
//         }

//         let uploadedImages = [];
//         let uploadedFiles = [];
//         let oldImages = [];

//         if (req.files && req.files.length > 0) {
//             if (req.files.length > 10) {
//                 await deleteMultipleFiles(req.files);
//                 return res.status(400).json({
//                     success: false,
//                     message: "Maximum 10 images allowed"
//                 });
//             }

//             uploadedFiles = req.files;
//             try {
//                 uploadedImages = await uploadMultipleFiles(req.files);
//                 oldImages = existingClinic.clinic_images || [];
//             } catch (uploadError) {
//                 await deleteMultipleFiles(uploadedFiles);
//                 return res.status(400).json({
//                     success: false,
//                     message: "Image upload failed",
//                     error: uploadError.message
//                 });
//             }
//         }

//         const updateData = { ...req.body };
//         if (req.body.clinic_name) {
//             updateData.clinic_name = req.body.clinic_name.trim();
//         }
//         if (req.body.clinic_contact_details && req.body.clinic_contact_details.email) {
//             updateData.clinic_contact_details = {
//                 ...updateData.clinic_contact_details,
//                 email: req.body.clinic_contact_details.email.toLowerCase().trim()
//             };
//         }
//         if (uploadedImages.length > 0) {
//             updateData.clinic_images = uploadedImages;
//         }

//         const updatedClinic = await Clinic.findByIdAndUpdate(id, updateData, {
//             new: true,
//             runValidators: true
//         });

//         if (uploadedFiles.length > 0) {
//             await deleteMultipleFiles(uploadedFiles);
//         }

//         if (oldImages.length > 0 && uploadedImages.length > 0) {
//             const publicIds = oldImages.map(img => img.public_id).filter(Boolean);
//             if (publicIds.length > 0) {
//                 await deleteMultipleFilesCloud(publicIds);
//             }
//         }

//         await cleanRedisDataFlush(redisClient);

//         res.status(200).json({
//             success: true,
//             message: "Clinic updated successfully",
//             data: updatedClinic
//         });

//     } catch (error) {
//         if (req.files && req.files.length > 0) {
//             await deleteMultipleFiles(req.files);
//         }

//         if (error.code === 11000) {
//             return res.status(409).json({
//                 success: false,
//                 message: "Clinic name already exists"
//             });
//         }

//         if (error.name === 'ValidationError') {
//             return res.status(400).json({
//                 success: false,
//                 message: "Validation error",
//                 errors: Object.values(error.errors).map(err => err.message)
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: "Failed to update clinic",
//             error: error.message
//         });
//     }
// };




exports.updateClinic = async (req, res) => {
  try {
    const redisClient = getRedisClient(req, res);
    const { id } = req.params;

    // Validate clinic ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.files?.length) await deleteMultipleFiles(req.files);
      return res.status(400).json({ success: false, message: "Invalid clinic ID" });
    }

    // Validate request body
    const validationError = validateClinicUpdateData(req.body);
    if (validationError) {
      if (req.files?.length) await deleteMultipleFiles(req.files);
      return res.status(400).json({ success: false, message: "Validation failed", errors: validationError });
    }

    // Find existing clinic
    const existingClinic = await Clinic.findById(id);
    if (!existingClinic) {
      if (req.files?.length) await deleteMultipleFiles(req.files);
      return res.status(404).json({ success: false, message: "Clinic not found" });
    }

    // Check for duplicate clinic name
    if (req.body.clinic_name?.trim() && req.body.clinic_name.trim() !== existingClinic.clinic_name) {
      const duplicateClinic = await Clinic.findOne({
        clinic_name: req.body.clinic_name.trim(),
        _id: { $ne: id }
      });
      if (duplicateClinic) {
        if (req.files?.length) await deleteMultipleFiles(req.files);
        return res.status(409).json({ success: false, message: "Clinic with this name already exists" });
      }
    }

    // Business rules validation
    const businessValidationError = validateBusinessRules(req.body, existingClinic);
    if (businessValidationError) {
      if (req.files?.length) await deleteMultipleFiles(req.files);
      return res.status(400).json({ success: false, message: "Business validation failed", errors: businessValidationError });
    }

    // Handle images
    let uploadedImages = [];
    let uploadedFiles = [];
    let oldImages = [];

    if (req.files?.length) {
      if (req.files.length > 10) {
        await deleteMultipleFiles(req.files);
        return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
      }

      uploadedFiles = req.files;
      try {
        uploadedImages = await uploadMultipleFiles(req.files);
        oldImages = existingClinic.clinic_images || [];
      } catch (uploadError) {
        await deleteMultipleFiles(uploadedFiles);
        return res.status(400).json({ success: false, message: "Image upload failed", error: uploadError.message });
      }
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Normalize clinic name
    if (req.body.clinic_name) updateData.clinic_name = req.body.clinic_name.trim();

    // Fix clinic_status typo
    if (req.body.clinic_stauts) updateData.clinic_status = req.body.clinic_stauts;

    // Normalize email
    if (req.body.clinic_contact_details?.email) {
      updateData.clinic_contact_details = {
        ...updateData.clinic_contact_details,
        email: req.body.clinic_contact_details.email.toLowerCase().trim()
      };
    }

    // Handle BookingAvailabeAt (start_date and end_date)
    const startDate = req.body.start_date ? new Date(req.body.start_date) : existingClinic.BookingAvailabeAt?.start_date;
    const endDate = req.body.end_date ? new Date(req.body.end_date) : existingClinic.BookingAvailabeAt?.end_date;

    // Optional: Validate start_date <= end_date
    if (startDate && endDate && startDate > endDate) {
      return res.status(400).json({ success: false, message: "start_date cannot be after end_date" });
    }

    updateData.BookingAvailabeAt = { start_date: startDate, end_date: endDate };
    delete updateData.start_date;
    delete updateData.end_date;

    // Add uploaded images
    if (uploadedImages.length > 0) updateData.clinic_images = uploadedImages;

    // Update clinic
    const updatedClinic = await Clinic.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    // Delete temporary uploaded files
    if (uploadedFiles.length > 0) await deleteMultipleFiles(uploadedFiles);

    // Delete old images from cloud if replaced
    if (oldImages.length && uploadedImages.length) {
      const publicIds = oldImages.map(img => img.public_id).filter(Boolean);
      if (publicIds.length) await deleteMultipleFilesCloud(publicIds);
    }

    // Clear Redis cache
    await cleanRedisDataFlush(redisClient);

    return res.status(200).json({
      success: true,
      message: "Clinic updated successfully",
      data: updatedClinic
    });

  } catch (error) {
    if (req.files?.length) await deleteMultipleFiles(req.files);

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Clinic name already exists" });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: "Validation error", errors: Object.values(error.errors).map(err => err.message) });
    }

    return res.status(500).json({ success: false, message: "Failed to update clinic", error: error.message });
  }
};



exports.DeleteClinic = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid clinic ID"
            });
        }

        const clinic = await Clinic.findById(id);
        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }

        if (clinic.clinic_stauts === 'Booking Open') {
            return res.status(400).json({
                success: false,
                message: "Cannot delete clinic with active bookings. Please close bookings first."
            });
        }

        const imagesToDelete = clinic.clinic_images || [];

        await Clinic.findByIdAndDelete(id);

        if (imagesToDelete.length > 0) {
            const publicIds = imagesToDelete.map(img => img.public_id).filter(Boolean);
            if (publicIds.length > 0) {
                await deleteMultipleFilesCloud(publicIds);
            }
        }

        await cleanRedisDataFlush(redisClient);

        res.status(200).json({
            success: true,
            message: "Clinic deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete clinic",
            error: error.message
        });
    }
};

exports.GetAllClinic = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const { page = 1, limit = 10, status, search, sort_by = 'createdAt', sort_order = 'desc' } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters. Page must be >= 1 and limit between 1-100"
            });
        }

        if (status && !['Booking Open', 'Booking Close', 'Draft', 'Published'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const cacheKey = `clinics:${pageNum}:${limitNum}:${status || 'all'}:${search || 'all'}:${sort_by}:${sort_order}`;

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Clinics retrieved successfully",
                data: JSON.parse(cachedData)
            });
        }

        const query = {};
        if (status) {
            query.clinic_stauts = status;
        }
        if (search && search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            query.$or = [
                { clinic_name: searchRegex },
                { 'clinic_contact_details.email': searchRegex },
                { 'clinic_contact_details.clinic_address': searchRegex }
            ];
        }

        const skip = (pageNum - 1) * limitNum;

        const sortOrder = sort_order === 'asc' ? 1 : -1;
        const sortObj = {};
        sortObj[sort_by] = sortOrder;

        const clinics = await Clinic.find(query)
            .skip(skip)
            .limit(limitNum)
            .sort(sortObj)
            .select('-BookingAvailabePastHistory');

        const totalClinics = await Clinic.countDocuments(query);

        const result = {
            clinics,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalClinics / limitNum),
                totalClinics,
                hasNextPage: skip + clinics.length < totalClinics,
                hasPrevPage: pageNum > 1,
                limit: limitNum
            }
        };

        await redisClient.set(cacheKey,  JSON.stringify(result),'EX',300);

        res.status(200).json({
            success: true,
            message: "Clinics retrieved successfully",
            data: result
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve clinics",
            error: error.message
        });
    }
};



exports.GetClinicCount = async (req, res) => {
    try {
        const totalClinics = await Clinic.countDocuments();

        return res.status(200).json({
            success: true,
            count: totalClinics
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get clinic count",
            error: error.message
        });
    }
};


exports.GetSingleClinic = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid clinic ID"
            });
        }

        const cacheKey = `clinic:${id}`;

        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Clinic retrieved successfully",
                data: JSON.parse(cachedData)
            });
        }

        const clinic = await Clinic.findById(id);
        if (!clinic) {
            return res.status(404).json({
                success: false,
                message: "Clinic not found"
            });
        }

        await redisClient.set(cacheKey, JSON.stringify(clinic),'EX',300);

        res.status(200).json({
            success: true,
            message: "Clinic retrieved successfully",
            data: clinic
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve clinic",
            error: error.message
        });
    }
};



