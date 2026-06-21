// ============================================================
// MOCK TRIP SERVICE
// Giả lập Trip Service (phần của bạn kia chưa làm)
// Khi bạn kia làm xong → xóa folder này, đổi URL trong .env
// ============================================================

import express from 'express';
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;

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

// ── DỮ LIỆU GIẢ ───────────────────────────────────────────────

const trips = [
  {
    id: 1, route_id: 1, bus_id: 1,
    departure_time: '2026-07-01T08:00:00.000Z',
    arrival_time_expected: '2026-07-01T14:00:00.000Z',
    status: 'scheduled', cancel_policy: null,
    price: 250000,
    route: {
      id: 1,
      departureLocation: 'Sài Gòn',
      arrivalLocation: 'Đà Lạt',
      distanceKm: 300,
      durationEst: '06:00:00'
    },
    bus: {
      id: 1,
      busType: {
        id: 1,
        typeName: 'Giường nằm 40 chỗ',
        seatLayout: {
          cols: 2,
          lower: [],
          upper: []
        }
      }
    },
    created_at: '2026-04-09T19:35:22.000Z',
    updated_at: '2026-04-09T19:35:22.000Z'
  }
];

// Tạo sẵn 40 ghế cho trip id=1 (A01 → A40)
const trip_seats = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  trip_id: 1,
  seat_number: `A${String(i + 1).padStart(2, '0')}`,
  status: i < 2 ? 'booked' : 'available', // A01, A02 đã booked
  pending_until: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// ── ROUTES ────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mock-trip-service' }));

// Lấy danh sách chuyến (có thể filter theo route_id, date)
app.get('/api/trips', (req, res) => {
  const { routeId, status } = req.query;
  let result = [...trips];
  if (routeId) result = result.filter(t => t.route_id === parseInt(routeId));
  if (status) result = result.filter(t => t.status === status);
  res.json(result);
});

app.get('/api/trips/search', (req, res) => {
  // Giả lập trả về dữ liệu đã join giữa Trip và Catalog (Route, BusType) như backend cũ
  const fakeResult = [
    {
      trip_id: 1,
      route_id: 1,
      departure_time: '2026-07-01T08:00:00.000Z',
      arrival_time_expected: '2026-07-01T14:00:00.000Z',
      status: 'scheduled',
      departure_location: 'Sài Gòn',
      arrival_location: 'Đà Lạt',
      bus_type: 'Giường nằm 40 chỗ',
      price: 250000,
      duration: '06:00:00'
    }
  ];
  res.json(fakeResult);
});

app.get('/api/trips/:id', (req, res) => {
  const trip = trips.find(t => t.id === parseInt(req.params.id));
  if (!trip) return res.status(404).json({ message: 'Chuyến không tồn tại' });
  res.json(trip);
});

// Lấy ghế của 1 chuyến
app.get('/api/trip-seats', (req, res) => {
  const { tripId } = req.query;
  const result = tripId ? trip_seats.filter(s => s.trip_id === parseInt(tripId)) : trip_seats;
  res.json(result);
});

app.get('/api/trip-seats/trip/:tripId', (req, res) => {
  const result = trip_seats.filter(s => s.trip_id === parseInt(req.params.tripId));
  res.json(result);
});

app.get('/api/trip-seats/:id', (req, res) => {
  const seat = trip_seats.find(s => s.id === parseInt(req.params.id));
  if (!seat) return res.status(404).json({ message: 'Ghế không tồn tại' });
  res.json(seat);
});

// Frontend gọi API này để KHÓA GHẾ (pending)
app.post('/api/trip-seats/hold', (req, res) => {
  const { tripId, seatNumbers } = req.body;
  if (!seatNumbers || !seatNumbers.length) return res.status(400).json({ message: 'Thiếu seatNumbers' });

  const unavailable = [];
  for (const seatNo of seatNumbers) {
    const seat = trip_seats.find(s => s.seat_number === seatNo && s.trip_id === parseInt(tripId));
    if (!seat) return res.status(404).json({ message: `Ghế ${seatNo} không tồn tại` });
    if (seat.status === 'booked') unavailable.push(seat.seat_number);
  }
  if (unavailable.length > 0) {
    return res.status(409).json({ message: `Ghế ${unavailable.join(', ')} đã có người mua` });
  }

  seatNumbers.forEach(seatNo => {
    const seat = trip_seats.find(s => s.seat_number === seatNo && s.trip_id === parseInt(tripId));
    if (seat) { seat.status = 'pending'; seat.pending_until = new Date(Date.now() + 5 * 60000).toISOString(); }
  });

  res.json({ message: 'Khóa ghế thành công' });
});

// Order Service gọi để KHÓA GHẾ (pending)
app.patch('/api/trip-seats/lock', (req, res) => {
  const { seatIds, pendingUntil } = req.body;
  if (!seatIds || !seatIds.length) return res.status(400).json({ message: 'Thiếu seatIds' });

  const unavailable = [];
  for (const id of seatIds) {
    const seat = trip_seats.find(s => s.id === id);
    if (!seat) return res.status(404).json({ message: `Ghế ID ${id} không tồn tại` });
    if (seat.status === 'booked') unavailable.push(seat.seat_number);
  }
  if (unavailable.length > 0) {
    return res.status(409).json({ message: `Ghế ${unavailable.join(', ')} đã có người mua` });
  }

  seatIds.forEach(id => {
    const seat = trip_seats.find(s => s.id === id);
    if (seat) { seat.status = 'pending'; seat.pending_until = pendingUntil; }
  });

  res.json({ message: 'Khóa ghế thành công' });
});

// Order Service gọi để CHỐT GHẾ (booked) sau khi thanh toán
app.patch('/api/trip-seats/book', (req, res) => {
  const { seatIds } = req.body;
  seatIds.forEach(id => {
    const seat = trip_seats.find(s => s.id === id);
    if (seat) { seat.status = 'booked'; seat.pending_until = null; }
  });
  res.json({ message: 'Đặt ghế thành công' });
});

// Order Service gọi để NHẢ GHẾ (available) khi hủy đơn
app.patch('/api/trip-seats/release', (req, res) => {
  const { seatIds } = req.body;
  if (seatIds) {
    seatIds.forEach(id => {
      const seat = trip_seats.find(s => s.id === id);
      if (seat) { seat.status = 'available'; seat.pending_until = null; }
    });
  }
  res.json({ message: 'Nhả ghế thành công' });
});

// Frontend gọi để NHẢ GHẾ (available) khi bỏ chọn
app.post('/api/trip-seats/release', (req, res) => {
  const { tripId, seatNumbers } = req.body;
  if (seatNumbers) {
    seatNumbers.forEach(seatNo => {
      const seat = trip_seats.find(s => s.seat_number === seatNo && s.trip_id === parseInt(tripId));
      if (seat) { seat.status = 'available'; seat.pending_until = null; }
    });
  }
  res.json({ message: 'Nhả ghế thành công' });
});

app.listen(PORT, () => {
  console.log(`✅ Mock Trip Service chạy trên cổng ${PORT}`);
});
