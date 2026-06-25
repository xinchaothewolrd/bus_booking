// controllers/bookingController.js
// Logic đặt vé — giao tiếp với Trip Service để khóa/nhả ghế

import sequelize from '../libs/db.js';
import { Booking, Ticket, Payment } from '../models/index.js';
import { tripService, catalogService } from '../libs/httpClient.js';
import { notifyBookingCreated, notifyPaymentSuccess } from '../libs/notifyClient.js';
import axios from 'axios';

// ── TẠO BOOKING MỚI ──────────────────────────────────────────
// POST /api/bookings
// Body: { tripId, totalAmount, tickets: [{tripSeatId, passengerName, passengerPhone, pickupStopId?, dropoffStopId?}] }
export const createBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // user_id lấy từ header do API Gateway gắn vào (đã verify JWT rồi)
    const userId = req.headers['x-user-id'];
    const { tripId, totalAmount, tickets, email, fullName } = req.body;

    if (!tripId || !totalAmount || !tickets?.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Thiếu thông tin đặt vé.' });
    }

    // 1. Kiểm tra chuyến còn tồn tại không (gọi Trip Service)
    let trip;
    try {
      trip = await tripService.getTrip(tripId);
    } catch {
      await t.rollback();
      return res.status(404).json({ message: 'Chuyến xe không tồn tại.' });
    }

    if (new Date(trip.departure_time) <= new Date()) {
      await t.rollback();
      return res.status(400).json({ message: 'Chuyến xe này đã khởi hành.' });
    }

    // 2. Validate pickup/dropoff stops nếu có (gọi Catalog Service)
    for (const tk of tickets) {
      if (tk.pickupStopId) {
        try {
          const stop = await catalogService.getRouteStop(tk.pickupStopId);
          if ((stop.routeId || stop.route_id) != (trip.routeId || trip.route_id)) throw new Error();
        } catch {
          await t.rollback();
          return res.status(400).json({ message: `pickupStopId ${tk.pickupStopId} không hợp lệ.` });
        }
      }
    }

    // 3. Tạo Booking trong DB của mình
    const booking = await Booking.create({
      user_id: parseInt(userId),
      trip_id: tripId,
      total_amount: totalAmount,
      status: 'pending',
      booking_time: new Date(),
    }, { transaction: t });

    // 4. Tạo Tickets
    const seatIds = tickets.map(tk => tk.tripSeatId);
    const ticketData = tickets.map((tk) => {
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      return {
        booking_id: booking.id,
        trip_seat_id: tk.tripSeatId,
        passenger_name: tk.passengerName,
        passenger_phone: tk.passengerPhone,
        passenger_email: tk.passengerEmail,
        pickup_stop_id: tk.pickupStopId || null,
        dropoff_stop_id: tk.dropoffStopId || null,
        qr_code: `OB-${booking.id}-S${tk.tripSeatId}-${randomStr}`,
        status: 'unused',
      };
    });
    await Ticket.bulkCreate(ticketData, { transaction: t });

    // 5. Tạo Payment mặc định pending
    await Payment.create({
      booking_id: booking.id,
      amount: totalAmount,
      payment_method: 'cash',
      status: 'pending',
    }, { transaction: t });

    // 6. Khóa ghế bên Trip Service (10 phút để thanh toán)
    const pendingUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    try {
      await tripService.lockSeats(seatIds, pendingUntil);
    } catch (err) {
      await t.rollback();
      return res.status(err.status || 409).json({ message: err.message });
    }

    await t.commit();
    // thông báo qua email
    // Gửi email xác nhận đặt vé
    notifyBookingCreated({
      email,
      fullName: fullName || 'Quý khách',
      bookingId: booking.id,
      totalAmount,
      tickets: ticketData.map(t => ({ passengerName: t.passenger_name })),
    });

    // Trả về booking đầy đủ
    const fullBooking = await Booking.findByPk(booking.id, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });

    return res.status(201).json({
      message: 'Tạo đặt vé thành công. Quý khách có 10 phút để thanh toán.',
      data: fullBooking,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Lỗi tạo booking:', error);
    return res.status(500).json({ message: error.message || 'Đã xảy ra lỗi khi tạo đặt vé.' });
  }
};

// ── LẤY TẤT CẢ BOOKINGS (Admin) ──────────────────────────────
export const getAllBookings = async (req, res) => {
  try {
    // requireAdmin middleware sẽ kiểm tra trước
    const { userId, status, tripId } = req.query;
    const where = {};
    if (userId) where.user_id = userId;
    if (status) where.status = status;
    if (tripId) where.trip_id = tripId;

    const bookings = await Booking.findAll({
      where,
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json(bookings);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy danh sách đặt vé.' });
  }
};

// ── LẤY 1 BOOKING ────────────────────────────────────────────
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });
    if (!booking) return res.status(404).json({ message: 'Đặt vé không tồn tại.' });
    return res.status(200).json(booking);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy thông tin đặt vé.' });
  }
};

// ── BOOKINGS CỦA 1 USER ───────────────────────────────────────
export const getBookingsByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.headers['x-user-id'];
    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json({ data: bookings });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy đặt vé của user.' });
  }
};

// ── CẬP NHẬT TRẠNG THÁI BOOKING (Admin / Payment callback) ───
export const updateBooking = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }],
      transaction: t,
    });

    if (!booking) { await t.rollback(); return res.status(404).json({ message: 'Đặt vé không tồn tại.' }); }

    const validTransitions = { pending: ['paid', 'cancelled'], paid: ['cancelled'], cancelled: [] };
    if (status && booking.status !== status) {
      if (!validTransitions[booking.status]?.includes(status)) {
        await t.rollback();
        return res.status(400).json({ message: `Không thể chuyển từ '${booking.status}' sang '${status}'.` });
      }

      const seatIds = booking.Tickets.map(tk => tk.trip_seat_id);

      if (status === 'paid') {
        // Mock payment: chốt ghế ngay
        await tripService.bookSeats(seatIds);
        await Payment.update({ status: 'success', transaction_time: new Date() }, {
          where: { booking_id: booking.id }, transaction: t
        });
      } else if (status === 'cancelled') {
        await tripService.releaseSeats(seatIds);
        await Ticket.update({ status: 'cancelled' }, { where: { booking_id: booking.id }, transaction: t });
        await Payment.update({ status: 'failed' }, { where: { booking_id: booking.id }, transaction: t });
      }

      booking.status = status;
    }

    await booking.save({ transaction: t });
    await t.commit();

    const updated = await Booking.findByPk(booking.id, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });
    return res.status(200).json({ message: 'Cập nhật thành công.', data: updated });
  } catch (err) {
    await t.rollback();
    console.error('Lỗi cập nhật booking:', err);
    return res.status(500).json({ message: 'Lỗi cập nhật đặt vé.' });
  }
};

// ── HỦY BOOKING (User tự hủy > 24h trước) ────────────────────
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });
    if (!booking) return res.status(404).json({ message: 'Đặt vé không tồn tại.' });
    if (booking.status === 'cancelled') return res.status(400).json({ message: 'Đặt vé đã được hủy rồi.' });

    // Lấy thông tin chuyến để check 24h
    try {
      const trip = await tripService.getTrip(booking.trip_id);
      const hoursLeft = (new Date(trip.departure_time) - new Date()) / (1000 * 60 * 60);
      if (hoursLeft < 24) {
        return res.status(400).json({ message: 'Đã qua thời gian hủy vé (phải hủy trước 24h).' });
      }
    } catch {
      // Nếu trip service lỗi, vẫn cho hủy
    }

    const seatIds = booking.Tickets.map(tk => tk.trip_seat_id);
    await tripService.releaseSeats(seatIds);

    booking.status = 'cancelled';
    await booking.save();

    await Ticket.update({ status: 'cancelled' }, { where: { booking_id: booking.id } });
    if (booking.Payment?.status === 'success') {
      await Payment.update({ status: 'refunded' }, { where: { booking_id: booking.id } });
    }

    return res.status(200).json({ message: 'Hủy đặt vé thành công.' });
  } catch (err) {
    console.error('Lỗi hủy booking:', err);
    return res.status(500).json({ message: 'Lỗi hủy đặt vé.' });
  }
};

// ── XÓA BOOKING (Admin, chỉ xóa nếu chưa thanh toán) ──────────
export const deleteBooking = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });
    if (!booking) return res.status(404).json({ message: 'Đặt vé không tồn tại.' });

    // Không xóa booking đã thanh toán
    if (booking.Payment?.status === 'success') {
      return res.status(400).json({ message: 'Không thể xóa booking đã thanh toán. Vui lòng hủy thay vào đó.' });
    }

    // Nhả ghế nếu chuyển hành động
    if (booking.Tickets.length > 0) {
      const seatIds = booking.Tickets.map(tk => tk.trip_seat_id);
      try {
        await tripService.releaseSeats(seatIds);
      } catch (err) {
        console.warn('Lỗi nhả ghế khi xóa booking:', err);
      }
    }

    // Xóa tickets và payment trước
    await Ticket.destroy({ where: { booking_id: booking.id } });
    await Payment.destroy({ where: { booking_id: booking.id } });
    await booking.destroy();

    return res.status(200).json({ message: 'Xóa đặt vé thành công.' });
  } catch (err) {
    console.error('Lỗi xóa booking:', err);
    return res.status(500).json({ message: 'Lỗi xóa đặt vé.' });
  }
};

// ── GỬI LẠI EMAIL (Admin) ─────────────────────────────────────
export const resendEmail = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });

    if (!booking) return res.status(404).json({ message: 'Đặt vé không tồn tại.' });
    if (booking.status !== 'paid') return res.status(400).json({ message: 'Chỉ có thể gửi lại vé khi đã thanh toán.' });

    let email = booking.Tickets?.[0]?.passenger_email;
    let fullName = booking.Tickets?.[0]?.passenger_name;

    if (!email && booking.user_id) {
      try {
        const userRes = await axios.get(`http://user-service:3001/api/users/${booking.user_id}`);
        email = userRes.data.email;
        fullName = userRes.data.full_name;
      } catch (e) {
        console.warn('Không lấy được user info:', e.message);
      }
    }

    if (!email) {
      return res.status(400).json({ message: 'Không tìm thấy địa chỉ email của khách hàng.' });
    }

    notifyPaymentSuccess({
      email,
      fullName: fullName || 'Quý khách',
      bookingId: booking.id,
      amount: booking.total_amount,
      paymentMethod: booking.Payment?.payment_method || 'Thanh toán trực tuyến',
      tickets: booking.Tickets.map(t => ({
        passengerName: t.passenger_name,
        qrCode: t.qr_code
      })),
    });

    return res.status(200).json({ message: 'Đã gửi yêu cầu gửi lại email.' });
  } catch (err) {
    console.error('Lỗi resend email:', err);
    return res.status(500).json({ message: 'Lỗi server khi gửi lại email.' });
  }
};

