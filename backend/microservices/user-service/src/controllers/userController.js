// controllers/userController.js — Quản lý thông tin user

import User from '../models/User.js';

// GET /api/users/me — Lấy thông tin bản thân (req.user gắn bởi middleware)
export const getMe = async (req, res) => {
  const user = {
    id: req.user.id,
    fullName: req.user.full_name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone
  };
  return res.status(200).json({ user });
};

// GET /api/users — Lấy tất cả users (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ order: [['createdAt', 'DESC']] });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy danh sách user.' });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại.' });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy thông tin user.' });
  }
};

// PATCH /api/users/:id — Cập nhật thông tin user (Admin)
export const updateUser = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại.' });

    const { full_name, phone, status, role } = req.body;
    if (full_name) user.full_name = full_name;
    if (phone) user.phone = phone;
    if (status) user.status = status;    // Admin mới được đổi status
    if (role) user.role = role;          // Admin mới được đổi role

    await user.save();
    return res.status(200).json({ message: 'Cập nhật thành công.', data: user });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi cập nhật user.' });
  }
};

// DELETE /api/users/:id — Admin xóa user
export const deleteUser = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại.' });
    await user.destroy();
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi xóa user.' });
  }
};

// POST /api/users — Admin tạo user mới
export const createUser = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { email, phone, full_name, password, role, status } = req.body;

    if (!email || !phone || !full_name || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin: email, phone, full_name, password' });
    }

    // Kiểm tra email/phone trùng
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email đã tồn tại.' });

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) return res.status(409).json({ message: 'Số điện thoại đã tồn tại.' });

    // Tạo user mới
    const newUser = await User.create({
      email,
      phone,
      full_name,
      password_hash: password, // TODO: hash password trước khi lưu
      role: role || 'customer',
      status: status || 'active',
    });

    return res.status(201).json({ message: 'Tạo user thành công.', data: newUser });
  } catch (err) {
    console.error('Lỗi tạo user:', err);
    return res.status(500).json({ message: 'Lỗi tạo user.' });
  }
};

// PATCH /api/users/:id/status — Admin thay đổi trạng thái user
export const updateUserStatus = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { status } = req.body;
    if (!status || !['active', 'banned'].includes(status)) {
      return res.status(400).json({ message: 'Status phải là "active" hoặc "banned".' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại.' });

    user.status = status;
    await user.save();

    return res.status(200).json({ message: 'Cập nhật trạng thái thành công.', data: user });
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái:', err);
    return res.status(500).json({ message: 'Lỗi cập nhật trạng thái user.' });
  }
};
