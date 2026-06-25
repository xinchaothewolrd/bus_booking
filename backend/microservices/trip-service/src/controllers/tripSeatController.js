import TripSeat from '../models/TripSeat.js';
import axios from 'axios';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:3000';

const notifyGateway = async (seatOrSeats) => {
  try {
    const seats = Array.isArray(seatOrSeats) ? seatOrSeats : [seatOrSeats];
    for (const seat of seats) {
      await axios.post(`${API_GATEWAY_URL}/api/internal/notify-seat`, {
        seatId: seat.id,
        tripId: seat.tripId,
        seatNumber: seat.seatNumber,
        status: seat.status,
        pendingUntil: seat.pendingUntil
      }).catch(err => console.error('Lỗi khi báo Gateway cho ghế', seat.id, ':', err.message));
    }
  } catch (err) {
    console.error('Lỗi chung khi báo Gateway:', err.message);
  }
};
import Trip from '../models/Trip.js';

export const getAllTripSeats = async (req, res) => {
  try {
    const seats = await TripSeat.findAll();
    return res.status(200).json(seats);
  } catch (error) {
    console.error('Lỗi lấy danh sách ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const getTripSeatById = async (req, res) => {
  try {
    const seat = await TripSeat.findByPk(req.params.id);
    if (!seat) return res.status(404).json({ message: 'Không tìm thấy thông tin ghế này.' });
    return res.status(200).json(seat);
  } catch (error) {
    console.error('Lỗi lấy thông tin ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Lấy ghế theo tripId
export const getSeatsByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;
    const seats = await TripSeat.findAll({
      where: { tripId: parseInt(tripId) }
    });
    return res.status(200).json(seats);
  } catch (error) {
    console.error('Lỗi lấy ghế theo chuyến đi:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const createTripSeat = async (req, res) => {
  try {
    const { tripId, seatNumber, status, pendingUntil } = req.body;

    if (!tripId || !seatNumber) {
      return res.status(400).json({ message: 'Cần truyền tên ghế (Ví dụ: A1) và Mã Chuyến Đi.' });
    }

    const newSeat = await TripSeat.create({
      tripId,
      seatNumber,
      status: status || 'available',
      pendingUntil
    });

    return res.status(201).json({ message: 'Tạo dữ liệu ghế thành công!', data: newSeat });
  } catch (error) {
    console.error('Lỗi tạo ghế:', error);
    return res.status(500).json({ message: 'Lỗi cấu tạo ghế ngồi.' });
  }
};

export const updateTripSeat = async (req, res) => {
  try {
    const { tripId, seatNumber, status, pendingUntil } = req.body;
    const seat = await TripSeat.findByPk(req.params.id);

    if (!seat) return res.status(404).json({ message: 'Ghế không tồn tại.' });

    await seat.update({
      tripId,
      seatNumber,
      status,
      pendingUntil
    });

    return res.status(200).json({ message: 'Cập nhật tình trạng ghế thành công.', data: seat });
  } catch (error) {
    console.error('Lỗi cập nhật ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const updateSeatStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const seat = await TripSeat.findByPk(req.params.id);

    if (!seat) return res.status(404).json({ message: 'Ghế không tồn tại.' });

    await seat.update({ status });

    notifyGateway(seat);

    return res.status(200).json({ message: 'Cập nhật tình trạng ghế thành công.', data: seat });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const deleteTripSeat = async (req, res) => {
  try {
    const seat = await TripSeat.findByPk(req.params.id);
    if (!seat) return res.status(404).json({ message: 'Ghế không tồn tại.' });

    await seat.destroy();
    return res.status(200).json({ message: 'Hủy bỏ dữ liệu ghế thành công.' });
  } catch (error) {
    console.error('Lỗi xóa ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// ─────────────────────────────────────────────────────────────
// CÁC HÀM ĐỀUỀC ORDER SERVICE GỌI (Internal/Service-to-Service)
// ─────────────────────────────────────────────────────────────

// Lock ghế (chuyển sang pending) - Order Service gọi
export const lockSeats = async (req, res) => {
  try {
    const { seatIds, pendingUntil } = req.body;
    if (!seatIds || !seatIds.length) {
      return res.status(400).json({ message: 'Thiếu seatIds' });
    }

    const unavailable = [];
    for (const id of seatIds) {
      const seat = await TripSeat.findByPk(id);
      if (!seat) return res.status(404).json({ message: `Ghế ID ${id} không tồn tại` });
      if (seat.status === 'booked') unavailable.push(seat.seatNumber);
    }

    if (unavailable.length > 0) {
      return res.status(409).json({ message: `Ghế ${unavailable.join(', ')} đã có người mua` });
    }

    await Promise.all(seatIds.map(id =>
      TripSeat.update(
        { status: 'pending', pendingUntil },
        { where: { id } }
      )
    ));

    // Lấy lại danh sách ghế đã update để gửi sự kiện
    const updatedSeats = await TripSeat.findAll({ where: { id: seatIds } });
    notifyGateway(updatedSeats);

    return res.status(200).json({ message: 'Khóa ghế thành công' });
  } catch (error) {
    console.error('Lỗi lock ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Book ghế (chuyển sang booked) - Order Service gọi sau khi thanh toán
export const bookSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;
    if (!seatIds || !seatIds.length) {
      return res.status(400).json({ message: 'Thiếu seatIds' });
    }

    await Promise.all(seatIds.map(id =>
      TripSeat.update(
        { status: 'booked', pendingUntil: null },
        { where: { id } }
      )
    ));

    const updatedSeats = await TripSeat.findAll({ where: { id: seatIds } });
    notifyGateway(updatedSeats);

    return res.status(200).json({ message: 'Đặt ghế thành công' });
  } catch (error) {
    console.error('Lỗi book ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Release ghế (chuyển về available) - Order Service gọi khi hủy
export const releaseSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;
    if (!seatIds || !seatIds.length) {
      return res.status(400).json({ message: 'Thiếu seatIds' });
    }

    await Promise.all(seatIds.map(id =>
      TripSeat.update(
        { status: 'available', pendingUntil: null },
        { where: { id } }
      )
    ));

    const updatedSeats = await TripSeat.findAll({ where: { id: seatIds } });
    notifyGateway(updatedSeats);

    return res.status(200).json({ message: 'Nhả ghế thành công' });
  } catch (error) {
    console.error('Lỗi release ghế:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};
