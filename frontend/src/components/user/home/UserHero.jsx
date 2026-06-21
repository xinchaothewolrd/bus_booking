import { motion } from "framer-motion";
import { MapPin, Calendar, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllRoute } from "../../../services/routeService";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function UserHero ({ defaultValues }) {
  const [routes, setRoutes] = useState([]);
  const [from, setFrom] = useState(defaultValues?.from || "");
  const [to, setTo] = useState(defaultValues?.to || "");
  const [date, setDate] = useState(defaultValues?.date || "");
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const [showFromList, setShowFromList] = useState(false);
  const [showToList, setShowToList] = useState(false);
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
  const fetchRoutes = async () => {
    const res = await getAllRoute();
    setRoutes(res.data);
  };

  fetchRoutes();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        fromRef.current &&
        !fromRef.current.contains(event.target)
      ) {
        setShowFromList(false);
      }

      if (
        toRef.current &&
        !toRef.current.contains(event.target)
      ) {
        setShowToList(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const locations = [
    ...new Set([
      ...routes.map(r => r.departureLocation),
      ...routes.map(r => r.arrivalLocation),
    ]),
  ];

  const filteredFrom = locations.filter((loc) =>
  loc.toLowerCase().includes(from.toLowerCase())
  );

  const filteredTo = locations.filter((loc) =>
    loc.toLowerCase().includes(to.toLowerCase())
  );

  const handleSearch = () => {
    if (!from || !to || !date) {
      toast.error("Nhập đầy đủ thông tin");
      return;
    }

    navigate(
      `/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`
    );
  };

  return (
    <section className="relative h-[650px] w-full flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-60" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe6e0h7e_7bJwF88uumUgKqscbsE1dwusYSKJXo6KD7w8ovuhTmUAC4DK9GgQGFCPACZV3Qp0Dk5_IFc5Lfu6D2wSLiznJEbRQw-9DkOs97BrLOG--JjxKuM6bOnht8GIKzsdOjAW2jemzjz75f_Y6C_d-82jRGYjTHIg-VqWHyZGBSNo6cWy3oPHGHb_X75qqazqfECMfr7J_keanjEOSdXlXOM-Z-YAVSaLQGIQElUrc19ENdLbCnLD89Qn4NxaOz_-aJQgoWLo" 
          alt="Modern high-tech luxury bus at dusk"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/40 via-transparent to-[#0a0e1a]"></div>
      </div>
      <div className="relative z-10 w-full max-w-5xl px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Hành trình đẳng cấp <span className="text-sky-300">OceanBus</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto">
            Kết nối mọi nẻo đường với dịch vụ vận tải 5 sao hàng đầu Việt Nam.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-[#0f1524]/75 backdrop-blur-3xl p-6 md:p-8 rounded-2xl shadow-2xl border border-sky-400/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-sky-300 uppercase tracking-wider ml-1">Điểm đi</label>
              <div className="relative" ref={fromRef}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-300/50 w-5 h-5" />
                <input
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setShowFromList(true);
                  }}
                  onFocus={() => setShowFromList(true)} 
                  className="w-full bg-white/5 border border-slate-700/30 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 text-white placeholder:text-slate-500" 
                  placeholder="Hồ Chí Minh" 
                />
                {showFromList && (
                  <div className="absolute top-full left-0 w-full bg-[#0f1524] border border-slate-700 rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
                    {filteredFrom.map((loc, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setFrom(loc);
                          setShowFromList(false);
                        }}
                        className="px-4 py-2 hover:bg-sky-400/20 cursor-pointer text-white"
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-sky-300 uppercase tracking-wider ml-1">Điểm đến</label>
              <div className="relative" ref={toRef}>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-300/50 w-5 h-5" />
                <input
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setShowToList(true);
                  }}
                  onFocus={() => setShowToList(true)} 
                  className="w-full bg-white/5 border border-slate-700/30 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30 text-white placeholder:text-slate-500" 
                  placeholder="Đà Lạt" 
                />
                {showToList && (
                  <div className="absolute top-full left-0 w-full bg-[#0f1524] border border-slate-700 rounded-lg mt-1 max-h-48 overflow-y-auto z-50">
                    {filteredTo.map((loc, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setTo(loc);
                          setShowToList(false);
                        }}
                        className="px-4 py-2 hover:bg-sky-400/20 cursor-pointer text-white"
                      >
                        {loc}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-sky-300 uppercase tracking-wider ml-1">Ngày đi</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-300/50 w-5 h-5" />
                <input 
                  className="w-full bg-white/5 border-none rounded-xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary-ice/50 transition-all outline-none [color-scheme:dark]" 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <button 
              onClick={handleSearch}
              className="w-full md:w-auto px-12 py-4 bg-sky-400 text-[#001f2e] font-bold rounded-3xl hover:shadow-[0_0_20px_rgba(125,211,252,0.4)] transition-all duration-300 active:scale-95 text-lg">
              Tìm chuyến xe
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};