// API Gateway — server.js
// ============================================================
// Đây là CỬA VÀO DUY NHẤT của toàn bộ hệ thống
// Frontend chỉ biết địa chỉ của Gateway, không biết địa chỉ các service
//
// Luồng hoạt động:
//   Client → API Gateway (verify JWT) → Service tương ứng → trả về Client
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyToken } from './middlewares/authMiddleware.js';
import {fixRequestBody} from 'http-proxy-middleware';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


// ── ĐỊACHỈ CÁC SERVICE (đọc từ .env) ─────────────────────────
const SERVICES = {
  USER:    process.env.USER_SERVICE_URL    || 'http://user-service:3001',
  ORDER:   process.env.ORDER_SERVICE_URL   || 'http://order-service:3004',
  CATALOG: process.env.CATALOG_SERVICE_URL || 'http://mock-catalog-service:3002',
  TRIP:    process.env.TRIP_SERVICE_URL    || 'http://mock-trip-service:3003',
};

// ── MIDDLEWARE TOÀN CỤC ───────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Health check của chính Gateway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', services: SERVICES });
});

// ── HÀM TẠO PROXY ────────────────────────────────────────────
// pathRewrite: bỏ prefix /api/gateway nếu có, giữ nguyên đường dẫn
// const proxy = (target) => createProxyMiddleware({
//   target,
//   changeOrigin: true,
//   pathRewrite: (path, req) => path,
//   on: {
//     proxyReq: fixRequestBody, // Đảm bảo body được gửi đúng cách
//     error: (err, req, res) => {
//       console.error(`❌ Proxy lỗi tới ${target}:`, err.message);
//       res.status(502).json({ message: 'Service tạm thời không khả dụng. Vui lòng thử lại.' });
//     }
//   }
// });
const proxy = (target) => createProxyMiddleware({
  target,
  changeOrigin: true,
  // BẮT BUỘC CÓ DÒNG NÀY: Trả về nguyên vẹn path gốc (req.originalUrl)
  // thay vì dùng path đã bị Express biến đổi
  pathRewrite: (path, req) => req.originalUrl,
  on: {
    proxyReq: fixRequestBody, // Sửa lỗi nuốt body JSON
    error: (err, req, res) => {
      console.error(`❌ Proxy lỗi tới ${target}:`, err.message);
      res.status(502).json({ message: 'Service tạm thời không khả dụng. Vui lòng thử lại.' });
    }
  }
});

// ============================================================
// ROUTING — Quy tắc đơn giản:
//   PUBLIC route (không cần đăng nhập) → proxy thẳng
//   PROTECTED route (cần đăng nhập)    → verifyToken → proxy
// ============================================================

// ── USER SERVICE ROUTES ───────────────────────────────────────
// Public: đăng ký, đăng nhập, refresh token
app.use('/api/auth', proxy(SERVICES.USER));

// Protected: quản lý thông tin user
app.use('/api/users', verifyToken, proxy(SERVICES.USER));

// ── ORDER SERVICE ROUTES ──────────────────────────────────────
app.use('/api/bookings', verifyToken, proxy(SERVICES.ORDER));
app.use('/api/tickets',  verifyToken, proxy(SERVICES.ORDER));
app.use('/api/payments/vnpay-return', proxy(SERVICES.ORDER));
app.use('/api/payments', verifyToken, proxy(SERVICES.ORDER));

// ── CATALOG SERVICE ROUTES (bạn kia làm, hiện dùng mock) ──────
app.use('/api/routes',      verifyToken, proxy(SERVICES.CATALOG));
app.use('/api/bus-types',   verifyToken, proxy(SERVICES.CATALOG));
app.use('/api/buses',       verifyToken, proxy(SERVICES.CATALOG));
app.use('/api/route-stops', verifyToken, proxy(SERVICES.CATALOG));
app.use('/api/route-fares', verifyToken, proxy(SERVICES.CATALOG));
app.use('/api/price-rules', verifyToken, proxy(SERVICES.CATALOG));

// ── TRIP SERVICE ROUTES (bạn kia làm, hiện dùng mock) ─────────
app.use('/api/trips',       verifyToken, proxy(SERVICES.TRIP));
app.use('/api/trip-seats',  verifyToken, proxy(SERVICES.TRIP));

// ── 404 FALLBACK ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ── KHỞI ĐỘNG ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ API Gateway chạy trên cổng ${PORT}`);
  console.log(`   User Service    → ${SERVICES.USER}`);
  console.log(`   Order Service   → ${SERVICES.ORDER}`);
  console.log(`   Catalog Service → ${SERVICES.CATALOG}`);
  console.log(`   Trip Service    → ${SERVICES.TRIP}`);
});
