import React from 'react';
import { motion } from "framer-motion";
import { X, ArrowRight, Trash2, Download } from 'lucide-react';

export default function ETicketModal({ ticket, onClose, onCancel }) {
  if (!ticket) return null;

  // Lấy chuỗi QR từ vé đầu tiên trong danh sách rawTickets gộp
  const qrData = ticket.rawTickets?.[0]?.qrCode || ticket.code;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-panel-elevated w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-outline flex justify-between items-center bg-surface/30">
          <h2 className="text-lg font-bold">Vé Điện Tử</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">

          {/* Header Route */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="text-center">
              <p className="text-xs text-on-surface-variant">
                Điểm đi
              </p>

              <h3 className="font-bold text-lg">
                {ticket.from}
              </h3>
            </div>

            <ArrowRight
              size={18}
              className="text-primary mt-4"
            />

            <div className="text-center">
              <p className="text-xs text-on-surface-variant">
                Điểm đến
              </p>

              <h3 className="font-bold text-lg">
                {ticket.to}
              </h3>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-[140px_1fr] gap-5 items-start">

            {/* QR */}
            <div className="flex flex-col items-center">
              <div className="bg-white p-2 rounded-2xl shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>

              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-3">
                Mã vé
              </p>

              <p className="font-bold text-primary text-sm text-center break-all">
                {ticket.code}
              </p>
            </div>

            {/* Info */}
            <div className="space-y-3">

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">

                <div>
                  <p className="text-on-surface-variant text-xs">
                    Hành khách
                  </p>

                  <p className="font-semibold truncate">
                    {ticket.passengerName || 'Khách hàng'}
                  </p>
                </div>

                <div>
                  <p className="text-on-surface-variant text-xs">
                    Ghế
                  </p>

                  <p className="font-bold text-primary">
                    {ticket.seats}
                  </p>
                </div>

                <div>
                  <p className="text-on-surface-variant text-xs">
                    Giờ đi
                  </p>

                  <p className="font-semibold">
                    {
                      new Date(ticket.departureTime).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    }
                  </p>
                </div>

              </div>

              {/* Pickup */}
              <div className="bg-surface/40 rounded-xl p-3">
                <p className="text-on-surface-variant text-xs mb-1">
                  Điểm đón
                </p>

                <p className="text-sm leading-relaxed">
                  {ticket.pickupLocation || 'Chưa có'}
                </p>
              </div>

              <div className="bg-surface/40 rounded-xl p-3">
                <p className="text-on-surface-variant text-xs mb-1">
                  Điểm trả
                </p>

                <p className="text-sm leading-relaxed">
                  {ticket.dropoffLocation || 'Chưa có'}
                </p>
              </div>

              {/* Footer Info */}
              <div className="flex items-center justify-between pt-2 border-t border-outline/40">
                <div>
                  <p className="text-on-surface-variant text-xs">
                    Tổng tiền
                  </p>

                  <p className="font-bold text-primary">
                    {Number(ticket.totalAmount || 0).toLocaleString('vi-VN')}đ
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-on-surface-variant text-xs">
                    Đặt lúc
                  </p>

                  <p className="text-xs font-medium">
                    {
                      new Date(ticket.created_at).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    }
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-outline flex justify-between items-center bg-surface/30">
          {ticket.statusTicket !== 'cancelled' ? (
            <button 
              onClick={onCancel} // Gọi ngược lên hàm handleCancelTicket của cha
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Trash2 size={16} /> Hủy vé
            </button>
          ) : (
            <span className="text-red-400 font-medium text-sm flex items-center gap-2">
              <X size={16} /> Vé này đã hủy
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}