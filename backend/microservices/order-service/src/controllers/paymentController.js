// controllers/paymentController.js
import { Payment, Booking, Ticket } from '../models/index.js';
import { tripService, userService } from '../libs/httpClient.js';
import { createPaymentUrl, verifyReturnUrl } from '../libs/vnpay.js';
import { notifyPaymentSuccess, notifyBookingCreated } from '../libs/notifyClient.js';

// ── [MOCK] Thanh toán giả lập ─────────────────────────────────
export const mockPay = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Thanh toán không tồn tại.' });
    const bookingId = payment.booking_id;
    const userId = req.headers['x-user-id'];

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });

    if (!booking) return res.status(404).json({ message: 'Đơn đặt vé không tồn tại.' });
    if (String(booking.user_id) !== String(userId))
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán đơn này.' });
    if (booking.status !== 'pending')
      return res.status(400).json({ message: `Đơn đang ở trạng thái '${booking.status}'.` });

    booking.status = 'paid';
    await booking.save();

    await Payment.update(
      { status: 'success', payment_method: 'cash', transaction_time: new Date() },
      { where: { booking_id: bookingId } }
    );

    const seatIds = booking.Tickets.map(tk => tk.trip_seat_id);
    await tripService.bookSeats(seatIds);

    if (req.body.email) {
      notifyPaymentSuccess({
        email: req.body.email,
        fullName: req.body.fullName || 'Quý khách',
        bookingId,
        amount: booking.total_amount,
        paymentMethod: 'Mock Payment',
        tickets: booking.Tickets.map(t => ({ passengerName: t.passenger_name, qrCode: t.qr_code })),
      });
    }

    const updated = await Booking.findByPk(bookingId, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });

    return res.status(200).json({ message: '✅ Thanh toán thành công! (Mock)', data: updated });
  } catch (err) {
    console.error('Lỗi mock payment:', err);
    return res.status(500).json({ message: 'Lỗi xử lý thanh toán.' });
  }
};

// ── [VNPAY] Tạo URL thanh toán ────────────────────────────────
export const createVnpayUrl = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.headers['x-user-id'];
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Ticket, as: 'Tickets' }]
    });
    if (!booking) return res.status(404).json({ message: 'Đơn đặt vé không tồn tại.' });
    if (String(booking.user_id) !== String(userId))
      return res.status(403).json({ message: 'Không có quyền.' });
    if (booking.status !== 'pending')
      return res.status(400).json({ message: 'Đơn không ở trạng thái chờ thanh toán.' });

    const { paymentUrl, orderId } = createPaymentUrl({
      bookingId,
      amount: booking.total_amount,
      orderInfo: `Thanh toan don dat ve ${bookingId}`,
      ipAddr,
    });

    // Lưu transaction_no để tra cứu sau, và email nếu client gửi kèm
    await Payment.update(
      { transaction_no: orderId, email: req.body.email || null },
      { where: { booking_id: bookingId } }
    );

    return res.status(200).json({ paymentUrl });
  } catch (err) {
    console.error('Lỗi tạo VNPAY URL:', err);
    return res.status(500).json({ message: 'Lỗi tạo đường dẫn thanh toán.' });
  }
};

// ── [VNPAY] Nhận kết quả từ VNPAY (Return URL) ────────────────
export const vnpayReturn = async (req, res) => {
  try {
    const rawQuery = req.originalUrl.split('?')[1] || '';
    const result = verifyReturnUrl(rawQuery);

    if (!result.valid) {
      return res.status(400).json({ message: result.message });
    }

    // txnRef có dạng BK1-timestamp → lấy bookingId = "1"
    const bookingId = result.txnRef.replace('BK', '').split('-')[0];
    const booking = await Booking.findByPk(bookingId, {
      include: [{ model: Ticket, as: 'Tickets' }, { model: Payment, as: 'Payment' }]
    });

    if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn đặt vé.' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (result.success && booking.status === 'pending') {
      booking.status = 'paid';
      await booking.save();

      await Payment.update({
        status: 'success',
        payment_method: 'card',
        transaction_time: new Date(),
      }, { where: { booking_id: bookingId } });

      // Chốt ghế bên Trip Service
      const seatIds = booking.Tickets.map(tk => tk.trip_seat_id);
      await tripService.bookSeats(seatIds);

      // Gửi email: ưu tiên email lưu trong payment, fallback lấy từ user-service
      let email = booking.Payment?.email;
      let fullName = 'Quý khách';

      if (!email && booking.user_id) {
        try {
          const user = await userService.getUser(booking.user_id);
          email = user?.email;
          fullName = user?.full_name || user?.name || 'Quý khách';
        } catch (e) {
          console.warn('Không lấy được user info:', e.message);
        }
      }

      if (email) {
        notifyPaymentSuccess({
          email,
          fullName,
          bookingId,
          amount: result.amount,
          paymentMethod: `VNPAY (${result.bankCode || 'card'})`,
          tickets: booking.Tickets.map(t => ({
            passengerName: t.passenger_name,
            qrCode: t.qr_code
          })),
        });
      }

      return res.redirect(`${frontendUrl}/payment-result?status=success&bookingId=${bookingId}&amount=${result.amount}&transactionNo=${result.transactionNo}`);
    } else if (booking.status !== 'pending') {
      // Đơn đã xử lý rồi (tránh double process)
      const payment = await Payment.findOne({ where: { booking_id: bookingId } });
      return res.redirect(`${frontendUrl}/payment-result?status=success&bookingId=${bookingId}&amount=${payment?.amount || 0}&transactionNo=${payment?.transaction_no || ''}`);
    } else {
      await Payment.update({ status: 'failed' }, { where: { booking_id: bookingId } });
      return res.redirect(`${frontendUrl}/payment-result?status=failed&code=${result.responseCode}`);
    }
  } catch (err) {
    console.error('Lỗi VNPAY return:', err);
    return res.status(500).json({ message: 'Lỗi xử lý kết quả thanh toán.' });
  }
};

// ── Lấy thông tin thanh toán ──────────────────────────────────
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ where: { booking_id: req.params.bookingId } });
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy thông tin thanh toán.' });
    return res.status(200).json(payment);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy thông tin thanh toán.' });
  }
};
// ── Lấy payment của booking (có authorization) ──────────────────────────
export const getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.headers['x-user-id'];

    // Check ownership
    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking không tồn tại.' });
    if (String(booking.user_id) !== String(userId)) {
      return res.status(403).json({ message: 'Không có quyền xem payment này.' });
    }

    const payment = await Payment.findOne({ where: { booking_id: bookingId } });
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy payment.' });
    return res.status(200).json(payment);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy thông tin thanh toán.' });
  }
};

// ── Lấy tất cả payments (Admin) ──────────────────────────────────────────
export const getAllPayments = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { status, bookingId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (bookingId) where.booking_id = bookingId;

    const payments = await Payment.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    return res.status(200).json(payments);
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi lấy danh sách thanh toán.' });
  }
};

// ── Tạo payment mới (Admin) ──────────────────────────────────────────────
export const createPayment = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { bookingId, amount, paymentMethod, status } = req.body;
    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Thiếu: bookingId, amount, paymentMethod' });
    }

    const booking = await Booking.findByPk(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking không tồn tại.' });

    const newPayment = await Payment.create({
      booking_id: bookingId,
      amount,
      payment_method: paymentMethod,
      status: status || 'pending',
    });

    return res.status(201).json({ message: 'Tạo payment thành công.', data: newPayment });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi tạo payment.' });
  }
};

// ── Cập nhật payment (Admin) ────────────────────────────────────────────
export const updatePayment = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { id: paymentId } = req.params;
    const { amount, paymentMethod, status } = req.body;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment không tồn tại.' });

    if (amount) payment.amount = amount;
    if (paymentMethod) payment.payment_method = paymentMethod;
    if (status) payment.status = status;

    await payment.save();
    return res.status(200).json({ message: 'Cập nhật payment thành công.', data: payment });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi cập nhật payment.' });
  }
};

// ── Phê duyệt payment pending -> success (Admin) ──────────────────────
export const approvePayment = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { id: paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment không tồn tại.' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment đang ở trạng thái '${payment.status}', không thể phê duyệt.` });
    }

    payment.status = 'success';
    payment.transaction_time = new Date();
    await payment.save();

    // Confirm booking nếu chưa
    const booking = await Booking.findByPk(payment.booking_id);
    if (booking && booking.status === 'pending') {
      booking.status = 'paid';
      await booking.save();
      // Book ghế
      const tickets = await Ticket.findAll({ where: { booking_id: booking.id } });
      const seatIds = tickets.map(t => t.trip_seat_id);
      try {
        await tripService.bookSeats(seatIds);
      } catch (e) {
        console.warn('Lỗi book ghế:', e.message);
      }
    }

    return res.status(200).json({ message: 'Phê duyệt payment thành công.', data: payment });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi phê duyệt payment.' });
  }
};

// ── Từ chối payment pending -> failed (Admin) ──────────────────────────
export const rejectPayment = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { id: paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment không tồn tại.' });
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: `Payment đang ở trạng thái '${payment.status}', không thể từ chối.` });
    }

    payment.status = 'failed';
    await payment.save();

    // Release ghế
    const booking = await Booking.findByPk(payment.booking_id);
    if (booking) {
      const tickets = await Ticket.findAll({ where: { booking_id: booking.id } });
      const seatIds = tickets.map(t => t.trip_seat_id);
      try {
        await tripService.releaseSeats(seatIds);
      } catch (e) {
        console.warn('Lỗi release ghế:', e.message);
      }
    }

    return res.status(200).json({ message: 'Từ chối payment thành công.', data: payment });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi từ chối payment.' });
  }
};

// ── Hoàn tiền payment success -> refunded (Admin) ───────────────────────
export const refundPayment = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
    }

    const { id: paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment không tồn tại.' });
    if (payment.status !== 'success') {
      return res.status(400).json({ message: `Payment đang ở trạng thái '${payment.status}', không thể hoàn tiền.` });
    }

    payment.status = 'refunded';
    payment.refund_time = new Date();
    await payment.save();

    // Update booking và release ghế
    const booking = await Booking.findByPk(payment.booking_id);
    if (booking) {
      booking.status = 'cancelled';
      await booking.save();

      const tickets = await Ticket.findAll({ where: { booking_id: booking.id } });
      const seatIds = tickets.map(t => t.trip_seat_id);
      try {
        await tripService.releaseSeats(seatIds);
      } catch (e) {
        console.warn('Lỗi release ghế:', e.message);
      }
      // Update tickets status
      await Ticket.update({ status: 'cancelled' }, { where: { booking_id: booking.id } });
    }

    return res.status(200).json({ message: 'Hoàn tiền thành công.', data: payment });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi hoàn tiền.' });
  }
};