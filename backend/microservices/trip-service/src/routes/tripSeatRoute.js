import { Router } from 'express';
import {
  getAllTripSeats, getTripSeatById, getSeatsByTripId,
  createTripSeat, updateTripSeat, deleteTripSeat,
  lockSeats, bookSeats, releaseSeats, updateSeatStatus
} from '../controllers/tripSeatController.js';

const router = Router();

// ── PUBLIC ROUTES ─────────────────────────────────────
router.get('/', getAllTripSeats);
router.get('/:id', getTripSeatById);
router.get('/trip/:tripId', getSeatsByTripId);

// ── SERVICE-TO-SERVICE ROUTES (Lock/Book/Release) ─────────
// Order Service gọi các endpoint này để quản lý ghế
router.patch('/lock', lockSeats);
router.patch('/book', bookSeats);
router.patch('/release', releaseSeats);

// ── ADMIN ROUTES (CRUD ghế) ─────────────────────────────
// (Thường không cần vì ghế được tạo tự động từ Trip, nhưng để đầy đủ)
router.post('/', createTripSeat);
router.put('/:id', updateTripSeat);
router.delete('/:id', deleteTripSeat);

// API riêng cho Frontend tự update trạng thái ghế
router.patch('/:id/status', updateSeatStatus);

export default router;
