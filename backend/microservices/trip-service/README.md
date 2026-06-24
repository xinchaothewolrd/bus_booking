# Trip Service

Microservice quản lý chuyến xe và ghế ngồi theo thời gian thực (Real-time seat management).

## APIs

### Trips (Chuyến xe)
- `GET /api/trips` - Lấy tất cả chuyến (include route, bus, busType)
- `GET /api/trips/:id` - Lấy 1 chuyến theo ID (include đầy đủ)
- `POST /api/trips` - Tạo chuyến mới
- `PUT /api/trips/:id` - Cập nhật chuyến
- `DELETE /api/trips/:id` - Xóa chuyến

### Trip Seats (Ghế của chuyến)
- `GET /api/trip-seats` - Lấy tất cả ghế
- `GET /api/trip-seats/:id` - Lấy 1 ghế theo ID
- `GET /api/trip-seats/trip/:tripId` - Lấy tất cả ghế của 1 chuyến
- `POST /api/trip-seats` - Tạo ghế mới (thủ công)
- `PUT /api/trip-seats/:id` - Cập nhật ghế
- `DELETE /api/trip-seats/:id` - Xóa ghế

#### Service-to-Service Endpoints (Order Service gọi)

Các endpoint này dùng để quản lý ghế real-time khi khách hàng đặt vé:

- `PATCH /api/trip-seats/lock` - **Khóa ghế** (available → pending)
  ```json
  {
    "seatIds": [1, 2, 3],
    "pendingUntil": "2024-12-25T10:30:00.000Z"
  }
  ```

- `PATCH /api/trip-seats/book` - **Chốt ghế** (pending → booked) sau khi thanh toán
  ```json
  {
    "seatIds": [1, 2, 3]
  }
  ```

- `PATCH /api/trip-seats/release` - **Nhả ghế** (pending/booked → available) khi hủy đơn
  ```json
  {
    "seatIds": [1, 2, 3]
  }
  ```

## Database

### Tables
- `trips`: Chuyến xe (route_id, bus_id, departure_time, arrival_time_expected, status, cancel_policy)
- `trip_seats`: Ghế theo chuyến (trip_id, seat_number, status: available/pending/booked, pending_until)

## Seat Lifecycle

1. **Available** - Ghế trống, khách có thể chọn
2. **Pending** - Được giữ chờ thanh toán (10 phút), `pending_until` set thời gian hết hạn
3. **Booked** - Đã thanh toán thành công

## Setup

1. Copy `.env.example` to `.env` và cấu hình database
2. Run: `npm install`
3. Run: `npm start` hoặc `npm run dev`

## Docker

```bash
docker-compose up trip-service
```

Service sẽ chạy trên port 3003 (mặc định).

## Notes

- Trip Service giao tiếp với Catalog Service để lấy thông tin route và bus
- Trip Service giao tiếp với Order Service thông qua các endpoint lock/book/release
- Cần có cron job để cleanup các ghế pending hết hạn (optional - có thể để Order Service xử lý)
