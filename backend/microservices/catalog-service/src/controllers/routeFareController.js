import RouteFare from '../models/RouteFare.js';
import Route from '../models/Route.js';
import BusType from '../models/BusType.js';

export const getAllRouteFares = async (req, res) => {
  try {
    const fares = await RouteFare.findAll({
      include: [
        { model: Route, as: 'route' },
        { model: BusType, as: 'busType' },
      ],
    });
    return res.status(200).json(fares);
  } catch (error) {
    console.error('Lỗi lấy bảng giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const getRouteFareById = async (req, res) => {
  try {
    const fare = await RouteFare.findByPk(req.params.id, {
      include: [
        { model: Route, as: 'route' },
        { model: BusType, as: 'busType' },
      ],
    });
    if (!fare) return res.status(404).json({ message: 'Không tìm thấy mức giá này.' });
    return res.status(200).json(fare);
  } catch (error) {
    console.error('Lỗi lấy mức giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const createRouteFare = async (req, res) => {
  try {
    const { routeId, busTypeId, basePrice } = req.body;

    if (!routeId || !busTypeId || basePrice === undefined) {
      return res.status(400).json({ message: 'Cần có routeId, busTypeId và basePrice.' });
    }

    const route = await Route.findByPk(routeId);
    const busType = await BusType.findByPk(busTypeId);
    if (!route) return res.status(404).json({ message: 'Tuyến đường không tồn tại.' });
    if (!busType) return res.status(404).json({ message: 'Loại xe không tồn tại.' });

    const newFare = await RouteFare.create({ routeId, busTypeId, basePrice });

    return res.status(201).json({ message: 'Tạo mức giá thành công!', data: newFare });
  } catch (error) {
    console.error('Lỗi tạo mức giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống (cặp tuyến + loại xe này có thể đã có giá rồi).' });
  }
};

export const updateRouteFare = async (req, res) => {
  try {
    const { basePrice } = req.body;
    const fare = await RouteFare.findByPk(req.params.id);

    if (!fare) return res.status(404).json({ message: 'Không tìm thấy mức giá.' });

    await fare.update({ basePrice });

    return res.status(200).json({ message: 'Cập nhật mức giá thành công.', data: fare });
  } catch (error) {
    console.error('Lỗi cập nhật mức giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const deleteRouteFare = async (req, res) => {
  try {
    const fare = await RouteFare.findByPk(req.params.id);
    if (!fare) return res.status(404).json({ message: 'Không tìm thấy mức giá.' });

    await fare.destroy();
    return res.status(200).json({ message: 'Đã xóa mức giá.' });
  } catch (error) {
    console.error('Lỗi xóa mức giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};
