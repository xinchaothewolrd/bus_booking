// routes/authRoute.js
import { Router } from 'express';
import { signUp, signIn, signOut, refreshToken, verifyToken } from '../controllers/authController.js';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/signout', signOut);
router.post('/refresh', refreshToken);
router.post('/verify-token', verifyToken); // Chỉ dành cho API Gateway

export default router;
