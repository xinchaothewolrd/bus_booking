import { DataTypes } from 'sequelize';
import sequelize from '../libs/db.js';

import BusType from './BusType.js';
import Bus from './Bus.js';
import Route from './Route.js';
import RouteStop from './RouteStop.js';
import RouteFare from './RouteFare.js';
import PriceRule from './PriceRule.js';

// Associations

// Route - RouteStop
Route.hasMany(RouteStop, { foreignKey: 'route_id', as: 'stops', onDelete: 'CASCADE' });
RouteStop.belongsTo(Route, { foreignKey: 'route_id', as: 'route', onDelete: 'CASCADE' });

// BusType - Bus
BusType.hasMany(Bus, { foreignKey: 'bus_type_id', as: 'buses', onDelete: 'RESTRICT' });
Bus.belongsTo(BusType, { foreignKey: 'bus_type_id', as: 'busType', onDelete: 'RESTRICT' });

// Route - RouteFare
Route.hasMany(RouteFare, { foreignKey: 'route_id', as: 'fares', onDelete: 'CASCADE' });
RouteFare.belongsTo(Route, { foreignKey: 'route_id', as: 'route', onDelete: 'CASCADE' });

// BusType - RouteFare
BusType.hasMany(RouteFare, { foreignKey: 'bus_type_id', as: 'fares', onDelete: 'CASCADE' });
RouteFare.belongsTo(BusType, { foreignKey: 'bus_type_id', as: 'busType', onDelete: 'CASCADE' });

// Route - PriceRule
Route.hasMany(PriceRule, { foreignKey: 'route_id', as: 'priceRules', onDelete: 'CASCADE' });
PriceRule.belongsTo(Route, { foreignKey: 'route_id', as: 'route', onDelete: 'CASCADE' });

// BusType - PriceRule
BusType.hasMany(PriceRule, { foreignKey: 'bus_type_id', as: 'priceRules', onDelete: 'CASCADE' });
PriceRule.belongsTo(BusType, { foreignKey: 'bus_type_id', as: 'busType', onDelete: 'CASCADE' });

export {
  sequelize,
  Route,
  RouteStop,
  BusType,
  Bus,
  RouteFare,
  PriceRule
};

export default {
  sequelize,
  Route,
  RouteStop,
  BusType,
  Bus,
  RouteFare,
  PriceRule
};
