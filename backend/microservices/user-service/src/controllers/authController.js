// controllers/authController.js
// Logic giữ nguyên từ code cũ — chỉ đổi tên trường cho khớp DB

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import User from '../models/User.js';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m';
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

// ── ĐĂNG KÝ ──────────────────────────────────────────────────
export const signUp = async (req, res) => {
  try {
    const { password, email, phone, firstName, lastName } = req.body;
    if (!password || !email || !phone || !firstName || !lastName) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    const duplicate = await User.findOne({
      where: { [Op.or]: [{ email }, { phone }] }
    });
    if (duplicate) {
      return res.status(409).json({ message: 'Email hoặc số điện thoại đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      password: hashedPassword,     // cột DB tên là 'password'
      email,
      phone,
      full_name: `${lastName} ${firstName}`,
      role: 'customer',
      status: 'active',
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng ký.' });
  }
};

// ── ĐĂNG NHẬP ────────────────────────────────────────────────
export const signIn = async (req, res) => {
  try {
    const { identity, password } = req.body;
    if (!identity || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập Email hoặc SĐT và Mật khẩu.' });
    }

    const user = await User.findOne({
      where: { [Op.or]: [{ email: identity }, { phone: identity }] }
    });
    if (!user) return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
    if (user.status === 'banned') return res.status(401).json({ message: 'Tài khoản đã bị khóa.' });

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });

    // Tạo Access Token
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Tạo Refresh Token
    const refreshToken = crypto.randomBytes(64).toString('hex');
    await Session.create({
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_TTL,
    });

    return res.status(200).json({
      message: `Đăng nhập thành công. Chào mừng ${user.full_name}!`,
      accessToken,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng nhập.' });
  }
};

// ── ĐĂNG XUẤT ────────────────────────────────────────────────
export const signOut = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await Session.destroy({ where: { refresh_token: token } });
    }
    res.clearCookie('refreshToken');
    return res.sendStatus(204);
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi đăng xuất.' });
  }
};

// ── LÀM MỚI ACCESS TOKEN ─────────────────────────────────────
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Không tìm thấy refresh token.' });

    const session = await Session.findOne({ where: { refresh_token: token } });
    if (!session) return res.status(401).json({ message: 'Refresh token không hợp lệ.' });

    if (new Date() > new Date(session.expires_at)) {
      await session.destroy();
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Refresh token đã hết hạn.' });
    }

    const user = await User.findByPk(session.user_id);
    if (!user) return res.status(401).json({ message: 'Không tìm thấy người dùng.' });
    if (user.status === 'banned') return res.status(401).json({ message: 'Tài khoản đã bị khóa.' });

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Lỗi refresh token:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi.' });
  }
};

// ── XÁC THỰC TOKEN (API Gateway gọi vào đây) ──────────────────
// Đây là endpoint ĐẶC BIỆT — chỉ dành cho API Gateway
// Gateway gọi POST /internal/verify-token để kiểm tra token thay vì tự verify
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ valid: false, message: 'Thiếu token' });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user || user.status === 'banned') {
      return res.status(401).json({ valid: false, message: 'User không hợp lệ' });
    }

    return res.status(200).json({
      valid: true,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(401).json({ valid: false, message: 'Token không hợp lệ hoặc hết hạn' });
  }
};
