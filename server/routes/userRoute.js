import express from 'express'
import { isAuth, login, logout, register, googleAuth, googleCallback, getProfile, updateProfile } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';



const userRouter = express.Router();
userRouter.post('/register', register)
userRouter.post('/login', login)
userRouter.get('/is-auth', authUser, isAuth)
userRouter.get('/logout', authUser, logout)

// Google OAuth routes
userRouter.get('/google', googleAuth)
userRouter.get('/google/callback', googleCallback)

// Profile routes
userRouter.get('/profile', authUser, getProfile)
userRouter.put('/profile', authUser, updateProfile)

export default userRouter;