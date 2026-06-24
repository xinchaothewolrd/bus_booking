import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import tripRoute from './routes/tripRoute.js';
import tripSeatRoute from './routes/tripSeatRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'trip-service' });
});

// ── ROUTES ────────────────────────────────────────────────────

app.use('/api/trips', tripRoute);
app.use('/api/trip-seats', tripSeatRoute);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ── START SERVER ──────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Trip Service chạy trên cổng ${PORT}`);
  });
});
