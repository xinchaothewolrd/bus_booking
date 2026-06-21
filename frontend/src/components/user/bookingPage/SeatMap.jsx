import React, { useMemo } from 'react';
import { motion } from "framer-motion";
import { Info, CheckCircle2 } from 'lucide-react';

/* ===================== SEAT ITEM ===================== */
const SeatItem = ({ id, status, onClick }) => {
  return (
    <motion.button
      whileHover={status === 'available' ? { scale: 1.05 } : {}}
      whileTap={status === 'available' ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={status === 'booked' || status === 'pending'}
      className={`
        relative w-full aspect-square rounded-lg flex items-center justify-center transition-all duration-200 text-xs font-bold
        ${status === 'available' ? 'bg-surface-variant/40 border border-primary/30 text-on-surface hover:border-primary' : ''}
        ${status === 'selected' ? 'bg-primary/20 border border-primary text-primary shadow-[0_0_15px_rgba(125,211,252,0.2)]' : ''}
        ${status === 'booked' ? 'bg-error/10 border border-error/30 text-error cursor-not-allowed' : ''}
        ${status === 'pending' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 cursor-not-allowed' : ''}
      `}
    >
      {/* Headrest */}
      <div className={`
        absolute -top-1 w-1/2 h-1.5 rounded-full opacity-80
        ${status === 'selected' ? 'bg-primary' : 'bg-current'}
      `} />

      <span className="z-10">{id}</span>

      {/* Occupied cross */}
      {status === 'booked' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[120%] h-[2px] bg-error/50 rotate-45" />
        </div>
      )}
    </motion.button>
  );
};

/* ===================== LEGEND ===================== */
function LegendItem({ type, label }) {
  const styles = {
    available: 'bg-surface-variant/40 border-primary/30',
    selected: 'bg-primary/20 border-primary',
    booked: 'bg-error/10 border-error/30',
    pending: 'bg-yellow-500/20 border-yellow-400'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded border ${styles[type]}`} />
      <span className="text-xs text-on-surface-variant">{label}</span>
    </div>
  );
}

/* ===================== MAIN ===================== */
export default function SeatMap({
  seats = [],
  toggleSeat,
  layout,
  deck,
  setDeck
}) {

  /* 🔥 RULE: A = lower, B = upper */
  const getDeckFromSeat = (id) => {
    const prefix = id.charAt(0);
    if (prefix === 'A') return 'lower';
    if (prefix === 'B') return 'upper';
    return 'lower';
  };

  /* 🔥 FILTER + SORT */
  const filteredSeats = useMemo(() => {
    return seats
      .filter(seat => getDeckFromSeat(seat.id) === deck)
      .sort((a, b) => {
        const numA = parseInt(a.id.slice(1));
        const numB = parseInt(b.id.slice(1));
        return numA - numB;
      });
  }, [seats, deck]);

  return (
    <section className="lg:col-span-7 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6"
      >

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant pb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Chọn chỗ ngồi</h2>
            <p className="text-sm text-on-surface-variant mt-1 flex items-center gap-1">
              <Info size={14} className="text-primary" />
              Sơ đồ xe
            </p>
          </div>

          {/* TOGGLE TẦNG */}
          <div className="flex bg-surface-variant/30 rounded-xl p-1">
            <button
              onClick={() => setDeck('lower')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                deck === 'lower'
                  ? 'bg-primary text-black'
                  : 'text-on-surface-variant'
              }`}
            >
              Tầng dưới
            </button>

            <button
              onClick={() => setDeck('upper')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
                deck === 'upper'
                  ? 'bg-primary text-black'
                  : 'text-on-surface-variant'
              }`}
            >
              Tầng trên
            </button>
          </div>
        </div>

        {/* BUS UI */}
        <div className="flex justify-center py-10">
          <div className="relative w-full max-w-[320px] bg-surface-variant/20 rounded-[3rem] p-8 border">

            {/* ICON quay quay */}
            <div className="absolute top-4 right-6 opacity-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <CheckCircle2 size={28} />
              </motion.div>
            </div>

            {/* GRID GHẾ */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${layout?.cols || 2}, 1fr)`
              }}
            >
              {filteredSeats.map(seat => (
                <SeatItem
                  key={seat.id}
                  id={seat.id}
                  status={seat.status}
                  onClick={() => toggleSeat(seat.id)}
                />
              ))}
            </div>

          </div>
        </div>

        {/* LEGEND */}
        <div className="flex justify-center gap-6 pt-4 border-t">
          <LegendItem type="available" label="Trống" />
          <LegendItem type="selected" label="Đang chọn" />
          <LegendItem type="booked" label="Đã bán" />
          <LegendItem type="pending" label="Đang giữ" />
        </div>

      </motion.div>
    </section>
  );
}