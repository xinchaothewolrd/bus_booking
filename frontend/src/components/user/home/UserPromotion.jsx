import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const UserPromotion = () => {
  const promos = [
    {
      tag: "Mới nhất",
      title: "Ưu đãi hè - Giảm ngay 20%",
      desc: "Áp dụng cho các tuyến du lịch biển",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnPZ300Zjatq_LOap2iwtwDu3MLDO-3kmH0vMW4BScf2fAaobhW6xaDoK1SBjDoKKdymqcLgGKEPYt6fgjhJjbxZ4c_JBSQST_hdpVhAhXpkGVQCKzBNWLSMlpOGxbtnd5c411jZBH3BBfZYLcyHRbJ7hoBFtHFcfw9tElGtgZ9ejSjCZRpxHrRuagqfAo7IYHJXKrk_H5ywXPszkRAUwCzh8lxWxdOgs4DuruZRS1YAi9_C_lupprJ5UvEQW12R-xZucCVdeHkqA",
      color: "bg-sky-400"
    },
    {
      tag: "Đặc quyền",
      title: "Đi càng đông - Giá càng rẻ",
      desc: "Nhóm từ 5 người giảm thêm 15%",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnYGRkmotN8gvTRQsxXJ-52P-TqV-qe6Bky4qsJwhvV6-EmnhwOrSO6KHsMwqOKddSJBkNPo-EkZsahv6E9ePUFENlN3Kzb9LScu9K6hB-bJnm8N7aBCP0z1Eml6dH41hHoVGe7hnnws5dBRIeeqH5iFxm-CzKJwVw2UdXbdnxVPe5kCbuMDiwtWznx_mAwsRTaTN_bflE0LDBXV-WIkwNgwVtrhU5h4mM56-GcOEFzmH4QGV0IYj6xW18rhwzRwGeWo99qCsnfXU",
      color: "bg-purple-400"
    },
    {
      tag: "App Only",
      title: "Tải App OceanBus",
      desc: "Nhận ngay voucher 50.000đ khi đặt vé",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHC2l4lOfqLsmtPkNrOpEO_L-JlpZKtbA3VXfxSuBy-NfMuhvO1fr4xWjnfrk4odkLwnta2NqcPJoMknA0p4jZXT8X4ogZb15VPBTv6nYGjogXJugPlaAd6QJ2XEChmvQBSXTiget-qIHJZ-BTqZg3o-kZ0X7uVYtITtRtmkjE_2Xnzx0FogSZztpM1OAFejxx51HYu2r6VLsak7xuqfckRNLvvmUlZJYzeFyHEjzsVbVch_3GJ-L0M8n1hq65DwreZQsQK_YTWRc",
      color: "bg-blue-400"
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Khuyến mãi nổi bật</h2>
            <div className="w-20 h-1.5 bg-sky-400 rounded-full"></div>
          </div>
          <a className="text-sky-400 font-semibold flex items-center hover:underline" href="#">
            Xem tất cả <ArrowRight className="ml-1 w-5 h-5" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promos.map((promo, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="group relative overflow-hidden rounded-2xl aspect-[16/9] bg-[#0f1524]/60 backdrop-blur-lg border border-sky-400/10 cursor-pointer"
            >
              <img 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" 
                src={promo.img} 
                alt={promo.title}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className={`inline-block px-3 py-1 ${promo.color} text-[#001f2e] text-xs font-bold rounded-full mb-3 uppercase`}>
                  {promo.tag}
                </span>
                <h3 className="text-xl font-bold text-white mb-1">{promo.title}</h3>
                <p className="text-slate-300 text-sm">{promo.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserPromotion;