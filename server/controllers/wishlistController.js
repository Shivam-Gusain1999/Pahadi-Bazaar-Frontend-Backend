import User from "../models/User.js";

// Add to Wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;

        if (!productId) {
            return res.json({ success: false, message: "Product ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.json({ success: false, message: "Product already in wishlist" });
        }

        user.wishlist.push(productId);
        await user.save();

        return res.json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Remove from Wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        return res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).populate('wishlist');
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, wishlist: user.wishlist });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Check if product is in wishlist
export const checkWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const isInWishlist = user.wishlist.includes(productId);

        return res.json({ success: true, isInWishlist });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
