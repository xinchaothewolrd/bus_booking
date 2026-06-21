import { motion } from "framer-motion";
import { MapPin, Users, Search } from "lucide-react";
const UserStats = () => {
  const stats = [
    { label: "Lượt khách tin dùng", value: "40 Triệu+", icon: Users, color: "text-sky-300", bg: "bg-sky-400/10" },
    { label: "Phòng vé toàn quốc", value: "350+", icon: MapPin, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Chuyến xe mỗi ngày", value: "6,500+", icon: Search, color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  return (
    <section className="py-16 bg-[#0a0e1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="bg-[#0f1524]/60 backdrop-blur-lg border border-sky-400/10 p-8 rounded-2xl flex items-center space-x-6 hover:shadow-[0_0_30px_rgba(125,211,252,0.1)] transition-all"
            >
              <div className={`w-16 h-16 rounded-full ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-slate-400 font-medium">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserStats;