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

    let ticketJSON = ticket.toJSON();
    
    // 1. Android expects 'booking' instead of 'Booking'
    ticketJSON.booking = ticketJSON.Booking;
    delete ticketJSON.Booking;

    // 2. Fetch Trip and Route
    const tripId = ticketJSON.booking?.trip_id || ticketJSON.booking?.tripId;
    if (tripId) {
      try {
        const tripRes = await tripService.getTrip(tripId);
        const trip = tripRes.data || tripRes;
        if (trip && (trip.route_id || trip.routeId)) {
          const routeRes = await catalogService.getRoute(trip.route_id || trip.routeId);
          const route = routeRes.data || routeRes;
          ticketJSON.booking.route = {
            departureLocation: route.departure_location || route.departureLocation,
            arrivalLocation: route.arrival_location || route.arrivalLocation
          };
        }
        
        // Fetch Seat Number
        const seatId = ticketJSON.trip_seat_id || ticketJSON.tripSeatId;
        if (seatId) {
          const seatsRes = await tripService.getSeats(tripId);
          const seats = Array.isArray(seatsRes.data) ? seatsRes.data : seatsRes;
          const seat = seats.find(s => s.id === seatId);
          if (seat) {
            ticketJSON.seatNumber = seat.seat_number || seat.seatNumber;
          }
        }
      } catch (e) {
        console.error('Lỗi lấy thông tin route/seat:', e.message);
      }
    }

    // 3. Fetch Stops
    const pickupId = ticketJSON.pickup_stop_id || ticketJSON.pickupStopId;
    if (pickupId) {
      try {
        const stopRes = await catalogService.getRouteStop(pickupId);
        const st = stopRes.data || stopRes;
        ticketJSON.pickupStop = { ...st, name: st.stopName || st.stop_name };
      } catch (e) {}
    }

    const dropoffId = ticketJSON.dropoff_stop_id || ticketJSON.dropoffStopId;
    if (dropoffId) {
      try {
        const stopRes = await catalogService.getRouteStop(dropoffId);
        const st = stopRes.data || stopRes;
        ticketJSON.dropoffStop = { ...st, name: st.stopName || st.stop_name };
      } catch (e) {}
    }

    return res.status(200).json({ ticket: ticketJSON });
  } catch (err) {
    console.error(err);
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
    if (userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin hoặc Staff.' });
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

// ── Lấy vé theo chuyến (Dành cho App nhân viên quét vé) ───────────
export const getTicketsByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Lấy tất cả bookings thuộc chuyến xe này
    const bookings = await Booking.findAll({
      where: { trip_id: tripId },
      attributes: ['id']
    });

    const bookingIds = bookings.map(b => b.id);
    if (bookingIds.length === 0) {
      return res.status(200).json([]);
    }

    // Lấy tất cả vé thuộc các bookings này
    const tickets = await Ticket.findAll({
      where: { booking_id: bookingIds },
      order: [['created_at', 'ASC']]
    });

    // Lấy thông tin ghế từ trip-service
    let tripSeats = [];
    try {
      const seatsRes = await tripService.getSeats(tripId);
      tripSeats = Array.isArray(seatsRes.data) ? seatsRes.data : seatsRes;
    } catch (e) {
      console.error('Lỗi lấy ghế từ trip-service:', e.message);
    }

    const enrichedTickets = tickets.map(ticket => {
      const ticketJSON = ticket.toJSON();
      const seatId = ticketJSON.trip_seat_id || ticketJSON.tripSeatId;
      const seat = tripSeats.find(s => s.id === seatId);
      
      ticketJSON.Seat = {
        seatNumber: seat ? (seat.seatNumber || seat.seat_number) : null
      };

      return ticketJSON;
    });

    return res.status(200).json(enrichedTickets);
  } catch (err) {
    console.error('Lỗi lấy vé theo trip:', err);
    return res.status(500).json({ message: 'Lỗi lấy danh sách vé theo chuyến.' });
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
        attributes: ['id', 'user_id', 'trip_id', 'status', 'total_amount', 'booking_time']
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
          const tripData = await tripService.getTrip(tripId);
          // Gắn thêm thông tin route
          const routeId = tripData.routeId || tripData.route_id;
          if (routeId) {
            try {
              const routeData = await catalogService.getRoute(routeId);
              tripData.route = routeData;
            } catch (err) {}
          }
          if (!tripData.route) {
            tripData.route = { departureLocation: 'N/A', arrivalLocation: 'N/A' };
          }
          tripCache[tripId] = tripData;
        } catch {
          tripCache[tripId] = { route: { departureLocation: 'N/A', arrivalLocation: 'N/A' } };
        }
      }
      ticketJSON.Booking.Trip = tripCache[tripId];

      // 2. Enrich Seat
      if (ticketJSON.tripSeatId || ticketJSON.trip_seat_id) {
        const seatId = ticketJSON.tripSeatId || ticketJSON.trip_seat_id;
        if (!tripCache[`seats_${tripId}`]) {
          try {
            tripCache[`seats_${tripId}`] = await tripService.getSeats(tripId);
          } catch {
            tripCache[`seats_${tripId}`] = [];
          }
        }
        const seat = tripCache[`seats_${tripId}`].find(s => s.id === seatId);
        if (seat) ticketJSON.Seat = { seatNumber: seat.seatNumber || seat.seat_number };
      }

      // 3. Enrich PickupStop
      if (ticketJSON.pickupStopId) {
        if (!stopCache[ticketJSON.pickupStopId]) {
          try {
            stopCache[ticketJSON.pickupStopId] = await catalogService.getRouteStop(ticketJSON.pickupStopId);
          } catch {
            stopCache[ticketJSON.pickupStopId] = { stopName: 'N/A', address: 'N/A' };
          }
        }
        ticketJSON.PickupStop = stopCache[ticketJSON.pickupStopId];
      }

      // 4. Enrich DropoffStop
      if (ticketJSON.dropoffStopId) {
        if (!stopCache[ticketJSON.dropoffStopId]) {
          try {
            stopCache[ticketJSON.dropoffStopId] = await catalogService.getRouteStop(ticketJSON.dropoffStopId);
          } catch {
            stopCache[ticketJSON.dropoffStopId] = { stopName: 'N/A', address: 'N/A' };
          }
        }
        ticketJSON.DropoffStop = stopCache[ticketJSON.dropoffStopId];
      }

      enrichedTickets.push(ticketJSON);
    }

    return res.status(200).json(enrichedTickets);
  } catch (err) {
    console.error('Lỗi getTicketsByUser:', err);
    return res.status(500).json({ message: 'Lỗi lấy danh sách vé.' });
  }
};
