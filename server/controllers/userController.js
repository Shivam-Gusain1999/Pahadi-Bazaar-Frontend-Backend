

// Register User//

import User from "../models/User.js"
import bcrypt, { hash } from "bcryptjs"
import jwt from 'jsonwebtoken'


export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'missing details' })
        }
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.json({ success: false, message: 'user is already exist' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ name, email, password: hashedPassword, authProvider: 'local' })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.json({ success: true, user: { email: user.email, name: user.name } })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}


// login user //

export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.json({
                success: false,
                message: 'email or password is required'
            });
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.json({
                success: false,
                message: 'invalid email or password'
            });

        }

        // Check if user logged in via Google
        if (user.authProvider === 'google') {
            return res.json({
                success: false,
                message: 'Please login with Google'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({
                success: false,
                message: 'invalid email or password'
            })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        return res.json({ success: true, user: { email: user.email, name: user.name } })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

// check auth //

export const isAuth = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        return res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// logged out //
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({
            success: true, message: "Logged Out"
        })
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Google OAuth - Redirect to Google
export const googleAuth = async (req, res) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const redirectUri = `${process.env.VITE_BACKEND_URL || req.protocol + '://' + req.get('host')}/api/user/google/callback`;

        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=email profile&` +
            `access_type=offline`;

        res.redirect(googleAuthUrl);
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Google OAuth Callback
export const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        if (!code) {
            return res.redirect(`${frontendUrl}?error=google_auth_failed`);
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${process.env.VITE_BACKEND_URL || req.protocol + '://' + req.get('host')}/api/user/google/callback`,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (!tokens.access_token) {
            return res.redirect(`${frontendUrl}?error=token_exchange_failed`);
        }

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });

        const googleUser = await userInfoResponse.json();

        if (!googleUser.email) {
            return res.redirect(`${frontendUrl}?error=no_email`);
        }

        // Check if user exists
        let user = await User.findOne({ email: googleUser.email });

        if (user) {
            // Update Google ID if not set
            if (!user.googleId) {
                user.googleId = googleUser.id;
                user.authProvider = 'google';
                await user.save();
            }
        } else {
            // Create new user
            user = await User.create({
                name: googleUser.name,
                email: googleUser.email,
                googleId: googleUser.id,
                authProvider: 'google',
                avatar: googleUser.picture
            });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Redirect to frontend
        res.redirect(`${frontendUrl}?login=success`);

    } catch (error) {
        console.log(error.message);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}?error=server_error`);
    }
};

// Get User Profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update User Profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, avatar } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;

        await user.save();

        return res.json({
            success: true,
            message: "Profile updated",
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

