-- =====================================================
-- Trip Service Database Schema
-- Chứa: trips, trip_seats
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `trip_seats`;
DROP TABLE IF EXISTS `trips`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 1. CHUYẾN XE (Trips)
-- =====================================================
CREATE TABLE `trips` (
  `id` int NOT NULL AUTO_INCREMENT,
  `route_id` int DEFAULT NULL,
  `bus_id` int DEFAULT NULL,
  `departure_time` datetime NOT NULL,
  `arrival_time_expected` datetime DEFAULT NULL,
  `status` enum('scheduled','departing','completed','cancelled') DEFAULT 'scheduled',
  `cancel_policy` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trip_route` (`route_id`),
  KEY `idx_trip_bus` (`bus_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. GHẾ THEO CHUYẾN (Trip Seats) - Real-time Management
-- =====================================================
CREATE TABLE `trip_seats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trip_id` int NOT NULL,
  `seat_number` varchar(10) NOT NULL,
  `status` enum('available','pending','booked') DEFAULT 'available',
  `pending_until` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_trip_seat` (`trip_id`, `seat_number`),
  KEY `idx_trip_seat_trip` (`trip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
