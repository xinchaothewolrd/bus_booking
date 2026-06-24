import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

const PriceRule = sequelize.define('PriceRule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ruleName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'rule_name'
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'route_id'
  },
  busTypeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'bus_type_id'
  },
  priceMultiplier: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'price_multiplier'
  },
  priceDelta: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'price_delta'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_date'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'end_date'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'price_rules',
  timestamps: false
});

export default PriceRule;
