import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const RouteFare = sequelize.define('RouteFare', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'route_id'
  },
  busTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'bus_type_id'
  },
  basePrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'base_price'
  }
}, {
  tableName: 'route_fares',
  timestamps: false
});

export default RouteFare;
