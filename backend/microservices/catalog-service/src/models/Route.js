import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const Route = sequelize.define('Route', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  departureLocation: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'departure_location'
  },
  arrivalLocation: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'arrival_location'
  },
  distanceKm: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'distance_km'
  },
  durationEst: {
    type: DataTypes.TIME,
    allowNull: true,
    field: 'duration_est'
  }
}, {
  tableName: 'routes',
  timestamps: false
});

export default Route;
