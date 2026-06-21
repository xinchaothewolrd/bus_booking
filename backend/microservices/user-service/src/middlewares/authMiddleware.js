// middlewares/authMiddleware.js — Xác thực trong User Service
// 🔧 Nhận thông tin user từ API Gateway headers (API Gateway đã verify JWT)

import User from '../models/User.js';

// ── Middleware: Lấy user từ header gắn bởi API Gateway ──────────────
// Thay vì verify JWT, chỉ lấy userId từ x-user-id header
// Vì API Gateway đã verify JWT rồi, không cần verify lại
export const protectedRoute = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (!userId) {
      return res.status(401).json({ message: 'Access Token không được cung cấp hoặc không hợp lệ.' });
    }

    // Lấy user từ DB để kiểm tra trạng thái
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User không tồn tại.' });
    }
    if (user.status === 'banned') {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }

    // Gắn user và role vào req để controller dùng
    req.user = user;
    req.userRole = userRole;
    next();
  } catch (error) {
    console.error('Lỗi xác thực:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

// ── Middleware: Chỉ Admin được truy cập ──────────────────────────────
export const requireAdmin = (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
  }
  next();
};
