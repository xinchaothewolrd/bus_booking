// libs/httpClient.js
// Thay thế cho Axios/Fetch — gọi sang Trip Service khi cần khóa/nhả ghế
// Dùng fetch có sẵn trong Node 18+, không cần cài thêm gì

const TRIP_SERVICE = process.env.TRIP_SERVICE_URL || 'http://mock-trip-service:3003';
const CATALOG_SERVICE = process.env.CATALOG_SERVICE_URL || 'http://mock-catalog-service:3002';

async function callService(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message || `Lỗi gọi service: ${url}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

// ── TRIP SERVICE ──────────────────────────────────────────────
export const tripService = {
  // Lấy thông tin 1 chuyến
  getTrip: (tripId) => callService(`${TRIP_SERVICE}/api/trips/${tripId}`),

  // Lấy ghế của chuyến
  getSeats: (tripId) => callService(`${TRIP_SERVICE}/api/trip-seats?tripId=${tripId}`),

  // Khóa ghế (pending) khi bắt đầu đặt vé
  lockSeats: (seatIds, pendingUntil) =>
    callService(`${TRIP_SERVICE}/api/trip-seats/lock`, 'PATCH', { seatIds, pendingUntil }),

  // Chốt ghế (booked) sau khi thanh toán
  bookSeats: (seatIds) =>
    callService(`${TRIP_SERVICE}/api/trip-seats/book`, 'PATCH', { seatIds }),

  // Nhả ghế (available) khi hủy đơn
  releaseSeats: (seatIds) =>
    callService(`${TRIP_SERVICE}/api/trip-seats/release`, 'PATCH', { seatIds }),
};

// ── CATALOG SERVICE ───────────────────────────────────────────
export const catalogService = {
  // Lấy thông tin điểm dừng (validate pickup/dropoff)
  getRouteStop: (stopId) => callService(`${CATALOG_SERVICE}/api/route-stops/${stopId}`),
  getRoute: (routeId) => callService(`${CATALOG_SERVICE}/api/routes/${routeId}`),
};

// ── USER SERVICE ──────────────────────────────────────────────
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3001';

export const userService = {
  // Lấy thông tin user theo ID (internal call, không cần JWT)
  getUser: (userId) => callService(`${USER_SERVICE}/api/users/${userId}/internal`),
};