// middlewares/authMiddleware.js — Order Service
// Lấy thông tin user từ API Gateway headers

export const requireAdmin = (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
  }
  next();
};

// Optional: Kiểm tra user ownership (user chỉ được xem booking của chính họ)
export const protectedRoute = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Access Token không hợp lệ.' });
  }
  next();
};
