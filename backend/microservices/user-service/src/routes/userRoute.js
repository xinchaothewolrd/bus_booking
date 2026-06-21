// routes/userRoute.js
import { Router } from 'express';
import { protectedRoute, requireAdmin } from '../middlewares/authMiddleware.js';
import { getMe, getAllUsers, getUserById, updateUser, deleteUser, createUser, updateUserStatus } from '../controllers/userController.js';

const router = Router();
// ── Internal route (không cần JWT — chỉ gọi từ service nội bộ) ──
// Order service dùng để lấy email user sau thanh toán VNPAY
router.get('/:id/internal', getUserById);
router.get('/me', protectedRoute, getMe);
router.get('/', protectedRoute, requireAdmin, getAllUsers);
router.post('/', protectedRoute, requireAdmin, createUser);                    // Admin tạo user mới
router.get('/:id', protectedRoute, getUserById);
router.put('/:id', protectedRoute, updateUser);
router.patch('/:id/status', protectedRoute, requireAdmin, updateUserStatus);   // Admin thay đổi status
router.delete('/:id', protectedRoute, requireAdmin, deleteUser);

export default router;
