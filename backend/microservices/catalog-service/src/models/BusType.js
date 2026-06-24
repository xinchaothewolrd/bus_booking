import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const BusType = sequelize.define('BusType', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  typeName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'type_name'
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_seats'
  },
  seatLayout: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'seat_layout'
  }
}, {
  tableName: 'bus_types',
  timestamps: false
});

export default BusType;
