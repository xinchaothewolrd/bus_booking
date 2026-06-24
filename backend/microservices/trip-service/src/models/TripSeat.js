import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';
import Trip from './Trip.js';

const TripSeat = sequelize.define('TripSeat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tripId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'trip_id'
  },
  seatNumber: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'seat_number'
  },
  status: {
    type: DataTypes.ENUM('available', 'pending', 'booked'),
    allowNull: false,
    defaultValue: 'available'
  },
  pendingUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'pending_until'
  }
}, {
  tableName: 'trip_seats',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Trip.hasMany(TripSeat, { foreignKey: 'tripId', onDelete: 'CASCADE' });
TripSeat.belongsTo(Trip, { foreignKey: 'tripId' });

export default TripSeat;
