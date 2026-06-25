import Trip from '../models/Trip.js';
import TripSeat from '../models/TripSeat.js';
import axios from 'axios';

// Lấy toàn bộ danh sách chuyến xe
export const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.findAll();
    return res.status(200).json(trips);
  } catch (error) {
    console.error('Lỗi lấy danh sách chuyến đi:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Lấy 1 chuyến xe theo ID
export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Chuyến đi không tồn tại.' });
    return res.status(200).json(trip);
  } catch (error) {
    console.error('Lỗi lấy chuyến đi:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Tạo chuyến xe mới
export const createTrip = async (req, res) => {
  try {
    const { routeId, busId, departureTime, arrivalTimeExpected, status, cancelPolicy } = req.body;

    if (!routeId || !departureTime || !busId) {
      return res.status(400).json({ message: 'Thiếu thông tin tuyến đường, xe hoặc giờ khởi hành.' });
    }

    // 1. Tạo thông tin chuyến xe cơ bản
    const newTrip = await Trip.create({
      routeId,
      busId,
      departureTime,
      arrivalTimeExpected: arrivalTimeExpected || null,
      status: status || 'scheduled',
      cancelPolicy: cancelPolicy || null,
    });

    // 2. Gọi API sang catalog-service để lấy thông tin loại xe và tổng số ghế
    let totalSeats = 40; // Mặc định 40 ghế (A1-A20, B1-B20)
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      const busRes = await axios.get(`${catalogUrl}/api/buses/${busId}`);
      if (busRes.data && busRes.data.busType && busRes.data.busType.totalSeats) {
        totalSeats = busRes.data.busType.totalSeats;
      }
    } catch (err) {
      console.warn('Lỗi khi lấy thông tin xe từ catalog-service, dùng mặc định 40 ghế:', err.message);
    }

    // 3. Tự động sinh danh sách ghế (TripSeat)
    const seatsData = [];
    const half = Math.floor(totalSeats / 2);
    
    // Tầng dưới (A)
    for (let i = 1; i <= half; i++) {
      seatsData.push({ tripId: newTrip.id, seatNumber: `A${i}`, status: 'available' });
    }
    // Tầng trên (B)
    for (let i = 1; i <= (totalSeats - half); i++) {
      seatsData.push({ tripId: newTrip.id, seatNumber: `B${i}`, status: 'available' });
    }

    if (seatsData.length > 0) {
      await TripSeat.bulkCreate(seatsData);
    }

    return res.status(201).json({ message: 'Tạo chuyến xe và ghế thành công!', data: newTrip });
  } catch (error) {
    console.error('Lỗi tạo chuyến đi:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Cập nhật thông tin chuyến xe
export const updateTrip = async (req, res) => {
  try {
    const { routeId, busId, departureTime, arrivalTimeExpected, status, cancelPolicy } = req.body;
    const trip = await Trip.findByPk(req.params.id);

    if (!trip) return res.status(404).json({ message: 'Chuyến không tồn tại.' });

    await trip.update({
      routeId,
      busId,
      departureTime,
      arrivalTimeExpected,
      status,
      cancelPolicy,
    });

    return res.status(200).json({ message: 'Cập nhật thành công.', data: trip });
  } catch (error) {
    console.error('Lỗi cập nhật chuyến đi:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// Xóa chuyến xe
export const deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByPk(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Chuyến không tồn tại.' });

    await trip.destroy();
    return res.status(200).json({ message: 'Xóa chuyến xe thành công.' });
  } catch (error) {
    console.error('Lỗi xóa chuyến đi:', error);
    return res.status(500).json({ message: 'Không thể xóa vì đã có vé được đặt.' });
  }
};
