# Hệ thống Đặt Vé Xe — Microservices

## Cấu trúc

```
microservices/
├── api-gateway/          ← Cổng vào duy nhất  (port 3000)  ← CỦA BẠN
├── user-service/         ← Auth + User mgmt   (port 3001)  ← CỦA BẠN
├── order-service/        ← Đặt vé + Thanh toán (port 3004) ← CỦA BẠN
├── mock-catalog-service/ ← Giả lập Catalog    (port 3002)  ← XÓA KHI BẠN KIA XONG
├── mock-trip-service/    ← Giả lập Trip       (port 3003)  ← XÓA KHI BẠN KIA XONG
├── init-db/              ← SQL khởi tạo database
└── docker-compose.yml
```

## Cách chạy

### Yêu cầu
- Docker Desktop (Windows): https://www.docker.com/products/docker-desktop/
- Sau khi cài: mở Docker Desktop, đợi nó start

### Lần đầu tiên

```bash
# Clone hoặc copy thư mục microservices về máy
cd microservices

# Build và chạy toàn bộ
docker-compose up --build
```

Đợi khoảng 1-2 phút, thấy log như này là OK:
```
✅ API Gateway chạy trên cổng 3000
✅ User Service chạy trên cổng 3001
✅ Mock Catalog Service chạy trên cổng 3002
✅ Mock Trip Service chạy trên cổng 3003
✅ Order Service chạy trên cổng 3004
```

### Các lần sau
```bash
docker-compose up          # Chạy (không build lại)
docker-compose down        # Dừng
docker-compose down -v     # Dừng + xóa data (reset database)
```

## Test API

Frontend gọi vào **http://localhost:3000** — không gọi thẳng vào service

### Đăng ký
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

  {
    "email": "test@gmail.com",
    "password": "123456",
    "phone": "0123456789",
    "firstName": "A",
    "lastName": "Nguyen Van"
  }
```

### Đăng nhập
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "identity": "test@gmail.com",
  "password": "123456"
}
```
→ Nhận về `accessToken`, dùng cho các request tiếp theo

### Xem danh sách chuyến (cần token)
```http
GET http://localhost:3000/api/trips
Authorization: Bearer <accessToken>
```

### Đặt vé
```http
POST http://localhost:3000/api/bookings
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "tripId": 1,
  "totalAmount": 250000,
  "tickets": [
    {
      "tripSeatId": 3,
      "passengerName": "Nguyen Van A",
      "passengerPhone": "0123456789",
      "pickupStopId": 1,
      "dropoffStopId": 2
    }
  ]
}
```

### Thanh toán (mock)
```http
POST http://localhost:3000/api/payments/1/pay
Authorization: Bearer <accessToken>
```

## Khi bạn kia làm xong Catalog + Trip Service

1. Xóa 2 folder: `mock-catalog-service/` và `mock-trip-service/`
2. Trong `docker-compose.yml`: xóa 2 service mock, thêm service thật của bạn kia
3. Trong `order-service/.env`: đổi URL của TRIP_SERVICE_URL và CATALOG_SERVICE_URL
4. Chạy lại `docker-compose up --build`

## Tài khoản admin mặc định
- Email: admin@busbooking.com
- Password: Admin@123
