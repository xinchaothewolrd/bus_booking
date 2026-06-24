import Bus from '../models/Bus.js';
import BusType from '../models/BusType.js';

export const getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.findAll({
      include: [{ model: BusType, as: 'busType' }],
    });
    return res.status(200).json(buses);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách xe khách:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống.' });
  }
};

export const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id, {
      include: [{ model: BusType, as: 'busType' }],
    });
    if (!bus) return res.status(404).json({ message: 'Không tìm thấy xe này.' });
    return res.status(200).json(bus);
  } catch (error) {
    console.error('Lỗi khi lấy xe khách:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống.' });
  }
};

export const createBus = async (req, res) => {
  try {
    const { licensePlate, busTypeId, driverName, status, maintenanceNote } = req.body;

    if (!licensePlate || !busTypeId) {
      return res.status(400).json({ message: 'Biển số và Mã Loại Xe là bắt buộc.' });
    }

    const busTypeExists = await BusType.findByPk(busTypeId);
    if (!busTypeExists) {
      return res.status(404).json({ message: 'Mã loại xe (busTypeId) không hợp lệ.' });
    }

    const newBus = await Bus.create({
      licensePlate,
      busTypeId,
      driverName: driverName || null,
      status: status || 'active',
      maintenanceNote: maintenanceNote || null,
    });

    return res.status(201).json({ message: 'Nhập xe thành công!', data: newBus });
  } catch (error) {
    console.error('Lỗi khi tạo xe khách:', error);
    return res.status(500).json({ message: 'Lỗi tạo xe (có thể do biển số đã bị trùng).' });
  }
};

export const updateBus = async (req, res) => {
  try {
    const { licensePlate, busTypeId, driverName, status, maintenanceNote } = req.body;
    const bus = await Bus.findByPk(req.params.id);

    if (!bus) return res.status(404).json({ message: 'Xe không tồn tại.' });

    await bus.update({
      licensePlate,
      busTypeId,
      driverName,
      status,
      maintenanceNote,
    });

    return res.status(200).json({ message: 'Đã cập nhật xe thành công.', data: bus });
  } catch (error) {
    console.error('Lỗi khi cập nhật xe khách:', error);
    return res.status(500).json({ message: 'Lỗi update (lưu ý biển số không được trùng xe khác).' });
  }
};

export const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findByPk(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Không tìm thấy xe.' });

    await bus.destroy();
    return res.status(200).json({ message: 'Xe khách đã được xóa khỏi hệ thống.' });
  } catch (error) {
    console.error('Lỗi khi xóa xe khách:', error);
    return res.status(500).json({ message: 'Không thể xóa vì xe đang hoạt động trong Chuyến Đi.' });
  }
};
