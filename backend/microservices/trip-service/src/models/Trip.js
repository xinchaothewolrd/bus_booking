import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const Trip = sequelize.define('Trip', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'route_id'
  },
  busId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'bus_id'
  },
  departureTime: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'departure_time'
  },
  arrivalTimeExpected: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'arrival_time_expected'
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'departing', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'scheduled'
  },
  cancelPolicy: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancel_policy'
  }
}, {
  tableName: 'trips',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Trip;
