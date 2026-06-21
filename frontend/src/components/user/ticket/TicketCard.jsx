import React, { forwardRef } from 'react';
import { motion } from "framer-motion";
import { ArrowRight, QrCode } from 'lucide-react';

const TicketCard = forwardRef(({ ticket, onShowTicket }, ref) => {
  const isUpcoming = ticket.statusTicket === 'unused' || ticket.statusTicket === 'cancelled';

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="glass-panel rounded-xl p-5 md:p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden group glow-hover"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex-1 w-full">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
            isUpcoming 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-surface/50 text-on-surface-variant border-outline'
          }`}>
              {
                ticket.statusTicket === 'unused'
                  ? 'Sắp khởi hành'
                  : ticket.statusTicket === 'cancelled'
                  ? 'Đã hủy'
                  : 'Hoàn thành'
              }
          </span>
          <span className="text-on-surface-variant text-xs">Mã ĐC: <strong className="text-on-surface">{ticket.code}</strong></span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold flex items-center gap-3">
            {ticket.from} 
            <ArrowRight size={18} className="text-primary" /> 
            {ticket.to}
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          <div>
            <p className="text-on-surface-variant text-xs mb-1">Thời gian</p>
            <p className="text-on-surface text-sm font-medium">
              {
                      new Date(ticket.departureTime).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    }</p>
          </div>
          <div>
            <p className="text-on-surface-variant text-xs mb-1">Ghế</p>
            <p className="text-primary text-sm font-bold">{ticket.seats}</p>
          </div>
          <div className="col-span-2">
            <p className="text-on-surface-variant text-xs mb-1">Điểm đón</p>
            <p className="text-on-surface text-sm truncate" title={ticket.pickupLocation}>
              {ticket.pickupLocation}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full md:w-auto flex flex-row md:flex-col gap-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-outline md:pl-8">
        {isUpcoming ? (
          <button 
            onClick={() => onShowTicket(ticket)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg px-6 py-3 text-sm font-medium transition-all"
          >
            <QrCode size={18} />
            Xem vé E-ticket
          </button>
        ) : (
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-surface/50 hover:bg-surface border border-outline rounded-lg px-6 py-3 text-sm font-medium transition-all cursor-default opacity-60">
            Chi tiết vé
          </button>
        )}
      </div>
    </motion.div>
  );
});

export default TicketCard;