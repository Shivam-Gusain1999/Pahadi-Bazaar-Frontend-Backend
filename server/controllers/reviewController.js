import Review from "../models/Review.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

// Add Review
export const addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user.id;

        if (!productId || !rating || !comment) {
            return res.json({ success: false, message: "All fields are required" });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.json({ success: false, message: "You already reviewed this product" });
        }

        // Get user name
        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const review = await Review.create({
            userId,
            productId,
            rating,
            comment,
            userName: user.name
        });

        return res.json({ success: true, message: "Review added successfully", review });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get Product Reviews
export const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.find({ productId })
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 });

        // Calculate average rating
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        return res.json({
            success: true,
            reviews,
            stats: {
                totalReviews,
                avgRating: Math.round(avgRating * 10) / 10
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Delete Review
export const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.json({ success: false, message: "Review not found" });
        }

        // Check if user owns this review
        if (review.userId.toString() !== userId) {
            return res.json({ success: false, message: "Not authorized to delete this review" });
        }

        await Review.findByIdAndDelete(reviewId);

        return res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update Review
export const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.json({ success: false, message: "Review not found" });
        }

        if (review.userId.toString() !== userId) {
            return res.json({ success: false, message: "Not authorized" });
        }

        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        await review.save();

        return res.json({ success: true, message: "Review updated", review });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
