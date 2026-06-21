// User Service — server.js
// Chịu trách nhiệm: đăng ký, đăng nhập, quản lý user, cấp JWT

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ── MIDDLEWARE ────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000', // API Gateway
  credentials: true
}));

// ── ROUTES ────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'user-service' }));

app.use('/api/auth', authRoute);     // Đăng ký / đăng nhập / token
app.use('/api/users', userRoute);    // Quản lý thông tin user

// ── KHỞI ĐỘNG ─────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ User Service chạy trên cổng ${PORT}`);
  });
});
