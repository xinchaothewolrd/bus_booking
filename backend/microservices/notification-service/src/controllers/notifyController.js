// controllers/notifyController.js
// Order Service gọi vào đây sau mỗi sự kiện quan trọng

import { sendMail } from '../libs/mailer.js';
import {
  bookingSuccessTemplate,
  paymentSuccessTemplate,
  bookingCancelledTemplate,
} from '../libs/templates.js';

// ── POST /notify/booking-created ──────────────────────────────
// Order Service gọi sau khi tạo booking thành công (status: pending)
export const notifyBookingCreated = async (req, res) => {
  // Trả về 202 NGAY — không đợi email gửi xong
  // Đây là bất đồng bộ: Order Service không bị block
  res.status(202).json({ message: 'Notification đang được xử lý.' });

  // Gửi email sau khi đã trả response (fire and forget)
  try {
    const { email, fullName, bookingId, tripInfo, tickets, totalAmount } = req.body;
    if (!email) return;

    await sendMail({
      to: email,
      subject: `[Đặt vé xe] Xác nhận đơn #${bookingId} — Vui lòng thanh toán`,
      html: bookingSuccessTemplate({ fullName, bookingId, tripInfo, tickets, totalAmount }),
    });
  } catch (err) {
    console.error('Lỗi gửi email booking-created:', err.message);
  }
};

// ── POST /notify/payment-success ──────────────────────────────
// Order Service gọi sau khi thanh toán thành công
export const notifyPaymentSuccess = async (req, res) => {
  res.status(202).json({ message: 'Notification đang được xử lý.' });

  try {
    const { email, fullName, bookingId, amount, paymentMethod, tickets } = req.body;
    if (!email) return;

    await sendMail({
      to: email,
      subject: `[Đặt vé xe] Thanh toán thành công — Mã đơn #${bookingId}`,
      html: paymentSuccessTemplate({ fullName, bookingId, amount, paymentMethod, tickets }),
    });
  } catch (err) {
    console.error('Lỗi gửi email payment-success:', err.message);
  }
};

// ── POST /notify/booking-cancelled ───────────────────────────
// Order Service gọi sau khi hủy vé
export const notifyBookingCancelled = async (req, res) => {
  res.status(202).json({ message: 'Notification đang được xử lý.' });

  try {
    const { email, fullName, bookingId } = req.body;
    if (!email) return;

    await sendMail({
      to: email,
      subject: `[Đặt vé xe] Vé #${bookingId} đã được hủy`,
      html: bookingCancelledTemplate({ fullName, bookingId }),
    });
  } catch (err) {
    console.error('Lỗi gửi email booking-cancelled:', err.message);
  }
};
