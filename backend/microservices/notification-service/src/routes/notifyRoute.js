// routes/notifyRoute.js
import { Router } from 'express';
import {
  notifyBookingCreated,
  notifyPaymentSuccess,
  notifyBookingCancelled,
} from '../controllers/notifyController.js';

const router = Router();

// Các route này chỉ dành cho service nội bộ gọi — không expose ra ngoài qua Gateway
router.post('/booking-created',   notifyBookingCreated);
router.post('/payment-success',   notifyPaymentSuccess);
router.post('/booking-cancelled', notifyBookingCancelled);

export default router;
