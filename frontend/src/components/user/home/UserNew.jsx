import { motion } from "framer-motion";
const UserNew = () => {
  const articles = [
    {
      tag: "HỆ THỐNG",
      title: "OceanBus ra mắt dòng xe limousine phòng nằm cao cấp mới",
      desc: "Nâng cấp trải nghiệm khách hàng với hệ thống giải trí riêng biệt và ghế massage cao cấp...",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcMesAITpVR8xDpUAVLCDe3yeFDPW9ChORUcmgPhxbK0_lclmJHusTV4XK6Gqek_BBPc2xEMiXHWMonelaOm-SrHe9bdq4m-YuPPPfaIpAt8WFSfoQl26ofBxxRitu3NKnlygTZTIj4pDSBugavMKwxTOk8twPyPVT5RrNBeP5zchnrzC_tLcT6-sYcfrBjI05odIPURgMhaGZIN_rgaQ-1y5pcqfG9sJT5wdkSmdoVdZQPxRs_nGMyhKIF-x-5sR-Vlo1Sr_sgc8",
      color: "text-sky-300"
    },
    {
      tag: "CẨM NANG",
      title: "Top 5 địa điểm du lịch không thể bỏ qua tại Đà Lạt mùa thu này",
      desc: "Mùa thu Đà Lạt mang vẻ đẹp mộng mơ với những hàng thông xanh và sương mù bao phủ...",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBChrkZZy_5VdgfScS2cBv6CqMFNTzHzGIx-ymbHVgcLLTxXAIpT8dVPJprWdK6yW03RACFFG9-diuBzTl5hzg9ac6Xx76RTGUyIlbkcaF2AO5uUVaPQPPQg7SCz5htyqVabYhfqMorswTOPYvq9c5Z2Znd_y95OVLVF1yZGkb3--vedrBVZEFekVvf8wNYKhvxuq6_ch6JNFGUdG-G-94YXeKA9JzkmCwL159zWOQCHRhTPabywpN1OgQawmgmy3rYrbDtG8dIPhE",
      color: "text-purple-400"
    },
    {
      tag: "KHUYẾN MÃI",
      title: "Hướng dẫn nhận ngay voucher 100k cho khách hàng lần đầu đặt vé qua web",
      desc: "Chỉ với vài bước đơn giản trên website mới của OceanBus, bạn sẽ nhận được mã ưu đãi cực khủng...",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrpioHH4Ucy1ZB4QyuT7kB-fFs5cSCxgVufGkMukb8VyJOLzdZ-_a-6TsCJvlW9M_BMZytz7IfAPyY__HRZulDk8yir4mfQQfnlmyQGJe0Mn0IOFR7yiVpZ0i06LNy0my_laH03ktuGDz1V6nTeY8mnD1t9MiD_9CyGwt0Ks4k1qoVHxWzcuiB0QSWWREyI8WNBJruoz3tn29uX7mfKO9wirG_nidIUpkNiq48ED09JJZtu2X6xkcTD-ejWKSYMXxakjBJ5OEjq_o",
      color: "text-blue-400"
    }
  ];

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Tin tức mới</h2>
            <div className="w-20 h-1.5 bg-sky-400 rounded-full"></div>
          </div>
        </div>
        <div className="flex space-x-6 overflow-x-auto pb-8 scrollbar-hide">
          {articles.map((article, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.01 }}
              className="min-w-[320px] bg-[#0f1524]/60 backdrop-blur-lg p-4 rounded-2xl border border-sky-400/10 hover:shadow-[0_0_30px_rgba(125,211,252,0.1)] transition-all"
            >
              <img 
                className="w-full h-40 object-cover rounded-xl mb-4" 
                src={article.img} 
                alt={article.title}
                referrerPolicy="no-referrer"
              />
              <div className={`text-xs ${article.color} font-bold mb-2`}>{article.tag}</div>
              <h4 className="font-bold text-white line-clamp-2 mb-2">{article.title}</h4>
              <p className="text-slate-400 text-sm line-clamp-3">{article.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UserNew;