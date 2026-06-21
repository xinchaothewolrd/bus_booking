// libs/mailer.js
// Dùng Gmail làm SMTP — test nhanh, miễn phí
// Khi production: đổi sang SendGrid / AWS SES

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Tạo transporter — đây là "người gửi thư"
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,  // email gmail của bạn
    pass: process.env.MAIL_PASS,  // App Password (không phải pass gmail thường)
  },
});

// Kiểm tra kết nối khi khởi động
export const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log('✅ Nodemailer kết nối Gmail thành công!');
  } catch (err) {
    console.warn('⚠️  Nodemailer chưa cấu hình Gmail — email sẽ được log ra console thay thế.');
    console.warn('   Xem hướng dẫn tạo App Password trong README.');
  }
};

// Hàm gửi email dùng chung
// Nếu chưa cấu hình Gmail → chỉ log ra console (để dev không bị block)
export const sendMail = async ({ to, subject, html }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log('📧 [MOCK EMAIL] To:', to);
    console.log('   Subject:', subject);
    console.log('   (Thêm MAIL_USER + MAIL_PASS vào .env để gửi thật)');
    return { messageId: 'mock-' + Date.now() };
  }

  const info = await transporter.sendMail({
    from: `"Đặt Vé Xe" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`📧 Email đã gửi tới ${to} — ID: ${info.messageId}`);
  return info;
};

export default transporter;
