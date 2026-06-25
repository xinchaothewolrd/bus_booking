import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const Bus = sequelize.define('Bus', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  licensePlate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'license_plate'
  },
  busTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'bus_type_id'
  },
  driverName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'driver_name'
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance'),
    allowNull: false,
    defaultValue: 'active'
  },
  maintenanceNote: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'maintenance_note'
  }
}, {
  tableName: 'buses',
  timestamps: false
});

export default Bus;
