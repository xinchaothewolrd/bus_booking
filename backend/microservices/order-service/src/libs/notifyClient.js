// libs/notifyClient.js
// Order Service dùng file này để gọi Notification Service
// Fire-and-forget: không await, không làm chậm response chính

const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';

// Gọi nội bộ — không throw lỗi ra ngoài (nếu notify lỗi không ảnh hưởng booking)
async function notify(path, body) {
  try {
    fetch(`${NOTIFY_URL}/notify/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }); // KHÔNG await — fire and forget
  } catch (err) {
    console.error(`[NotifyClient] Lỗi gọi ${path}:`, err.message);
  }
}

export const notifyBookingCreated = (data) => notify('booking-created', data);
export const notifyPaymentSuccess  = (data) => notify('payment-success', data);
export const notifyBookingCancelled = (data) => notify('booking-cancelled', data);
