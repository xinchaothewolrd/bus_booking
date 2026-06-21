-- init-db/order_service.sql

CREATE DATABASE IF NOT EXISTS order_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE order_service_db;

CREATE TABLE IF NOT EXISTS `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `trip_id` int DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','paid','cancelled') DEFAULT 'pending',
  `booking_time` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_booking_status` (`status`),
  KEY `idx_booking_user` (`user_id`),
  KEY `idx_booking_trip` (`trip_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `trip_seat_id` int NOT NULL,
  `passenger_name` varchar(100) DEFAULT NULL,
  `passenger_phone` varchar(20) DEFAULT NULL,
  `pickup_stop_id` int DEFAULT NULL,
  `dropoff_stop_id` int DEFAULT NULL,
  `qr_code` varchar(255) DEFAULT NULL,
  `status` enum('unused','used','cancelled') NOT NULL DEFAULT 'unused',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qr_code` (`qr_code`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('momo','zalo_pay','bank_transfer','cash','card') NOT NULL DEFAULT 'cash',
  `status` enum('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  `transaction_time` timestamp NULL DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_booking` (`booking_id`),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
