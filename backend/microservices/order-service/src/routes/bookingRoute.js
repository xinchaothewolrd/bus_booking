// routes/bookingRoute.js
import { Router } from 'express';
import { createBooking, getAllBookings, getBookingById, getBookingsByUser, updateBooking, cancelBooking, deleteBooking, resendEmail } from '../controllers/bookingController.js';
import { requireAdmin, protectedRoute } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', protectedRoute, createBooking);                      // User tạo booking
router.get('/', requireAdmin, getAllBookings);                        // Admin xem tất cả
router.get('/user/:userId', protectedRoute, getBookingsByUser);       // User xem booking của mình
router.get('/:id', protectedRoute, getBookingById);                   // User/Admin xem chi tiết
router.put('/:id', requireAdmin, updateBooking);                    // Admin cập nhật
router.delete('/:id', requireAdmin, deleteBooking);                   // Admin xóa
router.post('/:bookingId/cancel', protectedRoute, cancelBooking);            // User hủy booking của mình
router.post('/:id/resend-email', requireAdmin, resendEmail);          // Admin gửi lại email

export default router;
