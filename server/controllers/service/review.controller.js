const Review = require("../../models/review/review.model");
const Service = require("../../models/services/services.model");
const { cleanRedisDataFlush, getRedisClient } = require("../../utils/redis.utils");

// Create Review
exports.createReview = async (req, res) => {
    try {
        const redisClient = getRedisClient(req, res);
        const review = new Review(req.body);

        const foundService = await Service.findById(req.body.review_for_what_service);
        if (!foundService) {
            return res.status(404).json({ success: false, message: "Service not found" });
        }

        // Save the review first
        await review.save();


        foundService.service_reviews.push(review._id);
        await foundService.save();
        await cleanRedisDataFlush(redisClient, 'service*');
        res.status(201).json({
            success: true,
            message: "Review created and linked to service successfully",
            data: review
        });
    } catch (error) {
        console.error("Error creating review:", error);
        res.status(500).json({ success: false, message: error.message });
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
