const Notification = require("../../models/services/Notification.model");
const { flushAllData, getRedisClient } = require("../../utils/redis.utils");


exports.createNotification = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);

        if (!redisClient) {
            return res.status(500).json({
                success: false,
                message: "Redis client is not available",
                data: null
            });
        }

        const { messages, position, expiredThis, status } = req.body;
        if (!messages || !position) {
            return res.status(400).json({
                success: false,
                message: "Messages and position are required",
                data: null
            });
        }
        // check position
        const existingNotification = await Notification.findOne({ position });
        if (existingNotification) {
            return res.status(400).json({
                success: false,
                message: "Notification with this position already exists",
                data: null
            });
        }
        // check expired this is not in past 
        if (expiredThis && new Date(expiredThis) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Expiration date cannot be in the past",
                data: null
            });
        }

        if (messages.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Messages cannot exceed 200 characters",
                data: null
            });
        }
        // check status
        if (status && !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be either 'active' or 'inactive'",
                data: null
            });
        }
        // Create new notification
        const newNotification = new Notification({
            messages,
            position,
            status: status || 'active',
            expiredThis: expiredThis || Date.now()
        });
        const savedNotification = await newNotification.save();
        // Clear Redis cache
        await flushAllData(redisClient);
        return res.status(201).json({
            success: true,
            message: "Notification created successfully",
            data: savedNotification
        });


    } catch (error) {
        console.error("Error creating notification:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error while creating notification",
            data: null
        });

    }
}

exports.getAllValidNotifications = async (req, res) => {
    const redisKey = 'valid_notifications';
    try {
        const redisClient = getRedisClient(req, res);
        if (!redisClient) {
            return res.status(500).json({
                success: false,
                message: "Redis client is not available",
                data: null
            });
        }

        // Check if data exists in Redis cache
        const cachedData = await redisClient.get(redisKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                message: "Valid notifications fetched from cache",
                data: JSON.parse(cachedData),
                cached: true
            });
        }

        // Fetch from MongoDB if cache not available
        const notifications = await Notification.find({
     
            expiredThis: { $gt: new Date() }
        }).sort({ position: 1 });

        if (notifications.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No valid notifications found",
                data: null
            });
        }

        // Cache the result for 1 day
        await redisClient.set(redisKey, JSON.stringify(notifications), 'EX', 86400); // 1 day expiration

        return res.status(200).json({
            success: true,
            message: "Valid notifications fetched from database",
            data: notifications,
            cached: false
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while fetching notifications",
            data: null
        });
    }
};


exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Notification ID is required",
                data: null
            });
        }

        const redisClient = getRedisClient(req, res);
        if (!redisClient) {
            return res.status(500).json({
                success: false,
                message: "Redis client is not available",
                data: null
            });
        }

        // Find and delete the notification
        const deletedNotification = await Notification.findByIdAndDelete(id);
        if (!deletedNotification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
                data: null
            });
        }

        // Clear Redis cache
        await flushAllData(redisClient);

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
            data: deletedNotification
        });

    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while deleting notification",
            data: null
        });
    }
}

exports.updateNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { messages, position, expiredThis, status } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Notification ID is required",
                data: null
            });
        }

        const redisClient = getRedisClient(req, res);
        if (!redisClient) {
            return res.status(500).json({
                success: false,
                message: "Redis client is not available",
                data: null
            });
        }

        // Find the notification
        const notification = await Notification.findById(id);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
                data: null
            });
        }


        if (messages) notification.messages = messages;

        if (messages && messages.length > 200) {
            return res.status(400).json({
                success: false,
                message: "Messages cannot exceed 200 characters",
                data: null
            });
        }
        if (position) notification.position = position;

        const existingNotification = await Notification.findOne({ position });
        if (existingNotification && existingNotification._id.toString() !== id) {
            return res.status(400).json({
                success: false,
                message: "Notification with this position already exists",
                data: null
            });
        }

        if (expiredThis && new Date(expiredThis) < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Expiration date cannot be in the past",
                data: null
            });
        }

        if (expiredThis) notification.expiredThis = new Date(expiredThis);
        if (status) notification.status = status;

        const updatedNotification = await notification.save();


        await flushAllData(redisClient);

        return res.status(200).json({
            success: true,
            message: "Notification updated successfully",
            data: updatedNotification
        });

    } catch (error) {
        console.error("Error updating notification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error while updating notification",
            data: null
        });
    }
}

