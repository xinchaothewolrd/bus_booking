import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Smartphone,
  QrCode,
  Ticket,
  Home,
  ArrowLeft,
} from "lucide-react";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const responseCode = searchParams.get("vnp_ResponseCode");
  const bookingId = searchParams.get("bookingId") || searchParams.get("vnp_TxnRef");
  const amountParam = searchParams.get("amount") || searchParams.get("vnp_Amount");
  const amount = amountParam ? (searchParams.get("amount") ? parseInt(amountParam) : amountParam / 100) : 0;
  const transactionNo = searchParams.get("transactionNo") || searchParams.get("vnp_TransactionNo");
  const statusParam = searchParams.get("status");

  const isSuccess = statusParam === "success" || responseCode === "00";

  useEffect(() => {
    // Backend đã xử lý redirect và truyền status rồi, ta chỉ việc hiển thị
    // Không cần gọi fetch báo backend lần nữa vì backend ngrok đã lo
    setLoading(false);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-sky-400 font-bold animate-pulse text-xl">
          Đang xác thực giao dịch...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-sky-500/30">
      <main className="relative pt-24 pb-16 px-6">
        <div className="max-w-xl mx-auto">
          {" "}
          {/* max-w-2xl -> max-w-xl */}
          {/* Payment Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`relative bg-[#0f1524]/75 backdrop-blur-2xl border ${
              isSuccess ? "border-sky-400/15" : "border-red-400/15"
            } rounded-3xl p-6 md:p-10 text-center overflow-hidden shadow-2xl`} // p-8/p-12 -> p-6/p-10
          >
            {/* Subtle glow inside the card - Giữ nguyên kích thước */}
            <div
              className={`absolute top-0 right-0 w-64 h-64 ${
                isSuccess ? "bg-sky-500/5" : "bg-red-500/5"
              } rounded-full -mr-32 -mt-32 blur-3xl`}
            />

            {/* Icon - Giảm kích thước */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
                // w-28/h-28 -> w-24/h-24
                isSuccess
                  ? "bg-sky-500/10 border-sky-500/20 shadow-[0_0_50px_rgba(125,211,252,0.15)]"
                  : "bg-red-500/10 border-red-500/20 shadow-[0_0_50px_rgba(248,113,113,0.15)]"
              } mb-8`} // mb-10 -> mb-8
            >
              {isSuccess ? (
                <CheckCircle2
                  size={48}
                  className="text-sky-400 fill-sky-400/10"
                /> // size 56 -> 48
              ) : (
                <XCircle size={48} className="text-red-400 fill-red-400/10" /> // size 56 -> 48
              )}
            </motion.div>

            {/* Header - Giảm kích thước chữ */}
            <h1 className="text-2xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
              {" "}
              {/* text-3xl/5xl -> text-2xl/4xl, mb-4 -> mb-3 */}
              {isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại"}
            </h1>
            <p className="text-slate-400 text-base md:text-lg mb-10 max-w-sm mx-auto leading-relaxed">
              {" "}
              {/* text-lg/xl -> text-base/lg, mb-12 -> mb-10, max-w-md -> max-w-sm */}
              {isSuccess
                ? "Cảm ơn bạn đã tin tưởng OceanBus. Vé đã sẵn sàng cho chuyến hành trình rồi đấy!"
                : "Giao dịch không thành công hoặc bạn đã hủy giữa chừng."}
            </p>

            {/* Bento Details (Chỉ hiện khi thành công) - Giảm kích thước/padding */}
            {isSuccess && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left mb-10">
                {" "}
                {/* gap-4 -> gap-3, mb-12 -> mb-10 */}
                <div className="bg-[#141c2e]/60 backdrop-blur-md border border-sky-400/10 p-4 rounded-xl hover:border-sky-400/20 transition-colors">
                  {" "}
                  {/* p-5 -> p-4, rounded-2xl -> rounded-xl */}
                  <span className="text-[9px] uppercase tracking-widest font-bold text-sky-400/60 block mb-1">
                    Mã đơn hàng
                  </span>{" "}
                  {/* text-[10px] -> text-[9px] */}
                  <span className="text-white font-bold text-base">
                    #{bookingId}
                  </span>{" "}
                  {/* text-lg -> text-base */}
                </div>
                <div className="bg-[#141c2e]/60 backdrop-blur-md border border-sky-400/10 p-4 rounded-xl hover:border-sky-400/20 transition-colors">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-sky-400/60 block mb-1">
                    Tổng thanh toán
                  </span>
                  <span className="text-white font-bold text-base">
                    {amount.toLocaleString()} VND
                  </span>
                </div>
                <div className="md:col-span-2 bg-[#141c2e]/60 backdrop-blur-md border border-sky-400/10 p-5 rounded-xl hover:border-sky-400/20 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  {" "}
                  {/* p-6 -> p-5, rounded-2xl -> rounded-xl, gap-4 -> gap-3 */}
                  <div>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-sky-400/60 block mb-1">
                      Mã giao dịch VNPay
                    </span>
                    <span className="text-white font-bold text-base">
                      {transactionNo}
                    </span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-sky-400/60 block mb-1">
                      Trạng thái
                    </span>
                    <span className="text-sky-300 font-bold text-base uppercase">
                      Đã thanh toán
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions - Giảm kích thước nút */}
            <div className="space-y-4">
              {" "}
              {/* space-y-6 -> space-y-4 */}
              {isSuccess ? (
                <button
                  onClick={() => navigate("/ticket")}
                  className="group relative w-full py-4 bg-sky-400 text-[#001f2e] font-bold text-base rounded-xl shadow-[0_0_20px_rgba(125,211,252,0.3)] hover:shadow-[0_0_40px_rgba(125,211,252,0.5)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2" // py-5 -> py-4, text-lg -> text-base, rounded-2xl -> rounded-xl, shadow size reduced
                >
                  <Ticket size={18} /> Xem vé điện tử {/* size 20 -> 18 */}
                </button>
              ) : (
                <button
                  onClick={() => navigate(-1)}
                  className="group relative w-full py-4 bg-red-500 text-white font-bold text-base rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} /> Thử thanh toán lại
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="block w-full py-1 text-slate-400 hover:text-sky-300 font-semibold transition-colors duration-200 flex items-center justify-center gap-2 text-sm" // py-2 -> py-1, added text-sm
              >
                <Home size={16} /> Về trang chủ {/* size 18 -> 16 */}
              </button>
            </div>
          </motion.div>
          {/* Promotion Section - Giảm kích thước */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-5">
            {" "}
            {/* mt-10 -> mt-8, gap-6 -> gap-5 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="md:col-span-3 bg-[#0f1524]/60 backdrop-blur-xl border border-sky-400/10 p-5 rounded-3xl flex items-center gap-6 hover:border-sky-400/20 transition-all cursor-pointer group" // p-6 -> p-5, gap-8 -> gap-6
            >
              <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-xl bg-sky-500/10 group-hover:bg-sky-500/20 transition-colors shrink-0">
                {" "}
                {/* w-20/h-20 -> w-16/h-16, rounded-2xl -> rounded-xl */}
                <Smartphone className="text-sky-400" size={30} />{" "}
                {/* size 36 -> 30 */}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Tải ứng dụng OceanBus
                </h3>{" "}
                {/* text-xl -> text-lg, mb-2 -> mb-1 */}
                <p className="text-slate-400 text-xs leading-relaxed">
                  {" "}
                  {/* text-sm -> text-xs */}
                  Nhận thông báo lịch trình thực tế và ưu đãi độc quyền lên đến{" "}
                  <span className="text-sky-300 font-bold">20%</span>.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-[#0f1524]/60 backdrop-blur-xl border border-sky-400/10 p-5 rounded-3xl flex flex-col items-center justify-center text-center gap-2 hover:border-sky-400/20 transition-all cursor-pointer group" // p-6 -> p-5, gap-3 -> gap-2
            >
              <QrCode
                size={32}
                className="text-purple-400 group-hover:scale-110 transition-transform"
              />{" "}
              {/* size 40 -> 32 */}
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                Quét tải app
              </span>{" "}
              {/* text-[10px] -> text-[8px] */}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
