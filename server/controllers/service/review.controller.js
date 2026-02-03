const Review = require("../../models/review/review.model");
const Service = require("../../models/services/services.model");
const { cleanRedisDataFlush, getRedisClient } = require("../../utils/redis.utils");

// Create Review
exports.createReview = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const userId = req.user._id;

        const {
            review_message,
            review_ratings,
            review_for_what_service,
            review_status = "Draft"
        } = req.body;

        // Validate required fields
        if (!review_message || !review_ratings || !review_for_what_service) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: review_message, review_ratings, or review_for_what_service"
            });
        }

        // Check if the service exists
        const foundService = await Service.findById(review_for_what_service);
        if (!foundService) {
            return res.status(404).json({
                success: false,
                message: "Service not found"
            });
        }

        // Create review object
        const review = new Review({
            reviewer_id: userId,
            review_message,
            review_ratings,
            review_for_what_service,
            review_status
        });

        // Save review and link to service
        await review.save();
        foundService.service_reviews.push(review._id);
        await foundService.save();

        // Clear relevant cache
        await cleanRedisDataFlush(redisClient, 'service*');

        return res.status(201).json({
            success: true,
            message: "Review created and linked to service successfully",
            data: review
        });
    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// Get All Reviews
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('reviewer_id')
            .populate('review_for_what_service');
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Review by ID
exports.getReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id)
            .populate('reviewer_id')
            .populate('review_for_what_service');

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Review
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndUpdate(id, req.body, { new: true });

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, message: "Review updated successfully", data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Review
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        res.status(200).json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
