// models/index.js — Khai báo tất cả model của Order Service + associations

import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

// ── BOOKING ───────────────────────────────────────────────────
export const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },           // ID từ User Service (không có FK thật)
  trip_id: { type: DataTypes.INTEGER },           // ID từ Trip Service (không có FK thật)
  total_amount: { type: DataTypes.DECIMAL(10, 2) },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
    defaultValue: 'pending'
  },
  booking_time: { type: DataTypes.DATE },
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ── TICKET (VÉ ĐIỆN TỬ) ──────────────────────────────────────
export const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  trip_seat_id: { type: DataTypes.INTEGER, allowNull: false }, // ID ghế từ Trip Service
  passenger_name: { type: DataTypes.STRING(100) },
  passenger_phone: { type: DataTypes.STRING(20) },
  pickup_stop_id: { type: DataTypes.INTEGER },    // ID từ Catalog Service
  dropoff_stop_id: { type: DataTypes.INTEGER },   // ID từ Catalog Service
  qr_code: { type: DataTypes.STRING(255), unique: true },
  status: {
    type: DataTypes.ENUM('unused', 'used', 'cancelled'),
    defaultValue: 'unused'
  },
}, {
  tableName: 'tickets',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ── PAYMENT ───────────────────────────────────────────────────
export const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  payment_method: {
    type: DataTypes.ENUM('momo', 'zalo_pay', 'bank_transfer', 'cash', 'card'),
    defaultValue: 'cash'
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  transaction_time: { type: DataTypes.DATE },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// 🔧 Convert snake_case to camelCase khi return response (match backend cũ)
const snakeToCamel = (obj) => {
  if (!obj) return obj;
  const newObj = {};
  Object.keys(obj).forEach(key => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newObj[camelKey] = obj[key];
  });
  return newObj;
};

// Áp dụng cho Booking
Booking.prototype.toJSON = function() {
  const values = snakeToCamel(this.get({ plain: true }));
  return values;
};

// Áp dụng cho Ticket
Ticket.prototype.toJSON = function() {
  const values = snakeToCamel(this.get({ plain: true }));
  return values;
};

// Áp dụng cho Payment
Payment.prototype.toJSON = function() {
  const values = snakeToCamel(this.get({ plain: true }));
  return values;
};

// ── ASSOCIATIONS ──────────────────────────────────────────────
Booking.hasMany(Ticket, { foreignKey: 'booking_id', as: 'Tickets' });
Ticket.belongsTo(Booking, { foreignKey: 'booking_id', as: 'Booking' });

Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'Payment' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'Booking' });
