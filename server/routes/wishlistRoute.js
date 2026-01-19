import express from 'express';
import { addToWishlist, removeFromWishlist, getWishlist, checkWishlist } from '../controllers/wishlistController.js';
import authUser from '../middlewares/authUser.js';

const wishlistRouter = express.Router();

// All wishlist routes require authentication
wishlistRouter.get('/', authUser, getWishlist);
wishlistRouter.post('/add', authUser, addToWishlist);
wishlistRouter.post('/remove', authUser, removeFromWishlist);
wishlistRouter.get('/check/:productId', authUser, checkWishlist);

export default wishlistRouter;
