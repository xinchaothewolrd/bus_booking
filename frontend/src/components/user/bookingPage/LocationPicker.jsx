import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronDown, Check } from 'lucide-react';

export default function LocationPicker({ locations, selectedPickup, setSelectedPickup, selectedDropoff, setSelectedDropoff }) {
  // State quản lý xem dropdown nào đang mở: 'pickup', 'dropoff', hoặc null
  const [activeDropdown, setActiveDropdown] = useState(null);
  const containerRef = useRef(null);

  // Click ra ngoài thì đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (type) => {
    setActiveDropdown(prev => prev === type ? null : type);
  };

  return (
    <div className="relative z-[100] glass-panel rounded-3xl p-5 border border-outline-variant/30 bg-surface/40 backdrop-blur-md" ref={containerRef}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="text-primary" size={18} />
        <h2 className="text-base font-bold text-on-surface">Điểm đón & trả</h2>
      </div>

      {/* GRID 2 CỘT CHO 2 NÚT BẤM (GỌN HƠN RẤT NHIỀU) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        
        {/* ================= CỘT 1: ĐIỂM ĐÓN ================= */}
        <div className="relative">
          <label className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1.5">
            Điểm đón
          </label>
          
          {/* Nút Trigger */}
          <button
            type="button"
            onClick={() => toggleDropdown('pickup')}
            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
              activeDropdown === 'pickup' 
                ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(125,211,252,0.15)]' 
                : 'bg-surface-variant/30 border-outline-variant/20 hover:border-outline-variant/50'
            }`}
          >
            <div className="overflow-hidden pr-2">
              <p className={`text-xs font-bold truncate ${selectedPickup ? 'text-primary' : 'text-on-surface-variant'}`}>
                {selectedPickup ? selectedPickup.name : 'Chọn điểm đón...'}
              </p>
              {selectedPickup && (
                <p className="text-[10px] text-on-surface-variant truncate">{selectedPickup.time} • {selectedPickup.address}</p>
              )}
            </div>
            <ChevronDown size={16} className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${activeDropdown === 'pickup' ? 'rotate-180' : ''}`} />
          </button>

          {/* MENU THẢ XUỐNG (ABSOLUTE ĐỂ ĐÈ LÊN COMPONENT DƯỚI) */}
          <AnimatePresence>
            {activeDropdown === 'pickup' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute left-0 top-[calc(100%+8px)] w-[280px] sm:w-full bg-[#0f1524] border border-primary/30 rounded-2xl shadow-2xl z-50 p-2 space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar backdrop-blur-xl"
              >
                {locations.pickup.map((loc) => { 
                  const isSelected = selectedPickup?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedPickup(loc);
                        setActiveDropdown(null); // Chọn xong tự đóng
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        isSelected ? 'bg-primary/15 text-primary' : 'hover:bg-surface-variant/40 text-on-surface'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{loc.name}</span>
                          {isSelected && <Check size={12} className="text-primary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-on-surface-variant line-clamp-1">{loc.address}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant border border-outline-variant/10 shrink-0">
                        {loc.time}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================= CỘT 2: ĐIỂM TRẢ ================= */}
        <div className="relative">
          <label className="text-[10px] font-bold text-tertiary uppercase tracking-wider block mb-1.5">
            Điểm trả
          </label>
          
          {/* Nút Trigger */}
          <button
            type="button"
            onClick={() => toggleDropdown('dropoff')}
            className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
              activeDropdown === 'dropoff' 
                ? 'bg-tertiary/10 border-tertiary shadow-[0_0_15px_rgba(196,181,253,0.15)]' 
                : 'bg-surface-variant/30 border-outline-variant/20 hover:border-outline-variant/50'
            }`}
          >
            <div className="overflow-hidden pr-2">
              <p className={`text-xs font-bold truncate ${selectedDropoff ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                {selectedDropoff ? selectedDropoff.name : 'Chọn điểm trả...'}
              </p>
              {selectedDropoff && (
                <p className="text-[10px] text-on-surface-variant truncate">{selectedDropoff.time} • {selectedDropoff.address}</p>
              )}
            </div>
            <ChevronDown size={16} className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${activeDropdown === 'dropoff' ? 'rotate-180' : ''}`} />
          </button>

          {/* MENU THẢ XUỐNG (ABSOLUTE ĐỂ ĐÈ LÊN COMPONENT DƯỚI) */}
          <AnimatePresence>
            {activeDropdown === 'dropoff' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
 
                className="absolute right-0 md:left-0 top-[calc(100%+8px)] w-[280px] sm:w-full bg-[#0f1524] border border-tertiary/30 rounded-2xl shadow-2xl z-50 p-2 space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar backdrop-blur-xl"
              >
                {locations.dropoff.map((loc) => { 
                  const isSelected = selectedDropoff?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setSelectedDropoff(loc);
                        setActiveDropdown(null); // Chọn xong tự đóng
                      }}
                      className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                        isSelected ? 'bg-tertiary/15 text-tertiary' : 'hover:bg-surface-variant/40 text-on-surface'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{loc.name}</span>
                          {isSelected && <Check size={12} className="text-tertiary shrink-0" />}
                        </div>
                        <p className="text-[10px] text-on-surface-variant line-clamp-1">{loc.address}</p>
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-variant text-on-surface-variant border border-outline-variant/10 shrink-0">
                        {loc.time}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}