// Order Service — server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import bookingRoute from './routes/bookingRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import ticketRoute from './routes/ticketRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://api-gateway:3000', credentials: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.use('/api/bookings', bookingRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/tickets', ticketRoute);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Order Service chạy trên cổng ${PORT}`));
});
