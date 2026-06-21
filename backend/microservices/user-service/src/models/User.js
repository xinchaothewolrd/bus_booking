// models/User.js — Model bảng users
// Giữ nguyên cấu trúc từ code cũ, không thay đổi tên cột

import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  password: { type: DataTypes.STRING(255), allowNull: false },       // lưu ý: code cũ dùng 'hashedPassword' trong JS nhưng cột DB tên là 'password'
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  full_name: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(255), unique: true },
  role: { type: DataTypes.STRING(20), defaultValue: 'customer' },
  status: { type: DataTypes.STRING(20), defaultValue: 'active' },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
});

// 🔧 Alias để match với frontend cũ (frontend expects fullName, not full_name)
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password; // Không bao giờ trả password ra ngoài

  // Alias: full_name → fullName (để match frontend cũ)
  if (values.full_name) {
    values.fullName = values.full_name;
    delete values.full_name;
  }

  return values;
};

export default User;
