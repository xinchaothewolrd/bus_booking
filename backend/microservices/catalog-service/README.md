# Catalog Service

Microservice quản lý danh mục: tuyến đường, loại xe, xe khách, bảng giá, quy tắc giá.

## APIs

### Routes (Tuyến đường)
- `GET /api/routes` - Lấy tất cả tuyến đường
- `GET /api/routes/:id` - Lấy 1 tuyến theo ID
- `POST /api/routes` - Tạo tuyến mới
- `PUT /api/routes/:id` - Cập nhật tuyến
- `DELETE /api/routes/:id` - Xóa tuyến

### Route Stops (Điểm dừng)
- `GET /api/route-stops` - Lấy tất cả điểm dừng (có thể filter `?routeId=`)
- `GET /api/route-stops/:id` - Lấy 1 điểm dừng
- `POST /api/route-stops` - Thêm điểm dừng
- `PUT /api/route-stops/:id` - Cập nhật điểm dừng
- `DELETE /api/route-stops/:id` - Xóa điểm dừng

### Bus Types (Loại xe)
- `GET /api/bus-types` - Lấy tất cả loại xe
- `GET /api/bus-types/:id` - Lấy 1 loại xe
- `POST /api/bus-types` - Tạo loại xe mới
- `PUT /api/bus-types/:id` - Cập nhật loại xe
- `DELETE /api/bus-types/:id` - Xóa loại xe

### Buses (Xe khách)
- `GET /api/buses` - Lấy tất cả xe (include busType)
- `GET /api/buses/:id` - Lấy 1 xe (include busType)
- `POST /api/buses` - Thêm xe mới
- `PUT /api/buses/:id` - Cập nhật xe
- `DELETE /api/buses/:id` - Xóa xe

### Route Fares (Bảng giá vé)
- `GET /api/route-fares` - Lấy tất cả mức giá (include route & busType)
- `GET /api/route-fares/:id` - Lấy 1 mức giá
- `POST /api/route-fares` - Tạo mức giá (routeId + busTypeId + basePrice)
- `PUT /api/route-fares/:id` - Cập nhật mức giá
- `DELETE /api/route-fares/:id` - Xóa mức giá

### Price Rules (Quy tắc giá - Dynamic Pricing)
- `GET /api/price-rules` - Lấy tất cả rules (include route & busType)
- `GET /api/price-rules/active` - Lấy rules đang active (trong khoảng thời gian hiện tại)
- `GET /api/price-rules/:id` - Lấy 1 rule
- `POST /api/price-rules` - Tạo rule mới
- `PUT /api/price-rules/:id` - Cập nhật rule
- `DELETE /api/price-rules/:id` - Xóa rule

## Database

### Tables
- `routes`: Tuyến đường (departure_location, arrival_location, distance_km, duration_est)
- `route_stops`: Điểm dừng trên tuyến
- `bus_types`: Loại xe (type_name, total_seats, seat_layout JSON)
- `buses`: Xe khách (license_plate, bus_type_id, driver_name, status)
- `route_fares`: Bảng giá (route_id, bus_type_id, base_price)
- `price_rules`: Quy tắc giá (dynamic pricing)

## Setup

1. Copy `.env.example` to `.env` và cấu hình database
2. Run: `npm install`
3. Run: `npm start` hoặc `npm run dev`

## Docker

```bash
docker-compose up catalog-service
```

Service sẽ chạy trên port 3002 (mặc định).
