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
import { createServer } from 'http';
import { Server } from 'socket.io';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo HTTP Server và Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

// ── SOCKET.IO LOGIC ───────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.on('join-trip', (tripId) => {
    socket.join(`trip_${tripId}`);
    console.log(`👤 Client ${socket.id} joined room: trip_${tripId}`);
  });

  socket.on('leave-trip', (tripId) => {
    socket.leave(`trip_${tripId}`);
    console.log(`👤 Client ${socket.id} left room: trip_${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Endpoint nội bộ để Trip Service gọi lên Gateway khi có ghế thay đổi
app.post('/api/internal/notify-seat', express.json(), (req, res) => {
  const { tripId, seatId, seatNumber, status, pendingUntil } = req.body;
  if (!tripId || !seatId) {
    return res.status(400).json({ error: 'Missing tripId or seatId' });
  }

  // Phát tín hiệu tới tất cả màn hình đang xem chuyến xe này
  io.to(`trip_${tripId}`).emit('seat-updated', {
    id: seatId,
    tripId,
    seatNumber,
    status,
    pendingUntil
  });
  
  res.json({ success: true, message: `Broadcasted update for seat ${seatId}` });
});

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
  xfwd: true,
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
app.get('/api/trips/search', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    if (!from || !to || !date) return res.json([]);

    // 1. Fetch routes
    const routesReq = await fetch(`${SERVICES.CATALOG}/api/routes`);
    const routesData = await routesReq.json();
    const routes = routesData.data || routesData || [];
    
    const matchingRoutes = routes.filter(r => 
      (r.departureLocation || '').toLowerCase() === from.toLowerCase() &&
      (r.arrivalLocation || '').toLowerCase() === to.toLowerCase()
    );
    if (matchingRoutes.length === 0) return res.json([]);
    const routeIds = matchingRoutes.map(r => r.id);

    // 2. Fetch trips
    const tripsReq = await fetch(`${SERVICES.TRIP}/api/trips`);
    const tripsData = await tripsReq.json();
    const trips = tripsData.data || tripsData || [];
    
    const targetDate = new Date(date).toISOString().split('T')[0];
    const matchingTrips = trips.filter(t => {
      const tTime = t.departureTime || t.departure_time;
      if (!tTime) return false;
      
      // Chuyển tTime sang giờ Việt Nam (UTC+7) để lấy ngày chính xác
      const tTimeObj = new Date(tTime);
      const tripDate = new Date(tTimeObj.getTime() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      return routeIds.includes(t.routeId || t.route_id) && tripDate === targetDate;
    });
    if (matchingTrips.length === 0) return res.json([]);

    // 3. Enrich
    const [busesReq, busTypesReq, faresReq] = await Promise.all([
      fetch(`${SERVICES.CATALOG}/api/buses`),
      fetch(`${SERVICES.CATALOG}/api/bus-types`),
      fetch(`${SERVICES.CATALOG}/api/route-fares`)
    ]);
    const busesData = await busesReq.json();
    const busTypesData = await busTypesReq.json();
    const faresData = await faresReq.json();

    const buses = busesData.data || busesData || [];
    const busTypes = busTypesData.data || busTypesData || [];
    const fares = faresData.data || faresData || [];

    const results = matchingTrips.map(trip => {
      const rId = trip.routeId || trip.route_id;
      const bId = trip.busId || trip.bus_id;
      const r = matchingRoutes.find(route => route.id === rId);
      const b = buses.find(bus => bus.id === bId);
      const btId = b ? (b.busTypeId || b.bus_type_id) : null;
      const bt = btId ? busTypes.find(type => type.id === btId) : null;
      
      const fare = fares.find(f => 
        (f.routeId == rId || f.route_id == rId) && 
        (f.busTypeId == btId || f.bus_type_id == btId)
      );
      
      const basePrice = fare ? (fare.basePrice || fare.base_price) : 250000;

      return {
        ...trip,
        // Dành cho Web Frontend (camelCase)
        departureLocation: r.departureLocation,
        arrivalLocation: r.arrivalLocation,
        distanceKm: r.distanceKm || r.distance_km,
        duration: r.durationEst || r.duration_est,
        busType: bt ? bt.typeName : 'Xe giường nằm',
        price: Number(basePrice), // Web sẽ dùng .toLocaleString()
        
        // Dành cho Android (snake_case map bằng @SerializedName)
        trip_id: trip.id,
        route_id: rId,
        departure_location: r.departureLocation,
        arrival_location: r.arrivalLocation,
        departure_time: trip.departureTime || trip.departure_time,
        arrival_time_expected: trip.arrivalTimeExpected || trip.arrival_time_expected || null,
        bus_type: bt ? bt.typeName : 'Xe giường nằm'
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search error' });
  }
});

app.get('/api/trips/:id', async (req, res, next) => {
  if (req.params.id === 'search') return next();
  try {
    const tripReq = await fetch(`${SERVICES.TRIP}/api/trips/${req.params.id}`);
    if (!tripReq.ok) return next();
    
    const tripData = await tripReq.json();
    const trip = tripData.data || tripData;
    if (!trip || (!trip.routeId && !trip.route_id)) return next();

    const rId = trip.routeId || trip.route_id;
    const bId = trip.busId || trip.bus_id;

    const [routeReq, busReq, busTypesReq, faresReq] = await Promise.all([
      fetch(`${SERVICES.CATALOG}/api/routes/${rId}`),
      fetch(`${SERVICES.CATALOG}/api/buses/${bId}`),
      fetch(`${SERVICES.CATALOG}/api/bus-types`),
      fetch(`${SERVICES.CATALOG}/api/route-fares`)
    ]);

    const routeData = await routeReq.json();
    const r = routeData.data || routeData || {};

    const busData = await busReq.json();
    const b = busData.data || busData || {};

    const busTypesData = await busTypesReq.json();
    const busTypes = busTypesData.data || busTypesData || [];

    const faresData = await faresReq.json();
    const fares = faresData.data || faresData || [];

    const btId = b.busTypeId || b.bus_type_id;
    const bt = btId ? busTypes.find(type => type.id === btId) : null;
      
    const fare = fares.find(f => 
      (f.routeId == rId || f.route_id == rId) && 
      (f.busTypeId == btId || f.bus_type_id == btId)
    );
      
    const basePrice = fare ? (fare.basePrice || fare.base_price) : 250000;

    res.json({
      ...trip,
      route: {
        id: rId,
        departureLocation: r.departureLocation,
        arrivalLocation: r.arrivalLocation,
        distanceKm: r.distanceKm || r.distance_km,
        durationEst: r.durationEst || r.duration_est,
      },
      bus: {
        ...b,
        busType: bt
      },
      busType: bt ? bt.typeName : 'Xe giường nằm',
      price: basePrice
    });
  } catch (error) {
    next();
  }
});

app.get('/api/trips', async (req, res, next) => {
  try {
    const tripsReq = await fetch(`${SERVICES.TRIP}/api/trips`);
    if (!tripsReq.ok) return next();
    const tripsData = await tripsReq.json();
    const trips = tripsData.data || tripsData || [];

    const routesReq = await fetch(`${SERVICES.CATALOG}/api/routes`);
    const routesData = await routesReq.json();
    const routes = routesData.data || routesData || [];

    const results = trips.map(trip => {
      const rId = trip.routeId || trip.route_id;
      const r = routes.find(route => route.id === rId);
      return {
        ...trip,
        route: r ? {
          departureLocation: r.departureLocation || r.departure_location,
          arrivalLocation: r.arrivalLocation || r.arrival_location,
        } : null
      };
    });

    res.json(results);
  } catch (error) {
    next();
  }
});

app.use('/api/trips',       verifyToken, proxy(SERVICES.TRIP));
app.use('/api/trip-seats',  verifyToken, proxy(SERVICES.TRIP));

// ── 404 FALLBACK ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ── KHỞI ĐỘNG ─────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✅ API Gateway chạy trên cổng ${PORT}`);
  console.log(`   User Service    → ${SERVICES.USER}`);
  console.log(`   Order Service   → ${SERVICES.ORDER}`);
  console.log(`   Catalog Service → ${SERVICES.CATALOG}`);
  console.log(`   Trip Service    → ${SERVICES.TRIP}`);
});
