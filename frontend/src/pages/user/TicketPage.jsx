import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
// Giả sử mày import useAuthStore và hàm gọi API từ đường dẫn này
import useAuthStore from "../../store/useAuthStore";
import { getTicketByUser } from "../../services/ticketService"; // Sửa lại path cho đúng file chứa API của mày
import { cancelBooking } from "../../services/bookingService";
import TicketCard from "../../components/user/ticket/TicketCard";
import ETicketModal from "../../components/user/ticket/ETicketModal";

export default function TicketPage() {
  const user = useAuthStore((s) => s.user);
  const [ticketFilter, setTicketFilter] = useState("upcoming");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // State quản lý API
  const [groupedTickets, setGroupedTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTickets = async () => {
      // Nếu chưa có user thì không gọi
      if (!user?.id) return;

      setLoading(true);
      setError(null);

      try {
        const response = await getTicketByUser(user.id);
        const rawTickets = response.data;

        // 🔥 GỘP VÉ (GROUP BY BOOKING ID)
        // Vì 1 booking có thể có nhiều ghế, ta gộp chung lại 1 thẻ cho đẹp
        const groups = {};

        rawTickets.forEach((item) => {
          const bId = item.bookingId;
          if (!groups[bId]) {
            // Xử lý format ngày giờ từ created_at (hoặc mày có thể lấy từ bảng Trip nếu API có)
            const dateObj = new Date(item.created_at);
            const formattedDate = dateObj.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });

            // Map dữ liệu từ Backend sang chuẩn UI của mày
            groups[bId] = {
              id: bId, // Dùng bookingId làm ID chính cho Card
              code: item.qrCode,
              status:
                item.Booking?.status === "paid"
                  ? "upcoming"
                  : item.Booking?.status,
              statusTicket: item?.status,
              from: item.Booking.Trip.route.departureLocation,
              to: item.Booking.Trip.route.arrivalLocation,
              departureTime:
                item.Booking?.Trip?.departureTime || "2024-12-31T08:00:00Z", // API chưa có giờ chạy chính xác của Trip, tao để tạm
              arrivalTime:
                item.Booking?.Trip?.arrivalTime || "2024-12-31T12:00:00Z", // API chưa có giờ chạy chính xác của Trip, tao để tạm
              timeRange: "Dự kiến", // API chưa có giờ chạy chính xác của Trip
              date: formattedDate,
              seats: [], // Mảng chứa các ghế
              pickupLocation: item.PickupStop
                ? `${item.PickupStop.stopName} (${item.PickupStop.address})`
                : "Chưa đăng ký điểm đón",
              dropoffLocation: item.DropoffStop
                ? `${item.DropoffStop.stopName} (${item.DropoffStop.address})`
                : "Chưa đăng ký điểm trả",
              // Lưu lại danh sách vé gốc để hiển thị QR riêng nếu cần
              rawTickets: [],
              passengerName: item.passengerName,
              totalAmount: item.Booking?.totalAmount,
              created_at: item.created_at,
            };
          }
          // Đẩy ghế và vé gốc vào nhóm
          if (item.Seat?.seatNumber) {
            groups[bId].seats.push(item.Seat.seatNumber);
          }
          groups[bId].rawTickets.push(item);
        });

        // Chuyển object thành mảng và join mảng ghế thành chuỗi (VD: "A4, A7")
        const processedTickets = Object.values(groups).map((group) => ({
          ...group,
          seats: group.seats.join(", "),
        }));

        processedTickets.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );

        setGroupedTickets(processedTickets);
      } catch (err) {
        console.error("Lỗi lấy danh sách vé:", err);
        setError("Không thể tải dữ liệu vé. Vui lòng thử lại sau!");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.id]);

  const handleCancelTicket = async (bookingId) => {
    // 1. Hỏi cho chắc, lỡ khách bấm nhầm
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    try {
      // 2. Gọi API Backend
      const res = await cancelBooking(bookingId);

      // Thông báo thành công (có số tiền hoàn lại từ backend)
      toast.success(res.data?.message || "Hủy vé thành công!");

      // 3. Cập nhật State để UI tự nhảy vé sang tab "Đã hủy"
      setGroupedTickets((prevTickets) =>
        prevTickets.map((t) =>
          t.id === bookingId
            ? { ...t, status: "cancelled", statusTicket: "cancelled" }
            : t,
        ),
      );

      // 4. Đóng pop-up E-ticket lại
      setSelectedTicket(null);
    } catch (err) {
      console.error("Lỗi khi hủy vé:", err);
      // Bắt câu chửi của Backend (ví dụ: Sắp đến giờ chạy cấm hủy)
      alert(
        err.response?.data?.message ||
          "Đã xảy ra lỗi, không thể hủy vé lúc này.",
      );
    }
  };

  // Lọc vé theo bộ lọc hiện tại
  const filteredTickets = groupedTickets.filter((t) => {
    if (ticketFilter === "upcoming") {
      return t.statusTicket === "unused";
    }
    if (ticketFilter === "completed") {
      return t.statusTicket === "completed" || t.statusTicket === "used";
    }
    if (ticketFilter === "cancelled") {
      return t.statusTicket === "cancelled";
    }
    return false;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/30 selection:text-primary">
      <main className="flex-1 w-full max-w-5xl mt-16 mx-auto p-4 md:py-10 md:px-6">
        <section className="flex flex-col gap-8">
          {/* Tiêu đề trang */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-on-surface">
              Vé của tôi
            </h1>
            <p className="text-on-surface-variant">
              Quản lý các chuyến đi sắp tới và lịch sử di chuyển của bạn.
            </p>
          </div>

          {/* BỘ LỌC VÉ */}
          <div className="sticky top-[64px] z-40 border-b border-outline bg-background/95 backdrop-blur-md pt-4 -mx-4 px-4 md:-mx-6 md:px-6 transition-all">
            <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {[
                { id: "upcoming", label: "Sắp đi" },
                { id: "completed", label: "Đã hoàn thành" },
                { id: "cancelled", label: "Đã hủy" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTicketFilter(tab.id)}
                  className={`pb-4 px-2 text-sm font-semibold tracking-wide transition-all border-b-2 relative whitespace-nowrap ${
                    ticketFilter === tab.id
                      ? "text-primary border-primary"
                      : "text-on-surface-variant border-transparent hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                  {ticketFilter === tab.id && (
                    <motion.div
                      layoutId="activeFilterTabBadge"
                      className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TRẠNG THÁI HIỂN THỊ DỮ LIỆU */}
          <div className="flex flex-col gap-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p>Đang tải danh sách vé...</p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
                {error}
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant border border-dashed border-outline rounded-2xl">
                Không tìm thấy chuyến đi nào trong danh mục này.
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onShowTicket={setSelectedTicket}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>
      </main>

      {/* Pop-up xem mã QR E-ticket */}
      <AnimatePresence>
        {selectedTicket && (
          <ETicketModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onCancel={() => handleCancelTicket(selectedTicket.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
