import { motion } from "framer-motion";

const UserPopularRoute = () => {
  const routes = [
    { from: "Hồ Chí Minh", to: "Đà Lạt", dist: "300km", time: "6 giờ", price: "280.000đ", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD-UI6zdtsxGb9dear9riVT_7ksOneQ-rzsHaVpXr6K-8czOD_H6bBsBsWP55mvz2m6ZBaQt0xRCvlfGWtXncYWqFLFwOoWov1idCO4Qf-teVzHLhekgrngsvaJPjFoZg1f0B7K5jIux-K5YUgFyx6eEQO7M6ZQV1YwVmxKC2bqTAG6MEebBhI05Z8WygZl-Fm_IuIXTfs-NR1B6n9rtTD2utP9XrbhJ5F2Dnm_t04Bj47H-sAQH90cUCHH1ZlR5BOWZLKY0YJxLdU" },
    { from: "Sài Gòn", to: "Nha Trang", dist: "430km", time: "8 giờ", price: "250.000đ", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUEf5MNxqsDAIVv7rLIPt8RBlloW8rz_B2sNiqzB2miBLbmI585Qz6jRxV7o7WtyYz7e-ehUQKXi3acexmI19wcWmwjbHX7o9SyoXnUGeb2NKDiJfhdhmT2B8Qdjo0FG3w5T2lpLGvMKWAa9zWLXeHIE87sufBUeARgZSbyfEGlctdlNmV3Zu8YWlmbSbTzX5QsvMCNJfwJfrdhkdq6vFda8Eq4B2EQRRqJk7zPB7OaxPKUrAa7cvPBWf2OfFySY0qRP1m1D8lZs4" },
    { from: "Sài Gòn", to: "Vũng Tàu", dist: "100km", time: "2 giờ", price: "160.000đ", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUBmTpoHctl5k6ns8OU5VXXz51F6iHOGXwcuiFuTpAzNctzQdYqd3QzxdJSyOjio2iv3Qs_KiDG_JNbzjVDd_jZn0GwSNs1GwKKjiyq7YRxbD2oV2TtaemSAQ2lBQvc2akjMu_V9Sk3HYOrkUBKHRozkEPVGiQeODAzeHF72JTkZxrVnV-Fyy46FEXyrWDu1W4X0kyKDXMntxUctZwjEhb65xxwe5Pm2fOKtc7sH8Ca4EyyNuxpjTMY6bhIFXC_nvujtcG0hYtpIs" },
    { from: "Đà Nẵng", to: "Sài Gòn", dist: "930km", time: "16 giờ", price: "450.000đ", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOnwfA0kmF18ERYrQJT4G4zPbF0DuOAz5UkEw-NnkYMpyyQvNYNSzgdCW0DbHz0_Y6zHemdPJ73mNCL44MmvvUJ8e1zZboLxihfB8Fz7dsRLTls91958WFslMDF4tqcO3e_nF5-OOWLpChNvEDwDVA3UNojAxZjgNq8ANKopsKyc_EaebNtC_uCOosaxGhLfU8j3EqaWM1c6agMMc4bBjV10sxFOcY2m8oEwJ3coeFG7tsiwi8ytyl1wg2AxaYuw0papxEf315BBY" },
  ];

  return (
    <section className="py-20 bg-[#141c2e]/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Tuyến phổ biến</h2>
            <div className="w-20 h-1.5 bg-sky-400 rounded-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {routes.map((route, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-[#0f1524]/75 backdrop-blur-2xl rounded-2xl overflow-hidden group border border-sky-400/10"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  src={route.img} 
                  alt={`${route.from} to ${route.to}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5">
                <div className="text-sm font-semibold text-sky-300 mb-1">{route.from} → {route.to}</div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-400">{route.dist} • {route.time}</div>
                  <div className="text-xl font-extrabold text-sky-300">{route.price}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserPopularRoute;