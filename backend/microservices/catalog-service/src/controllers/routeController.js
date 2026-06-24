import Route from '../models/Route.js';

export const getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.findAll();
    return res.status(200).json(routes);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tuyến đường:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống.' });
  }
};

export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ message: 'Không tìm thấy tuyến đường này.' });
    return res.status(200).json(route);
  } catch (error) {
    console.error('Lỗi khi lấy tuyến đường:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống.' });
  }
};

export const createRoute = async (req, res) => {
  try {
    const { departureLocation, arrivalLocation, distanceKm, durationEst } = req.body;

    if (!departureLocation || !arrivalLocation) {
      return res.status(400).json({ message: 'Nhiều thông tin bắt buộc bị thiếu (Điểm đi, Điểm đến).' });
    }

    const newRoute = await Route.create({
      departureLocation,
      arrivalLocation,
      distanceKm,
      durationEst
    });

    return res.status(201).json({ message: 'Tuyến đường được tạo thành công!', data: newRoute });
  } catch (error) {
    console.error('Lỗi khi tạo tuyến đường:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi khởi tạo tuyến đường.' });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const { departureLocation, arrivalLocation, distanceKm, durationEst } = req.body;
    const route = await Route.findByPk(req.params.id);

    if (!route) return res.status(404).json({ message: 'Tuyến đường không tồn tại.' });

    await route.update({
      departureLocation,
      arrivalLocation,
      distanceKm,
      durationEst
    });

    return res.status(200).json({ message: 'Đã cập nhật tuyến đường thành công.', data: route });
  } catch (error) {
    console.error('Lỗi khi update tuyến đường:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống.' });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findByPk(req.params.id);
    if (!route) return res.status(404).json({ message: 'Không tìm thấy tuyến đường.' });

    await route.destroy();
    return res.status(200).json({ message: 'Tuyến đường đã bị xóa khỏi hệ thống.' });
  } catch (error) {
    console.error('Lỗi khi xóa tuyến đường:', error);
    return res.status(500).json({ message: 'Tuyến đường đang được dùng trong hệ thống Chuyến Đi (Trips), không được phép xóa.' });
  }
};
