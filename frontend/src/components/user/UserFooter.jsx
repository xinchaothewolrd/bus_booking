import { Mail, Phone } from "lucide-react";

const UserFooter = () => {
  return (
    <footer className="bg-[#0a0e1a] w-full py-12 border-t border-sky-900/30">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        <div>
          <div className="text-sky-300 font-bold text-xl mb-4">OceanBus</div>
          <div className="text-sm text-slate-500 max-w-md">
            © 2024 OceanBus. Hệ thống đặt vé hiện đại. Cung cấp các chuyến xe chất lượng cao xuyên suốt chiều dài đất nước.
          </div>
        </div>
        <div className="flex flex-col md:items-end">
          <div className="flex space-x-6 mb-4">
            <a className="text-slate-500 hover:text-sky-400 text-sm transition-colors hover:underline decoration-sky-500/50" href="#">Điều khoản</a>
            <a className="text-slate-500 hover:text-sky-400 text-sm transition-colors hover:underline decoration-sky-500/50" href="#">Chính sách bảo mật</a>
            <a className="text-slate-500 hover:text-sky-400 text-sm transition-colors hover:underline decoration-sky-500/50" href="#">Hỗ trợ</a>
          </div>
          <div className="flex space-x-4 opacity-80 hover:opacity-100 transition-opacity">
            <Mail className="w-5 h-5 text-sky-400 cursor-pointer" />
            <Phone className="w-5 h-5 text-sky-400 cursor-pointer" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;