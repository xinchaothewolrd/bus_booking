// routes/ticketRoute.js
import { Router } from 'express';
import {
  getTicketsByBooking, getTicketById, getTicketByQr, useTicket,
  getAllTickets, createTicket, updateTicket, deleteTicket, getTicketsByUser, getTicketsByTrip
} from '../controllers/ticketController.js';
import { protectedRoute, requireAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

// Admin routes
router.get('/', requireAdmin, getAllTickets);                         // Admin xem tất cả
router.post('/', requireAdmin, createTicket);                         // Admin tạo vé
router.put('/:id', requireAdmin, updateTicket);               // Admin cập nhật
router.delete('/:id', requireAdmin, deleteTicket);              // Admin xóa

// User/Admin routes
router.get('/trip/:tripId', protectedRoute, getTicketsByTrip);          // Lấy vé theo chuyến xe
router.get('/booking/:bookingId', protectedRoute, getTicketsByBooking); // Xem vé theo booking
router.get('/check/:qrCode', requireAdmin, getTicketByQr);               // Admin check QR code
router.get('/user/:userId', protectedRoute, getTicketsByUser);        // User xem tất cả vé của mình
router.get('/:id', protectedRoute, getTicketById);                    // Xem chi tiết vé
router.patch('/:id/checkin', requireAdmin, useTicket);                    // Admin check-in

export default router;
