// models/Session.js — Model bảng sessions (quản lý Refresh Token)

import { DataTypes, Op } from 'sequelize';
import sequelize from '../libs/db.js';

const Session = sequelize.define('Session', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  refresh_token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Hàm dọn dẹp session hết hạn (chạy cron mỗi ngày)
export const cleanupExpiredSessions = async () => {
  try {
    const deleted = await Session.destroy({
      where: { expires_at: { [Op.lt]: new Date() } }
    });
    console.log(`🧹 Đã xóa ${deleted} session hết hạn.`);
  } catch (err) {
    console.error('Lỗi cleanup sessions:', err);
  }
};

export default Session;
