const mongoose = require("mongoose");
const Popup = require("../../models/Popups/Popups");
const { deleteFile } = require("../../middleware/multer");
const { uploadSingleFile } = require("../../utils/upload");

/**
 * Create Popup
 */
exports.createPopup = async (req, res) => {
  let uploadedResult = null;

  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Popup image is required",
      });
    }

    uploadedResult = await uploadSingleFile(file);

    const popup = await Popup.create({
      title: req.body.title,
      description: req.body.description,
      doctorName: req.body.doctorName,
      location: req.body.location,
      availableDate: req.body.availableDate,
      availableTime: req.body.availableTime,
      startAt: req.body.startAt,
      endAt: req.body.endAt,
      priority: req.body.priority || 1,
      isActive:
        req.body.isActive !== undefined
          ? req.body.isActive
          : true,

      button: {
        text: req.body.buttonText || "",
        link: req.body.buttonLink || "",
        openInNewTab:
          req.body.openInNewTab === "true" ||
          req.body.openInNewTab === true,
      },

      image: uploadedResult.url,
      public_id: uploadedResult.public_id,
    });

    if (file?.path) {
      deleteFile(file.path);
    }

    return res.status(201).json({
      success: true,
      message: "Popup created successfully",
      data: popup,
    });
  } catch (error) {
    console.error("Create Popup Error:", error);

    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create popup",
      error: error.message,
    });
  }
};

/**
 * Get All Popups
 */
exports.getAllPopups = async (req, res) => {
  try {
    const popups = await Popup.find().sort({
      priority: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: popups.length,
      data: popups,
    });
  } catch (error) {
    console.error("Get Popups Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch popups",
      error: error.message,
    });
  }
};

/**
 * Get Single Popup
 */
exports.getPopupById = async (req, res) => {
  try {
    const { popupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(popupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid popup id",
      });
    }

    const popup = await Popup.findById(popupId);

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: popup,
    });
  } catch (error) {
    console.error("Get Popup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch popup",
      error: error.message,
    });
  }
};

/**
 * Update Popup
 */
exports.updatePopup = async (req, res) => {
  try {
    const { popupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(popupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid popup id",
      });
    }

    const existing = await Popup.findById(popupId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Popup not found",
      });
    }

    let uploadedResult = null;

    if (req.file) {
      uploadedResult = await uploadSingleFile(req.file);

      if (req.file?.path) {
        deleteFile(req.file.path);
      }
    }

    const popup = await Popup.findByIdAndUpdate(
      popupId,
      {
        title: req.body.title ?? existing.title,
        description:
          req.body.description ?? existing.description,

        doctorName:
          req.body.doctorName ?? existing.doctorName,

        location:
          req.body.location ?? existing.location,

        availableDate:
          req.body.availableDate ??
          existing.availableDate,

        availableTime:
          req.body.availableTime ??
          existing.availableTime,

        startAt: req.body.startAt ?? existing.startAt,

        endAt: req.body.endAt ?? existing.endAt,

        priority:
          req.body.priority ?? existing.priority,

        isActive:
          req.body.isActive ?? existing.isActive,

        button: {
          text:
            req.body.buttonText ??
            existing.button?.text,

          link:
            req.body.buttonLink ??
            existing.button?.link,

          openInNewTab:
            req.body.openInNewTab !== undefined
              ? req.body.openInNewTab === "true" ||
                req.body.openInNewTab === true
              : existing.button?.openInNewTab,
        },

        image:
          uploadedResult?.url || existing.image,

        public_id:
          uploadedResult?.public_id ||
          existing.public_id,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Popup updated successfully",
      data: popup,
    });
  } catch (error) {
    console.error("Update Popup Error:", error);

    if (req.file?.path) {
      deleteFile(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update popup",
      error: error.message,
    });
  }
};

/**
 * Delete Popup
 */
exports.deletePopup = async (req, res) => {
  try {
    const { popupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(popupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid popup id",
      });
    }

    const popup = await Popup.findByIdAndDelete(
      popupId
    );

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found",
      });
    }

    // Optional:
    // await cloudinary.uploader.destroy(popup.public_id);

    return res.status(200).json({
      success: true,
      message: "Popup deleted successfully",
    });
  } catch (error) {
    console.error("Delete Popup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete popup",
      error: error.message,
    });
  }
};

/**
 * Get Active Popup
 */
exports.getActivePopup = async (req, res) => {
  try {
    const now = new Date();

    const popup = await Popup.findOne({
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now },
    }).sort({
      priority: 1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: popup || null,
    });
  } catch (error) {
    console.error("Get Active Popup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch active popup",
      error: error.message,
    });
  }
};