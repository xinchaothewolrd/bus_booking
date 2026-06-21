import { Star, Wifi, Coffee, Bed, BadgeCheck, Usb, Tv } from 'lucide-react';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const facilityIcons = {
  wifi: Wifi,
  water: Coffee,
  bed: Bed,
  usb: Usb,
  tv: Tv,
};

export default function BusCard({
  company = "OceanBus",
  rating = "4.5",
  reviews = "100 đánh giá",
  bus_type = "Limousine",
  departureTime = "--:--",
  departureLoc = "--",
  duration = "--",
  arrivalTime = "--:--",
  arrivalLoc = "--",
  price = "Liên hệ",
  oldPrice = null,
  tripId = "--",
  isPopular = false,
  facilities = [],
}) {
  const navigate = useNavigate(); 

  const handleClick = () => {
    navigate(`/booking/${tripId}`);
    window.scrollTo(0, 0);
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card hover:glass-card-elevated transition-all p-6 rounded-2xl group relative overflow-hidden"
    >
      {isPopular && (
        <div className="absolute top-0 right-0 p-3">
          <span className="bg-primary-ice/10 text-primary-ice text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter border border-primary-ice/20">
            Bán chạy
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* LEFT */}
        <div className="w-full md:w-48">
          <div className="mb-2">
            <h3 className="font-bold text-xl text-white">
              {company}
            </h3>
            <p className="nline-block text-[10px] bg-sky-400/10 text-sky-300 px-2 py-1 rounded-md mt-1">
              {bus_type}
            </p>
          </div>

          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
            <Star size={14} className="fill-primary-ice text-primary-ice" />
            {rating} ({reviews})
          </p>

          <div className="flex gap-3">
            {facilities.length > 0 ? (
              facilities.map((fac, index) => {
                const Icon = facilityIcons[fac];
                return Icon ? (
                  <Icon
                    key={fac + index}
                    size={18}
                    className="text-slate-400 group-hover:text-primary-ice transition-colors"
                  />
                ) : null;
              })
            ) : (
              <span className="text-xs text-slate-500">
                Không có tiện ích
              </span>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 border-x border-sky-400/10 px-6">
          <div className="flex items-center justify-between mb-6">
            
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">
                {departureTime}
              </span>
              <span className="text-xs text-slate-400">
                {departureLoc}
              </span>
            </div>

            <div className="flex-1 px-4 flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                {duration}
              </span>

              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent relative mt-2">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary-ice shadow-[0_0_8px_rgba(125,211,252,0.8)]"></div>
              </div>
            </div>

            <div className="text-center">
              <span className="block text-2xl font-bold text-white">
                {arrivalTime}
              </span>
              <span className="text-xs text-slate-400">
                {arrivalLoc}
              </span>
            </div>
          </div>

          <div className="bg-sky-400/5 rounded-lg p-3 flex items-center gap-3 border border-sky-400/10">
            <BadgeCheck size={16} className="text-primary-ice" />
            <span className="text-xs text-sky-300/80">
              Chính sách hoàn tiền 100% khi hủy trước 24h
            </span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full md:w-44 flex flex-col justify-between items-end">
          <div className="text-right">
            {oldPrice && (
              <span className="block text-slate-500 line-through text-xs">
                {oldPrice}
              </span>
            )}
            <span className="text-2xl font-black text-primary-ice">
              {price}
            </span>
          </div>

          <button 
            className="w-full bg-sky-500/10 text-primary-ice border border-sky-500/20 font-bold py-3 
            rounded-xl hover:bg-primary-ice hover:text-slate-950 transition-all active:scale-95 cursor-pointer"
            onClick = {handleClick}
            >
            Chọn chuyến
          </button>
        </div>

      </div>
    </motion.div>
  );
}