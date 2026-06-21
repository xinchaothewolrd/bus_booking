// Notification Service — server.js
// KHÔNG expose ra ngoài qua API Gateway
// Chỉ nhận request từ các service nội bộ (Order Service)

import express from 'express';
import dotenv from 'dotenv';
import { verifyMailer } from './libs/mailer.js';
import notifyRoute from './routes/notifyRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use('/notify', notifyRoute);

app.listen(PORT, async () => {
  console.log(`✅ Notification Service chạy trên cổng ${PORT}`);
  await verifyMailer();
});
