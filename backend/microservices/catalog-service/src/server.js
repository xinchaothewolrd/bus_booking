import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import './models/index.js';

// Import routes
import busTypeRoute from './routes/busTypeRoute.js';
import busRoute from './routes/busRoute.js';
import routeRoute from './routes/routeRoute.js';
import routeStopRoute from './routes/routeStopRoute.js';
import routeFareRoute from './routes/routeFareRoute.js';
import priceRuleRoute from './routes/priceRuleRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'catalog-service' });
});

// ── ROUTES ────────────────────────────────────────────────────

// Bus Types
app.use('/api/bus-types', busTypeRoute);

// Buses
app.use('/api/buses', busRoute);

// Routes
app.use('/api/routes', routeRoute);

// Route Stops
app.use('/api/route-stops', routeStopRoute);

// Route Fares
app.use('/api/route-fares', routeFareRoute);

// Price Rules
app.use('/api/price-rules', priceRuleRoute);

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại.` });
});

// ── START SERVER ──────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Catalog Service chạy trên cổng ${PORT}`);
  });
});
