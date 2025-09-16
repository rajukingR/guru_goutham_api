// src/routes/auth_routes/authRoutes.js
import express from 'express';
import { signup, signin, forgotPassword, resetPassword } from '../../controllers/auth_controller/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
