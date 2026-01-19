import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return this.authProvider === 'local'; } },
    cartItems: { type: Object, default: {} },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // Google OAuth fields
    googleId: { type: String, default: null },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    // Profile fields
    phone: { type: String, default: '' },
    avatar: { type: String, default: '' },
}, { minimize: false, timestamps: true })

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User;