import express from 'express';
import { addReview, getProductReviews, deleteReview, updateReview } from '../controllers/reviewController.js';
import authUser from '../middlewares/authUser.js';

const reviewRouter = express.Router();

// Get reviews for a product (public)
reviewRouter.get('/:productId', getProductReviews);

// Add review (auth required)
reviewRouter.post('/add', authUser, addReview);

// Delete review (auth required)
reviewRouter.delete('/:reviewId', authUser, deleteReview);

// Update review (auth required)
reviewRouter.put('/:reviewId', authUser, updateReview);

export default reviewRouter;
