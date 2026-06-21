// routes/paymentRoute.js
import { Router } from 'express';
import {
  mockPay, createVnpayUrl, vnpayReturn, getPayment, getPaymentByBooking,
  getAllPayments, createPayment, updatePayment, approvePayment, rejectPayment, refundPayment
} from '../controllers/paymentController.js';
import { protectedRoute, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Public/User routes
router.post('/:id/pay',     protectedRoute, mockPay);          // User thanh toán
router.post('/create_url',   protectedRoute, createVnpayUrl);   // User tạo URL VNPAY
router.get('/vnpay-return',        vnpayReturn);                       // VNPAY callback (public — không cần JWT)
router.get('/booking/:bookingId',          protectedRoute, getPaymentByBooking); // User xem payment của booking

// Admin routes
router.get('/', requireAdmin, getAllPayments);                        // Admin xem tất cả payments
router.post('/', requireAdmin, createPayment);                        // Admin tạo payment
router.put('/:id', requireAdmin, updatePayment);             // Admin cập nhật payment
router.post('/:id/approve', requireAdmin, approvePayment);     // Admin phê duyệt
router.post('/:id/reject', requireAdmin, rejectPayment);       // Admin từ chối
router.post('/:id/refund', requireAdmin, refundPayment);       // Admin hoàn tiền

export default router;
