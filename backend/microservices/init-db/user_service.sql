-- init-db/user_service.sql
-- Chạy tự động khi Docker khởi tạo MySQL lần đầu

CREATE DATABASE IF NOT EXISTS user_service_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE user_service_db;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_token` (`refresh_token`),
  KEY `sessions_user_id` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tạo tài khoản admin mặc định (password: Admin@123)
INSERT IGNORE INTO `users` (`password`, `email`, `full_name`, `phone`, `role`, `status`)
VALUES ('$2b$10$9Dygfd3OeOTB.I2Wx.rpNetUjVe2dAyfcawRShh98GuinD865ZyGW', 'admin@busbooking.com', 'Admin', '0900000000', 'admin', 'active');
