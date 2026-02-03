const Settings = require("../../models/settings/settings.model");
const mongoose = require('mongoose');
const { deleteFile } = require("../../middleware/multer");

exports.updateConfigSettings = async (req, res) => {
  try {
    const data = req.body;
    const file = req.file; // Multer file

    // Fetch existing settings (singleton)
    let settings = await Settings.findOne({});

    if (!settings) {
      // Create new if doesn't exist
      settings = new Settings(data);
    } else {
      // Update fields
      Object.assign(settings, data);
    }

    // Handle logo upload
    if (file) {
      // Delete previous local logo if exists
      if (settings.branding?.logo?.path) {
        deleteFile(settings.branding.logo.path);
      }

      // Save new file info in DB
      settings.branding = settings.branding || {};
      settings.branding.logo = {
        url: `/uploads/${file.filename}`, // This will be your frontend-accessible URL
        path: file.path, // store actual file path for deletion
        originalName: file.originalname,
      };
    }

    // Save updated settings
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);

    // Cleanup uploaded file if error occurs
    if (req.file) deleteFile(req.file.path);

    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};

// @desc Get current settings
// @route GET /api/v1/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Settings.getCurrentSettings();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "No settings found",
      });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};
