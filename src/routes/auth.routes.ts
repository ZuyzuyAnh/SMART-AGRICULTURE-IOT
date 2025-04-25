import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Đăng ký
router.post('/register', authController.register);

// Đăng nhập
router.post('/login', authController.login);

// Lấy thông tin profile (cần xác thực)
router.get('/profile', authenticate, authController.getProfile);

// Quên mật khẩu
router.post('/forgot-password', authController.forgotPassword);

// Đặt lại mật khẩu
router.post('/reset-password', authController.resetPassword);

// Thay đổi mật khẩu (cần xác thực)
router.post('/change-password', authenticate, authController.changePassword);

router.delete('/account', authenticate, authController.deleteAccount);

export default router;