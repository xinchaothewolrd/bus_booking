import Trip from '../models/Trip.js';

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

    if (!routeId || !departureTime) {
      return res.status(400).json({ message: 'Thiếu thông tin tuyến đường (routeId) hoặc giờ khởi hành (departureTime).' });
    }

    const newTrip = await Trip.create({
      routeId,
      busId: busId || null,
      departureTime,
      arrivalTimeExpected: arrivalTimeExpected || null,
      status: status || 'scheduled',
      cancelPolicy: cancelPolicy || null,
    });

    return res.status(201).json({ message: 'Tạo chuyến xe thành công!', data: newTrip });
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
