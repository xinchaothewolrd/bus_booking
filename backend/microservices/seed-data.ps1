# SEED DATA SCRIPT - Tạo toàn bộ dữ liệu mẫu
# Chạy: powershell -File .\seed-data.ps1

$GATEWAY = "http://localhost:3000"
$TOKEN = ""

Write-Host "=== SEED DATA MICROSERVICES ===" -ForegroundColor Cyan

# 1. ĐĂNG KÝ USER & LẤY TOKEN
Write-Host "`n1. Đăng ký user..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    fullName = "Test User"
    phone = "0901234567"
    password = "Password123!"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$GATEWAY/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   Đăng ký user thành công" -ForegroundColor Green
} catch {
    Write-Host "   User đã tồn tại, thử login..." -ForegroundColor Yellow
}

Write-Host "`n2. Đăng nhập lấy token..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Password123!"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "$GATEWAY/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$TOKEN = $login.data.accessToken
Write-Host "   Token: $($TOKEN.Substring(0,20))..." -ForegroundColor Green

$headers = @{
    Authorization = "Bearer $TOKEN"
}

# 3. TẠO ROUTES
Write-Host "`n3. Tạo Routes..." -ForegroundColor Yellow
$routes = @(
    @{ departureLocation = "Sài Gòn"; arrivalLocation = "Đà Lạt"; distanceKm = 300; durationEst = "06:00:00" },
    @{ departureLocation = "Hà Nội"; arrivalLocation = "Sapa"; distanceKm = 380; durationEst = "06:30:00" },
    @{ departureLocation = "TP.HCM"; arrivalLocation = "Nha Trang"; distanceKm = 450; durationEst = "08:00:00" }
)

$routeIds = @()
foreach ($route in $routes) {
    $body = $route | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$GATEWAY/api/routes" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    $routeIds += $res.data.id
    Write-Host "   Route $($route.departureLocation) → $($route.arrivalLocation) (ID: $($res.data.id))" -ForegroundColor Green
}

# 4. TẠO BUS TYPES
Write-Host "`n4. Tạo Bus Types..." -ForegroundColor Yellow
$busTypes = @(
    @{ typeName = "Giường nằm"; totalSeats = 40; seatLayout = @{ rows = 4; cols = 10 } },
    @{ typeName = "Limousine"; totalSeats = 12; seatLayout = @{ rows = 2; cols = 6 } },
    @{ typeName = "Ghế ngồi"; totalSeats = 45; seatLayout = @{ rows = 5; cols = 9 } }
)

$busTypeIds = @()
foreach ($bt in $busTypes) {
    $body = $bt | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$GATEWAY/api/bus-types" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    $busTypeIds += $res.data.id
    Write-Host "   Bus Type: $($bt.typeName) (ID: $($res.data.id))" -ForegroundColor Green
}

# 5. TẠO BUSES
Write-Host "`n5. Tạo Buses..." -ForegroundColor Yellow
$buses = @(
    @{ licensePlate = "51B-12345"; busTypeId = $busTypeIds[0]; driverName = "Nguyễn Văn A"; status = "active" },
    @{ licensePlate = "51B-67890"; busTypeId = $busTypeIds[0]; driverName = "Trần Văn B"; status = "active" },
    @{ licensePlate = "51B-11111"; busTypeId = $busTypeIds[1]; driverName = "Lê Văn C"; status = "active" },
    @{ licensePlate = "51B-22222"; busTypeId = $busTypeIds[2]; driverName = "Phạm Văn D"; status = "active" }
)

$busIds = @()
foreach ($bus in $buses) {
    $body = $bus | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$GATEWAY/api/buses" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    $busIds += $res.data.id
    Write-Host "   Bus: $($bus.licensePlate) (Type ID: $($bus.busTypeId))" -ForegroundColor Green
}

# 6. TẠO ROUTE FARES
Write-Host "`n6. Tạo Route Fares..." -ForegroundColor Yellow
$routeFares = @(
    @{ routeId = $routeIds[0]; busTypeId = $busTypeIds[0]; basePrice = 250000 },
    @{ routeId = $routeIds[0]; busTypeId = $busTypeIds[1]; basePrice = 400000 },
    @{ routeId = $routeIds[0]; busTypeId = $busTypeIds[2]; basePrice = 150000 },
    @{ routeId = $routeIds[1]; busTypeId = $busTypeIds[0]; basePrice = 280000 },
    @{ routeId = $routeIds[1]; busTypeId = $busTypeIds[1]; basePrice = 450000 },
    @{ routeId = $routeIds[2]; busTypeId = $busTypeIds[0]; basePrice = 350000 }
)

foreach ($rf in $routeFares) {
    $body = $rf | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$GATEWAY/api/route-fares" -Method Post -Body $body -ContentType "application/json" -Headers $headers
        Write-Host "   Route $($rf.routeId) - BusType $($rf.busTypeId): $($rf.basePrice) VND" -ForegroundColor Green
    } catch {
        Write-Host "   Route fare đã tồn tại, bỏ qua" -ForegroundColor Gray
    }
}

# 7. TẠO ROUTE STOPS
Write-Host "`n7. Tạo Route Stops..." -ForegroundColor Yellow
$routeStopsData = @(
    @{ routeId = $routeIds[0]; stops = @(
        @{ stopName = "Bến xe Miền Đông"; address = "Quận Bình Thạnh"; stopType = "pickup"; stopOrder = 1; arriveOffsetMinutes = 0 },
        @{ stopName = "Điểm dừng Biên Hòa"; address = "Đồng Nai"; stopType = "both"; stopOrder = 2; arriveOffsetMinutes = 45 },
        @{ stopName = "Đà Lạt Center"; address = "Đà Lạt"; stopType = "dropoff"; stopOrder = 3; arriveOffsetMinutes = 360 }
    )},
    @{ routeId = $routeIds[1]; stops = @(
        @{ stopName = "Bến xe Mỹ Đình"; address = "Hà Nội"; stopType = "pickup"; stopOrder = 1; arriveOffsetMinutes = 0 },
        @{ stopName = "Tam Đảo"; address = "Vĩnh Phúc"; stopType = "both"; stopOrder = 2; arriveOffsetMinutes = 120 },
        @{ stopName = "Sapa Center"; address = "Lào Cai"; stopType = "dropoff"; stopOrder = 3; arriveOffsetMinutes = 390 }
    )}
)

foreach ($routeData in $routeStopsData) {
    foreach ($stop in $routeData.stops) {
        $stop["routeId"] = $routeData.routeId
        $body = $stop | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$GATEWAY/api/route-stops" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    }
    Write-Host "   Route $($routeData.routeId): $($routeData.stops.Count) stops" -ForegroundColor Green
}

# 8. TẠO TRIPS
Write-Host "`n8. Tạo Trips..." -ForegroundColor Yellow
$today = Get-Date
$trips = @(
    @{ routeId = $routeIds[0]; busId = $busIds[0]; departureTime = ($today.AddDays(7)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); arrivalTimeExpected = ($today.AddDays(7).AddHours(6)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); status = "scheduled" },
    @{ routeId = $routeIds[0]; busId = $busIds[1]; departureTime = ($today.AddDays(8)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); arrivalTimeExpected = ($today.AddDays(8).AddHours(6)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); status = "scheduled" },
    @{ routeId = $routeIds[1]; busId = $busIds[2]; departureTime = ($today.AddDays(10)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); arrivalTimeExpected = ($today.AddDays(10).AddHours(6)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); status = "scheduled" },
    @{ routeId = $routeIds[2]; busId = $busIds[3]; departureTime = ($today.AddDays(5)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); arrivalTimeExpected = ($today.AddDays(5).AddHours(8)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z"); status = "scheduled" }
)

$tripIds = @()
foreach ($trip in $trips) {
    $body = $trip | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$GATEWAY/api/trips" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    $tripIds += $res.data.id
    Write-Host "   Trip $($res.data.id): Route $($trip.routeId) - Bus $($trip.busId)" -ForegroundColor Green
}

# 9. TẠO TRIP SEATS (tự động tạo đủ số ghế theo bus type)
Write-Host "`n9. Tạo Trip Seats..." -ForegroundColor Yellow
for ($i=0; $i -lt $tripIds.Count; $i++) {
    $tripId = $tripIds[$i]
    $busTypeId = $buses[$i].busTypeId
    $totalSeats = $busTypes | Where-Object { $_.id -eq $busTypeId } | Select-Object -ExpandProperty totalSeats

    $seatLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    $colCount = [Math]::Ceiling($totalSeats / 10)
    $letterIdx = 0

    for ($row=1; $row -le [Math]::Ceiling($totalSeats / $colCount); $row++) {
        for ($col=1; $col -le $colCount; $col++) {
            if ($letterIdx -ge $seatLetters.Length) { break }
            $seatNumber = "$($seatLetters[$letterIdx])$row"
            $body = @{ tripId = $tripId; seatNumber = $seatNumber; status = "available" } | ConvertTo-Json
            try {
                Invoke-RestMethod -Uri "$GATEWAY/api/trip-seats" -Method Post -Body $body -ContentType "application/json" -Headers $headers | Out-Null
            } catch {
                # Seat đã tồn tại
            }
            $letterIdx++
        }
    }
    Write-Host "   Trip $tripId : $totalSeats ghế" -ForegroundColor Green
}

# 10. TẠO BOOKING MẪU (ORDER SERVICE)
Write-Host "`n10. Tạo Booking mẫu..." -ForegroundColor Yellow
# Chọn trip đầu tiên, lock 3 ghế
$tripId = $tripIds[0]
$seatIds = @()

# Lấy 3 ghế đầu của trip 1
$seats = Invoke-RestMethod -Uri "$GATEWAY/api/trip-seats/trip/$tripId" -Method Get -Headers $headers
$firstThree = $seats[0..2]
foreach ($seat in $firstThree) {
    $seatIds += $seat.id
}

# Lock ghế
$lockBody = @{ seatIds = $seatIds; pendingUntil = ($today.AddMinutes(15)).ToString("yyyy-MM-dd'T'HH:mm:ss.000Z") } | ConvertTo-Json
Invoke-RestMethod -Uri "$GATEWAY/api/trip-seats/lock" -Method Patch -Body $lockBody -ContentType "application/json" -Headers $headers | Out-Null
Write-Host "   Locked 3 seats for trip $tripId" -ForegroundColor Green

# Tạo booking
$bookingBody = @{
    tripId = $tripId
    passengerInfo = @(
        @{ fullName = "Nguyễn Văn X"; email = "passenger1@test.com"; phone = "0911111111" },
        @{ fullName = "Trần Thị Y"; email = "passenger2@test.com"; phone = "0922222222" },
        @{ fullName = "Lê Văn Z"; email = "passenger3@test.com"; phone = "0933333333" }
    )
    totalAmount = 750000
} | ConvertTo-Json -Depth 10

$booking = Invoke-RestMethod -Uri "$GATEWAY/api/bookings" -Method Post -Body $bookingBody -ContentType "application/json" -Headers $headers
Write-Host "   Booking ID: $($booking.data.id)" -ForegroundColor Green

# Book ghế
$bookBody = @{ seatIds = $seatIds } | ConvertTo-Json
Invoke-RestMethod -Uri "$GATEWAY/api/trip-seats/book" -Method Patch -Body $bookBody -ContentType "application/json" -Headers $headers | Out-Null
Write-Host "   Seats booked successfully" -ForegroundColor Green

Write-Host "`n=== SEED DATA HOÀN TẤT ===" -ForegroundColor Cyan
Write-Host "Backend APIs: $GATEWAY"
Write-Host "Frontend: http://localhost:5173"
Write-Host "`nUser login: test@example.com / Password123!" -ForegroundColor Yellow
