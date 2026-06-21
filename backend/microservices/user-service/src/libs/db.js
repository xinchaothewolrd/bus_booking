// libs/db.js — Kết nối MySQL cho User Service
// User Service chỉ kết nối vào database CỦA NÓ (user_service_db)

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'user_service_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'mysql-user',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false, // Tắt log SQL để console gọn hơn
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ User Service kết nối MySQL thành công!');
    await sequelize.sync({ alter: false }); // Không tự sửa bảng, chỉ dùng bảng có sẵn
  } catch (error) {
    console.error('❌ Không thể kết nối MySQL:', error);
    process.exit(1);
  }
};

export default sequelize;
