// Order Service chỉ kết nối vào database của nó: order_service_db
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'order_service_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'mysql-order',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Order Service kết nối MySQL thành công!');
    await sequelize.sync({ alter: false });
  } catch (error) {
    console.error('❌ Không thể kết nối MySQL:', error);
    process.exit(1);
  }
};

export default sequelize;
