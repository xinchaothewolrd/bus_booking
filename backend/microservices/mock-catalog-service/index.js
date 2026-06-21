// ============================================================
// MOCK CATALOG SERVICE
// Giả lập Catalog Service (phần của bạn kia chưa làm)
// Khi bạn kia làm xong → xóa folder này, đổi URL trong .env
// ============================================================

import express from 'express';
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// 🔧 Middleware để convert snake_case → camelCase (match backend cũ)
const snakeToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }
  if (obj && typeof obj === 'object') {
    const newObj = {};
    Object.keys(obj).forEach(key => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      newObj[camelKey] = obj[key];
    });
    return newObj;
  }
  return obj;
};

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    return originalJson.call(this, snakeToCamel(data));
  };
  next();
});

// ── DỮ LIỆU GIẢ (copy từ database thật của bạn) ──────────────

const routes = [
  { id: 1, departure_location: 'Sài Gòn', arrival_location: 'Đà Lạt', distance_km: 300, duration_est: '06:00:00' }
];

const bus_types = [
  { id: 1, type_name: 'Giường nằm 40 chỗ', total_seats: 40, seat_layout: null }
];

const buses = [];

const route_stops = [
  { id: 1, route_id: 1, stop_name: 'Bến xe Phan Rang', address: 'Thống Nhất, Đài Sơn, Ninh Thuận', stop_type: 'pickup', stop_order: 1, arrive_offset_minutes: 0 },
  { id: 2, route_id: 1, stop_name: 'Bến xe Miền Đông mới', address: 'TP Hồ Chí Minh', stop_type: 'dropoff', stop_order: 2, arrive_offset_minutes: 20 }
];

const route_fares = [];
const price_rules = [];

// ── ROUTES ────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mock-catalog-service' }));

// Lấy tất cả tuyến đường
app.get('/api/routes', (req, res) => res.json(routes));
app.get('/api/routes/:id', (req, res) => {
  const route = routes.find(r => r.id === parseInt(req.params.id));
  if (!route) return res.status(404).json({ message: 'Tuyến không tồn tại' });
  res.json(route);
});

// Lấy tất cả loại xe
app.get('/api/bus-types', (req, res) => res.json(bus_types));
app.get('/api/bus-types/:id', (req, res) => {
  const bt = bus_types.find(b => b.id === parseInt(req.params.id));
  if (!bt) return res.status(404).json({ message: 'Loại xe không tồn tại' });
  res.json(bt);
});

// Lấy tất cả xe
app.get('/api/buses', (req, res) => res.json(buses));
app.get('/api/buses/:id', (req, res) => {
  const bus = buses.find(b => b.id === parseInt(req.params.id));
  if (!bus) return res.status(404).json({ message: 'Xe không tồn tại' });
  res.json(bus);
});

// Lấy điểm dừng theo tuyến
app.get('/api/route-stops', (req, res) => {
  const { routeId } = req.query;
  const result = routeId ? route_stops.filter(s => s.route_id === parseInt(routeId)) : route_stops;
  res.json(result);
});
app.get('/api/route-stops/routes/:routeId', (req, res) => {
  const result = route_stops.filter(s => s.route_id === parseInt(req.params.routeId));
  res.json(result);
});
app.get('/api/route-stops/:id', (req, res) => {
  const stop = route_stops.find(s => s.id === parseInt(req.params.id));
  if (!stop) return res.status(404).json({ message: 'Điểm dừng không tồn tại' });
  res.json(stop);
});

// Lấy bảng giá vé
app.get('/api/route-fares', (req, res) => res.json(route_fares));
app.get('/api/price-rules', (req, res) => res.json(price_rules));

app.listen(PORT, () => {
  console.log(`✅ Mock Catalog Service chạy trên cổng ${PORT}`);
});
