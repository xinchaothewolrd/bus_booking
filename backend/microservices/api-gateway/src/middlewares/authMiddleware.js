// middlewares/authMiddleware.js
// API Gateway tự verify JWT bằng SECRET KEY — không cần gọi User Service
// Lý do: Nhanh hơn, không tạo thêm 1 network call cho mỗi request

import jwt from 'jsonwebtoken';

// ── XÁC THỰC TOKEN ────────────────────────────────────────────
// Middleware này gắn thông tin user vào header để service phía sau nhận được
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token không được cung cấp.' });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // Gắn thông tin user vào header để service phía sau dùng
    // Dùng header thay vì body vì proxy sẽ forward toàn bộ header
    req.headers['x-user-id'] = String(decoded.userId);
    req.headers['x-user-role'] = decoded.role;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// ── CHỈ ADMIN ─────────────────────────────────────────────────
export const requireAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
  next();
};
