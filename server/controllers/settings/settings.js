const Settings = require("../../models/settings/settings.model");
const { cleanRedisDataFlush, getRedisClient } = require("../../utils/redis.utils");

/**
 * Create new settings
 */
exports.createSettings = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);

        // Check if active settings already exist (singleton pattern)
        const existingSettings = await Settings.findOne({ is_active: true });
        if (existingSettings) {
            return res.status(400).json({
                success: false,
                message: "Active settings already exist. Please update existing settings or deactivate them first.",
                data: null
            });
        }

        // Create new settings
        const newSettings = new Settings(req.body);
        const savedSettings = await newSettings.save();

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'settings*');

        return res.status(201).json({
            success: true,
            message: "Settings created successfully",
            data: savedSettings
        });

    } catch (error) {
        console.error("Error creating settings:", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
                data: null
            });
        }

        // Handle duplicate key error (app_id uniqueness)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "App ID already exists. Please use a unique App ID.",
                data: null
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error while creating settings",
            data: null
        });
    }
};

/**
 * Update existing settings
 */
exports.updateSettings = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const { id } = req.params;

        // Find and update settings
        const updatedSettings = await Settings.findByIdAndUpdate(
            id,
            { ...req.body, updatedAt: new Date() },
            {
                new: true,
                runValidators: true,
                context: 'query'
            }
        );

        if (!updatedSettings) {
            return res.status(404).json({
                success: false,
                message: "Settings not found",
                data: null
            });
        }

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'settings*');

        return res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            data: updatedSettings
        });

    } catch (error) {
        console.error("Error updating settings:", error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message,
                value: err.value
            }));

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
                data: null
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "App ID already exists. Please use a unique App ID.",
                data: null
            });
        }

        // Handle cast error (invalid ObjectId)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: "Invalid settings ID format",
                data: null
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error while updating settings",
            data: null
        });
    }
};

/**
 * Get the current active settings (singleton)
 */
exports.getOnlyOneSettings = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const cacheKey = 'settings:active';

        // Try to get from Redis cache first
        let cachedSettings;
        try {
            cachedSettings = await redisClient.get(cacheKey);
            if (cachedSettings) {
                return res.status(200).json({
                    success: true,
                    message: "Settings retrieved successfully from cache",
                    data: JSON.parse(cachedSettings),
                    cached: true
                });
            }
        } catch (redisError) {
            console.warn("Redis error (continuing without cache):", redisError);
        }

        // Get from database using the static method
        const settings = await Settings.getCurrentSettings();

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "No active settings found. Please create settings first.",
                data: null
            });
        }

        // Cache the result in Redis (expire in 1 hour)
        try {
            await redisClient.set(cacheKey, JSON.stringify(settings), 'EX', 3600);
        } catch (redisError) {
            console.warn("Failed to cache settings:", redisError);
        }

        return res.status(200).json({
            success: true,
            message: "Settings retrieved successfully",
            data: settings,
            cached: false
        });

    } catch (error) {
        console.error("Error retrieving settings:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while retrieving settings",
            data: null
        });
    }
};


exports.getSettingsByAppId = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const { appId } = req.params;
        const cacheKey = `settings:app_id:${appId}`;

        // Try Redis cache first
        let cachedSettings;
        try {
            cachedSettings = await redisClient.get(cacheKey);
            if (cachedSettings) {
                return res.status(200).json({
                    success: true,
                    message: "Settings retrieved successfully from cache",
                    data: JSON.parse(cachedSettings),
                    cached: true
                });
            }
        } catch (redisError) {
            console.warn("Redis error (continuing without cache):", redisError);
        }

        const settings = await Settings.findOne({
            app_id: appId.toUpperCase(),
            is_active: true
        });

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: `No active settings found for App ID: ${appId}`,
                data: null
            });
        }

        // Cache the result
        try {
            await redisClient.set(cacheKey, JSON.stringify(settings), 'EX', 3600);

        } catch (redisError) {
            console.warn("Failed to cache settings:", redisError);
        }

        return res.status(200).json({
            success: true,
            message: "Settings retrieved successfully",
            data: settings,
            cached: false
        });

    } catch (error) {
        console.error("Error retrieving settings by App ID:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while retrieving settings",
            data: null
        });
    }
};


exports.toggleMaintenanceMode = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const { id } = req.params;

        const settings = await Settings.findById(id);
        if (!settings) {
            return res.status(404).json({
                success: false,
                message: "Settings not found",
                data: null
            });
        }

        settings.system_settings.maintenance_mode = !settings.system_settings.maintenance_mode;
        const updatedSettings = await settings.save();

        // Clear Redis cache
        await cleanRedisDataFlush(redisClient, 'settings*');

        return res.status(200).json({
            success: true,
            message: `Maintenance mode ${updatedSettings.system_settings.maintenance_mode ? 'enabled' : 'disabled'} successfully`,
            data: {
                maintenance_mode: updatedSettings.system_settings.maintenance_mode,
                settings: updatedSettings
            }
        });

    } catch (error) {
        console.error("Error toggling maintenance mode:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error while toggling maintenance mode",
            data: null
        });
    }
};