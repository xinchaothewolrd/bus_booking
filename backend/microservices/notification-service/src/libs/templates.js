// libs/templates.js — HTML templates cho từng loại email

// Email xác nhận đặt vé thành công
export const bookingSuccessTemplate = ({ fullName, bookingId, tripInfo, tickets, totalAmount }) => `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
    
    <!-- Header -->
    <div style="background:#4F46E5;padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Đặt vé thành công!</h1>
      <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Mã đơn: #${bookingId}</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;">Xin chào <strong>${fullName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        Chúng tôi đã nhận được đơn đặt vé của bạn. Vui lòng thanh toán trong vòng <strong>10 phút</strong> để giữ chỗ.
      </p>

      <!-- Thông tin chuyến -->
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #4F46E5;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Thông tin chuyến</p>
        <p style="margin:0;font-size:15px;color:#111827;font-weight:600;">${tripInfo || 'Chuyến xe đã chọn'}</p>
      </div>

      <!-- Danh sách vé -->
      ${tickets && tickets.length ? `
      <p style="font-size:13px;color:#6b7280;margin:20px 0 8px;text-transform:uppercase;letter-spacing:.5px;">Vé của bạn</p>
      ${tickets.map(t => `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${t.passengerName || 'Hành khách'}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Ghế: ${t.seatNumber || 'N/A'}</p>
            </div>
            <div style="background:#EEF2FF;border-radius:6px;padding:6px 12px;">
              <p style="margin:0;font-size:12px;font-weight:600;color:#4F46E5;">Mã QR: ${t.qrCode || 'N/A'}</p>
            </div>
          </div>
        </div>
      `).join('')}
      ` : ''}

      <!-- Tổng tiền -->
      <div style="border-top:1px solid #e5e7eb;margin-top:20px;padding-top:16px;display:flex;justify-content:space-between;">
        <span style="font-size:15px;color:#374151;">Tổng tiền:</span>
        <span style="font-size:18px;font-weight:700;color:#4F46E5;">${Number(totalAmount).toLocaleString('vi-VN')}₫</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Đây là email tự động, vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
`;

// Email xác nhận thanh toán thành công
export const paymentSuccessTemplate = ({ fullName, bookingId, amount, paymentMethod, tickets }) => `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#059669;padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Thanh toán thành công!</h1>
      <p style="color:#a7f3d0;margin:8px 0 0;font-size:14px;">Mã đơn: #${bookingId}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;">Xin chào <strong>${fullName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;">Thanh toán của bạn đã được xác nhận. Chúc bạn có chuyến đi vui vẻ!</p>

      <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Số tiền thanh toán</p>
        <p style="margin:0;font-size:24px;font-weight:700;color:#059669;">${Number(amount).toLocaleString('vi-VN')}₫</p>
        <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Phương thức: ${paymentMethod || 'VNPAY'}</p>
      </div>

      ${tickets && tickets.length ? `
      <p style="font-size:13px;color:#6b7280;margin:20px 0 8px;">Vé điện tử của bạn:</p>
      ${tickets.map(t => `
        <div style="border:1px solid #d1fae5;border-radius:8px;padding:14px;margin-bottom:10px;background:#f0fdf4;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#065f46;">${t.passengerName} — Ghế ${t.seatNumber || ''}</p>
          <p style="margin:6px 0 0;font-size:13px;color:#059669;font-family:monospace;">QR: ${t.qrCode}</p>
        </div>
      `).join('')}
      ` : ''}
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Email tự động — vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
`;

// Email hủy vé
export const bookingCancelledTemplate = ({ fullName, bookingId }) => `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#DC2626;padding:28px 32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Vé đã được hủy</h1>
      <p style="color:#fecaca;margin:8px 0 0;font-size:14px;">Mã đơn: #${bookingId}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;">Xin chào <strong>${fullName}</strong>,</p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;">
        Đơn đặt vé <strong>#${bookingId}</strong> của bạn đã được hủy thành công.<br>
        Nếu bạn đã thanh toán, hoàn tiền sẽ được xử lý trong 3-5 ngày làm việc.
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Email tự động — vui lòng không trả lời.</p>
    </div>
  </div>
</body>
</html>
`;
