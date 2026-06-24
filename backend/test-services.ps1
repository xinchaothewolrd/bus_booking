# TEST SCRIPT - Catalog & Trip Services
# Chạy trong PowerShell

Write-Host "=== TEST CATALOG SERVICE ===" -ForegroundColor Green

# 1. Lấy tất cả routes (ban đầu rỗng)
Write-Host "`n1. GET /api/routes" -ForegroundColor Yellow
curl http://localhost:3002/api/routes

# 2. Tạo route mới
Write-Host "`n2. POST /api/routes" -ForegroundColor Yellow
$routeBody = @{
    departure_location = "Sài Gòn"
    arrival_location = "Đà Lạt"
    distance_km = 300
    duration_est = "06:00:00"
} | ConvertTo-Json
curl -X POST http://localhost:3002/api/routes -H "Content-Type: application/json" -Body $routeBody

# 3. Lấy bus types
Write-Host "`n3. GET /api/bus-types" -ForegroundColor Yellow
curl http://localhost:3002/api/bus-types

Write-Host "`n=== TEST TRIP SERVICE ===" -ForegroundColor Green

# 4. Tạo trip mới (lưu ý: cần có route_id, bus_id từ Catalog)
Write-Host "`n4. POST /api/trips" -ForegroundColor Yellow
$tripBody = @{
    route_id = 1
    bus_id = 1
    departure_time = "2026-07-01T08:00:00.000Z"
    arrival_time_expected = "2026-07-01T14:00:00.000Z"
    status = "scheduled"
} | ConvertTo-Json
curl -X POST http://localhost:3003/api/trips -H "Content-Type: application/json" -Body $tripBody

# 5. Lấy tất cả trips
Write-Host "`n5. GET /api/trips" -ForegroundColor Yellow
curl http://localhost:3003/api/trips

Write-Host "`n6. Tạo ghế cho trip 1" -ForegroundColor Yellow
$seatBody = @{
    trip_id = 1
    seat_number = "A1"
    status = "available"
} | ConvertTo-Json
1..40 | ForEach-Object {
    curl -X POST http://localhost:3003/api/trip-seats -H "Content-Type: application/json" -Body $seatBody
}

Write-Host "`n7. Lấy ghế của trip 1" -ForegroundColor Yellow
curl http://localhost:3003/api/trip-seats/trip/1

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Green
