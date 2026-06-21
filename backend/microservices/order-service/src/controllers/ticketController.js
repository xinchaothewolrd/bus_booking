// controllers/ticketController.js

import { Ticket, Booking } from '../models/index.js';

// GET /api/tickets/booking/:bookingId — Lấy vé theo booking
export const getTicketsByBooking = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      where: { booking_id: req.params.bookingId }
    });
    return res.status(200).json(tickets);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy vé.' });
  }
};

// GET /api/tickets/:id — Lấy 1 vé
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Vé không tồn tại.' });
    return res.status(200).json(ticket);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy vé.' });
  }
};

// GET /api/tickets/qr/:qrCode — Kiểm tra vé QR (Checkin)
export const getTicketByQr = async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      where: { qr_code: req.params.qrCode },
      include: [{ model: Booking, as: 'Booking' }]
    });
    if (!ticket) return res.status(404).json({ message: 'Vé không tồn tại hoặc mã QR không hợp lệ.' });
    return res.status(200).json(ticket);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi kiểm tra vé.' });
  }
};

// PATCH /api/tickets/:id/use — Đánh dấu đã dùng vé (checkin)
export const useTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Vé không tồn tại.' });
    if (ticket.status !== 'unused') {
      return res.status(400).json({ message: `Vé đang ở trạng thái '${ticket.status}'.` });
    }
    ticket.status = 'used';
    await ticket.save();
    return res.status(200).json({ message: 'Check-in thành công.', data: ticket });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi check-in vé.' });
  }
};

// ── Lấy tất cả vé (Admin) ────────────────────────────────────────────────
export const getAllTickets = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { bookingId, status } = req.query;
    const where = {};
    if (bookingId) where.booking_id = bookingId;
    if (status) where.status = status;

    const tickets = await Ticket.findAll({
      where,
      include: [{ model: Booking, as: 'Booking' }],
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json(tickets);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy danh sách vé.' });
  }
};

// ── Tạo vé mới (Admin) ────────────────────────────────────────────────
export const createTicket = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { bookingId, tripSeatId, passengerName, passengerPhone, pickupStopId, dropoffStopId } = req.body;
    if (!bookingId || !tripSeatId) {
      return res.status(400).json({ message: 'Thiếu: bookingId, tripSeatId' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking không tồn tại.' });

    // Kiểm tra vé đã tồn tại cho tripSeatId này không
    const existing = await Ticket.findOne({ where: { trip_seat_id: tripSeatId } });
    if (existing) return res.status(409).json({ message: 'Ghế này đã có vé rồi.' });

    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newTicket = await Ticket.create({
      booking_id: bookingId,
      trip_seat_id: tripSeatId,
      passenger_name: passengerName || 'N/A',
      passenger_phone: passengerPhone || '',
      pickup_stop_id: pickupStopId || null,
      dropoff_stop_id: dropoffStopId || null,
      qr_code: `TK-${bookingId}-S${tripSeatId}-${randomStr}`,
      status: 'unused',
    });

    return res.status(201).json({ message: 'Tạo vé thành công.', data: newTicket });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi tạo vé.' });
  }
};

// ── Cập nhật vé (Admin) ────────────────────────────────────────────────
export const updateTicket = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { id: ticketId } = req.params;
    const { passengerName, passengerPhone, pickupStopId, dropoffStopId, status } = req.body;

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Vé không tồn tại.' });

    if (passengerName) ticket.passenger_name = passengerName;
    if (passengerPhone) ticket.passenger_phone = passengerPhone;
    if (pickupStopId) ticket.pickup_stop_id = pickupStopId;
    if (dropoffStopId) ticket.dropoff_stop_id = dropoffStopId;
    if (status) ticket.status = status;

    await ticket.save();
    return res.status(200).json({ message: 'Cập nhật vé thành công.', data: ticket });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi cập nhật vé.' });
  }
};

// ── Xóa vé (Admin, chỉ xóa nếu chưa sử dụng) ──────────────────────────
export const deleteTicket = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { id: ticketId } = req.params;
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Vé không tồn tại.' });

    if (ticket.status !== 'unused') {
      return res.status(400).json({ message: `Chỉ xóa được vé chưa sử dụng. Vé này ở trạng thái '${ticket.status}'.` });
    }

    await ticket.destroy();
    return res.status(200).json({ message: 'Xóa vé thành công.' });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi xóa vé.' });
  }
};

// ── Lấy tất cả vé của user (User) ────────────────────────────────────────
import { tripService, catalogService } from '../libs/httpClient.js';

export const getTicketsByUser = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { userId: paramUserId } = req.params;

    // Check ownership: user chỉ xem được vé của mình trừ khi là admin
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin' && String(userId) !== String(paramUserId)) {
      return res.status(403).json({ message: 'Không có quyền xem vé của user khác.' });
    }

    const tickets = await Ticket.findAll({
      include: [{
        model: Booking,
        as: 'Booking',
        where: { user_id: paramUserId },
        attributes: ['id', 'user_id', 'trip_id', 'status']
      }],
      order: [['created_at', 'DESC']],
    });

    // Lấy thông tin chuyến (Trip), route, pickup, dropoff từ mock-services
    const tripCache = {};
    const stopCache = {};

    const enrichedTickets = [];
    for (const ticket of tickets) {
      const ticketJSON = ticket.toJSON();
      const tripId = ticketJSON.Booking.trip_id;

      // 1. Enrich Trip
      if (!tripCache[tripId]) {
        try {
          tripCache[tripId] = await tripService.getTrip(tripId);
        } catch {
          tripCache[tripId] = { route: { departureLocation: 'N/A', arrivalLocation: 'N/A' } };
        }
      }
      ticketJSON.Booking.Trip = tripCache[tripId];

      // 2. Enrich Seat
      if (ticketJSON.trip_seat_id) {
        if (!tripCache[`seats_${tripId}`]) {
          try {
            tripCache[`seats_${tripId}`] = await tripService.getSeats(tripId);
          } catch {
            tripCache[`seats_${tripId}`] = [];
          }
        }
        const seat = tripCache[`seats_${tripId}`].find(s => s.id === ticketJSON.trip_seat_id);
        if (seat) ticketJSON.Seat = { seatNumber: seat.seat_number };
      }

      // 3. Enrich PickupStop
      if (ticketJSON.pickup_stop_id) {
        if (!stopCache[ticketJSON.pickup_stop_id]) {
          try {
            stopCache[ticketJSON.pickup_stop_id] = await catalogService.getRouteStop(ticketJSON.pickup_stop_id);
          } catch {
            stopCache[ticketJSON.pickup_stop_id] = { stopName: 'N/A', address: 'N/A' };
          }
        }
        ticketJSON.PickupStop = stopCache[ticketJSON.pickup_stop_id];
      }

      // 4. Enrich DropoffStop
      if (ticketJSON.dropoff_stop_id) {
        if (!stopCache[ticketJSON.dropoff_stop_id]) {
          try {
            stopCache[ticketJSON.dropoff_stop_id] = await catalogService.getRouteStop(ticketJSON.dropoff_stop_id);
          } catch {
            stopCache[ticketJSON.dropoff_stop_id] = { stopName: 'N/A', address: 'N/A' };
          }
        }
        ticketJSON.DropoffStop = stopCache[ticketJSON.dropoff_stop_id];
      }

      enrichedTickets.push(ticketJSON);
    }

    return res.status(200).json(enrichedTickets);
  } catch (err) {
    console.error('Lỗi getTicketsByUser:', err);
    return res.status(500).json({ message: 'Lỗi lấy danh sách vé.' });
  }
};
