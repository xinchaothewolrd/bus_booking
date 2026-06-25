-- =====================================================
-- Catalog Service Database Schema
-- Chứa: routes, route_stops, bus_types, buses, route_fares, price_rules
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `price_rules`;
DROP TABLE IF EXISTS `route_fares`;
DROP TABLE IF EXISTS `buses`;
DROP TABLE IF EXISTS `bus_types`;
DROP TABLE IF EXISTS `route_stops`;
DROP TABLE IF EXISTS `routes`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. TUYẾN ĐƯỜNG (Routes)
-- =====================================================
CREATE TABLE `routes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `departure_location` varchar(100) NOT NULL,
  `arrival_location` varchar(100) NOT NULL,
  `distance_km` int DEFAULT NULL,
  `duration_est` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. ĐIỂM DỪNG (Route Stops)
-- =====================================================
CREATE TABLE `route_stops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `stop_name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `stop_type` varchar(50) NOT NULL COMMENT 'pickup, dropoff, both',
  `stop_order` int NOT NULL,
  `arrive_offset_minutes` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_route_stops_route` (`route_id`),
  CONSTRAINT `route_stops_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. LOẠI XE (Bus Types)
-- =====================================================
CREATE TABLE `bus_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `total_seats` int NOT NULL,
  `seat_layout` json DEFAULT NULL COMMENT 'JSON cấu trúc ghế để Frontend render UI',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. XE KHÁCH (Buses)
-- =====================================================
CREATE TABLE `buses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `license_plate` varchar(20) NOT NULL,
  `bus_type_id` int NOT NULL,
  `driver_name` varchar(100) DEFAULT NULL,
  `status` enum('active','maintenance') NOT NULL DEFAULT 'active',
  `maintenance_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `license_plate` (`license_plate`),
  KEY `idx_bus_type` (`bus_type_id`),
  CONSTRAINT `buses_ibfk_1` FOREIGN KEY (`bus_type_id`) REFERENCES `bus_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. BẢNG GIÁ VÉ (Route Fares)
-- =====================================================
CREATE TABLE `route_fares` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int NOT NULL,
  `bus_type_id` int NOT NULL,
  `base_price` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_route_bustype` (`route_id`, `bus_type_id`),
  KEY `idx_fare_route` (`route_id`),
  KEY `idx_fare_bustype` (`bus_type_id`),
  CONSTRAINT `route_fares_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`),
  CONSTRAINT `route_fares_ibfk_2` FOREIGN KEY (`bus_type_id`) REFERENCES `bus_types` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. QUY TẮC GIÁ (Price Rules) - Dynamic Pricing
-- =====================================================
CREATE TABLE `price_rules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(100) NOT NULL,
  `route_id` int DEFAULT NULL,
  `bus_type_id` int DEFAULT NULL,
  `price_multiplier` decimal(5,2) DEFAULT NULL,
  `price_delta` decimal(12,2) DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `priority` int NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_rule_route` (`route_id`),
  KEY `idx_rule_bustype` (`bus_type_id`),
  KEY `idx_rule_date` (`start_date`, `end_date`),
  CONSTRAINT `price_rules_ibfk_1` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `price_rules_ibfk_2` FOREIGN KEY (`bus_type_id`) REFERENCES `bus_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
