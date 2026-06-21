import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

function SummaryRow({ label, value, isPrimary = false, isAccent = false }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-on-surface-variant">{label}</span>
      <span
        className={`
        font-bold text-right
        ${isPrimary ? "text-primary" : ""}
        ${isAccent ? "text-tertiary" : ""}
        ${!isPrimary && !isAccent ? "text-on-surface" : ""}
      `}
      >
        {value}
      </span>
    </div>
  );
}

export default function OrderSummary({
  trip,
  selectedSeats,
  totalPrice,
  seatPrice,
  onCheckout,
  isSubmitting,
}) {
  const route = trip?.route;
  const bus = trip?.bus;

  const formattedTime = trip?.departureTime
    ? new Date(trip.departureTime).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Đang tải...";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-elevated rounded-2xl p-6 border-t-[3px] border-primary"
    >
      <h3 className="text-lg font-bold text-on-surface mb-5">
        Tóm tắt đơn hàng
      </h3>
      <div className="space-y-3 text-sm mb-6">
        <SummaryRow
          label="Loại xe"
          value={bus?.busType?.typeName || "—"}
          isPrimary
        />

        <SummaryRow
          label="Ghế đã chọn"
          value={
            selectedSeats.length > 0 ? selectedSeats.join(", ") : "Chưa chọn"
          }
          isAccent
        />

        <SummaryRow label="Giá vé" value={`${seatPrice} đ / vé`} />
      </div>

      <div className="border-t border-outline-variant pt-4 mb-8">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-on-surface-variant">
            Tổng thanh toán
          </span>
          <div className="text-right">
            <span className="text-2xl font-black text-primary">
              {totalPrice.toLocaleString()} đ
            </span>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              Đã bao gồm VAT
            </p>
          </div>
        </div>
      </div>

      <motion.button
        onClick={onCheckout}
        disabled={selectedSeats.length === 0 || isSubmitting}
        className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-black text-lg transition-all
          ${
            selectedSeats.length === 0 || isSubmitting
              ? "bg-gray-400 cursor-not-allowed text-white/50"
              : "bg-primary text-on-primary hover:brightness-110"
          }
        `}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            Đang xử lý...
          </>
        ) : (
          <>
            Tiếp tục thanh toán
            <ArrowRight size={20} />
          </>
        )}
      </motion.button>

      <p className="text-[11px] text-center text-on-surface-variant mt-5 leading-relaxed">
        Bằng việc bấm Thanh toán, bạn đồng ý với{" "}
        <a href="#" className="text-primary hover:underline font-semibold">
          Điều khoản dịch vụ
        </a>{" "}
        và{" "}
        <a href="#" className="text-primary hover:underline font-semibold">
          Chính sách bảo mật
        </a>{" "}
        của chúng tôi.
      </p>
    </motion.div>
  );
}
