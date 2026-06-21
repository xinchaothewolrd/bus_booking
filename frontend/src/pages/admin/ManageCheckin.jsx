import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Constants ────────────────────────────────────────────────────────────────
const TICKET_STATUS_META = {
  unused:    { label: "Chưa lên xe",    color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  used:      { label: "Đã lên xe",      color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" },
  cancelled: { label: "Vé đã bị hủy",   color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const PAYMENT_STATUS_META = {
  paid:      { label: "Đã thanh toán",  color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" },
  pending:   { label: "Chưa thanh toán", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  cancelled: { label: "Đã hủy",        color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const PAGE_SIZE = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDatetime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
function fmtPrice(p) {
  if (!p && p !== 0) return "—";
  return Number(p).toLocaleString("vi-VN") + "đ";
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      className="fixed bottom-6 right-6 z-100 flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-xl animate-slide-up"
      style={{ backgroundColor: type === "error" ? "#ef4444" : "#059669" }}
    >
      {type === "error"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  );
}

function Spinner({ small }) {
  return (
    <div className={`flex items-center justify-center ${small ? "py-6" : "py-20"}`}>
      <div className={`border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin ${small ? "w-5 h-5" : "w-8 h-8"}`} />
    </div>
  );
}

export default function ManageCheckin() {
  const [role, setRole] = useState("staff");
  const [activeTab, setActiveTab] = useState("scan"); // scan | list
  const [toast, setToast] = useState(null);

  // Scan states
  const [qrInput, setQrInput] = useState("");
  const [ticket, setTicket] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // List states (Admin only fallback)
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [searchPassenger, setSearchPassenger] = useState("");
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(false);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Get current user role
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      if (u?.role) setRole(u.role);
    } catch {
      setRole("staff");
    }
  }, []);

  // Fetch trips and routes for Boarding List
  useEffect(() => {
    if (role === "admin") {
      const fetchListDependencies = async () => {
        try {
          const [tRes, rRes, bRes] = await Promise.all([
            api.get("/trips"),
            api.get("/routes"),
            api.get("/bookings"),
          ]);
          setTrips(Array.isArray(tRes.data) ? tRes.data : tRes.data.data ?? []);
          setRoutes(Array.isArray(rRes.data) ? rRes.data : rRes.data.data ?? []);
          setBookings(Array.isArray(bRes.data) ? bRes.data : bRes.data.data ?? []);
        } catch (err) {
          console.error("Lỗi tải thông tin danh sách soát vé:", err);
        }
      };
      fetchListDependencies();
    }
  }, [role]);

  // Global Check QR / Ticket ID
  const handleSearchTicket = async (e) => {
    if (e) e.preventDefault();
    if (!qrInput.trim()) return;

    setLoadingSearch(true);
    setTicket(null);
    try {
      const { data } = await api.get(`/tickets/check/${qrInput.trim()}`);
      if (data?.ticket) {
        setTicket(data.ticket);
        showToast("Tìm thấy thông tin vé!");
      } else {
        showToast("Không tìm thấy thông tin vé", "error");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tìm thấy vé hoặc bạn không có quyền truy cập.";
      showToast(msg, "error");
    } finally {
      setLoadingSearch(false);
    }
  };

  // Perform Check-in action
  const handleCheckIn = async (ticketId) => {
    if (!ticketId) return;
    setCheckingIn(true);
    try {
      const { data } = await api.patch(`/tickets/${ticketId}/checkin`);
      showToast(data?.message || "Check-in thành công!");
      
      // Update local state if in scan view
      if (ticket && ticket.id === ticketId) {
        setTicket((prev) => prev ? { ...prev, status: "used" } : null);
      }

      // Update bookings tickets if in list view
      setBookings((prev) => 
        prev.map((b) => {
          if (b.Tickets) {
            return {
              ...b,
              Tickets: b.Tickets.map((tk) => tk.id === ticketId ? { ...tk, status: "used" } : tk)
            };
          }
          return b;
        })
      );
    } catch (err) {
      const msg = err?.response?.data?.message || "Check-in thất bại. Vui lòng thử lại.";
      showToast(msg, "error");
    } finally {
      setCheckingIn(false);
    }
  };

  // Helpers for list view mapping
  const getTrip = (id) => trips.find((t) => t.id === id || t.id === Number(id));
  const getRoute = (tripId) => {
    const trip = getTrip(tripId);
    return trip ? routes.find((r) => r.id === trip.routeId || r.id === Number(trip.routeId)) : null;
  };

  // Extract all tickets from bookings for the selected trip
  const getTicketsForSelectedTrip = () => {
    if (!selectedTripId) return [];
    
    const tripBookings = bookings.filter((b) => b.tripId == selectedTripId && b.status === "paid");
    let list = [];
    tripBookings.forEach((b) => {
      // Vì dữ liệu thật có thể liên kết ticket qua bảng Tickets
      const userFullName = b.User?.fullName ?? "Khách vãng lai";
      const userPhone = b.User?.phone ?? b.User?.phoneNumber ?? "—";
      
      if (b.Tickets && Array.isArray(b.Tickets)) {
        b.Tickets.forEach((t) => {
          list.push({
            id: t.id,
            qrCode: t.qrCode,
            passengerName: t.passengerName || userFullName,
            passengerPhone: t.passengerPhone || userPhone,
            seatNumber: t.tripSeat?.seatNumber ?? "—",
            status: t.status,
            bookingId: b.id,
            createdAt: b.createdAt
          });
        });
      } else {
        // Fallback nếu Backend chưa include Tickets
        list.push({
          id: `BK-${b.id}`,
          qrCode: `QR-BK-${b.id}`,
          passengerName: userFullName,
          passengerPhone: userPhone,
          seatNumber: "—",
          status: b.status === "paid" ? "unused" : "cancelled",
          bookingId: b.id,
          createdAt: b.createdAt
        });
      }
    });

    // Apply passenger search filter
    if (searchPassenger.trim()) {
      const q = searchPassenger.toLowerCase();
      list = list.filter(
        (t) =>
          t.passengerName.toLowerCase().includes(q) ||
          t.passengerPhone.includes(q) ||
          t.seatNumber.toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }
    return list;
  };

  const tripTickets = getTicketsForSelectedTrip();
  const totalPages = Math.max(1, Math.ceil(tripTickets.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = tripTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Statistics for the selected trip
  const tripStats = {
    total: tripTickets.length,
    checkedIn: tripTickets.filter((t) => t.status === "used").length,
    remaining: tripTickets.filter((t) => t.status === "unused").length,
  };

  return (
    <>
      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slide-up { animation: slide-up .25s ease-out }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        .pulse-button { position: relative; }
        .pulse-button::after {
          content: ''; position: absolute; inset: -4px; rounded: inherit;
          border: 2px solid #10b981; animation: pulse-ring 2s infinite; pointer-events: none;
        }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 rounded-md bg-emerald-500 inline-block"></span>
              Soát vé hành khách
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Tra cứu thông tin vé qua mã QR/mã số vé và xác nhận khách lên xe.
            </p>
          </div>

          {/* Role Indicator Accent */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${role === "staff" ? "bg-emerald-500 animate-ping" : "bg-blue-500"}`} />
            <span className="text-xs font-bold text-slate-700">
              Quyền: {role === "staff" ? "Nhân viên phòng vé" : "Quản trị viên (Full Access)"}
            </span>
          </div>
        </div>

        {/* Tab Controls (Only shown for Admin, Staff degrades to scanning view only) */}
        {role === "admin" && (
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("scan")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === "scan" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M7 7h3v3H7zm7 0h3v3h-3zm0 7h3v3h-3zm-7 0h3v3H7z" />
              </svg>
              Quét nhanh mã QR
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${activeTab === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
              Danh sách theo chuyến
            </button>
          </div>
        )}

        {/* ─── TAB 1: SCAN/INPUT TICKET CODE ────────────────────────────────────────── */}
        {activeTab === "scan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Search Box */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Nhập thông tin soát vé</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sử dụng súng quét mã QR, camera, hoặc gõ trực tiếp mã số vé.</p>
              </div>

              <form onSubmit={handleSearchTicket} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 4v1m0 14v1m8-8h-1M4 12h1" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="6" />
                    </svg>
                  </span>
                  <input
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Quét mã QR hoặc Nhập mã số vé (Ví dụ: TICKET-...)"
                    className="w-full text-sm text-slate-800 py-3 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition"
                  />
                  {qrInput && (
                    <button 
                      type="button" 
                      onClick={() => setQrInput("")} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loadingSearch || !qrInput.trim()}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loadingSearch ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                  )}
                  Kiểm tra thông tin vé
                </button>
              </form>

              {/* Staff quick helpers */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-2 mt-4 text-emerald-800 text-xs">
                <p className="font-bold flex items-center gap-1">
                  💡 Hướng dẫn nhanh cho phụ xe:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-emerald-700/90 font-medium">
                  <li>Yêu cầu khách mở Gmail hiển thị **Vé điện tử PDF** hoặc **Mã QR**.</li>
                  <li>Di chuyển con trỏ vào ô nhập liệu và quét mã QR bằng súng quét.</li>
                  <li>Nếu súng quét không nhận, vui lòng nhập mã chữ dưới mã QR.</li>
                  <li>Hệ thống chỉ cho phép lên xe đối với các vé **Đã thanh toán (paid)**.</li>
                </ul>
              </div>
            </div>

            {/* Scanned Result Board */}
            <div className="lg:col-span-7">
              {loadingSearch ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
                  <Spinner />
                  <p className="text-xs text-slate-400 mt-2 font-medium">Đang truy vấn hệ thống vé...</p>
                </div>
              ) : ticket ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5 animate-slide-up relative overflow-hidden">
                  
                  {/* Status Overlay Band */}
                  <div 
                    className="absolute top-0 right-0 left-0 h-1.5" 
                    style={{ backgroundColor: TICKET_STATUS_META[ticket.status]?.color ?? "#94a3b8" }}
                  />

                  {/* Ticket Header Details */}
                  <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-100 pb-4">
                    <div>
                      <p className="text-[10px] font-mono text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded w-fit">MÃ VÉ: {ticket.qrCode}</p>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1.5">{ticket.passengerName}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">📞 {ticket.passengerPhone}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái vé</p>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mt-1"
                        style={{
                          color: TICKET_STATUS_META[ticket.status]?.color,
                          backgroundColor: TICKET_STATUS_META[ticket.status]?.bg,
                          boxShadow: `0 0 0 1px ${TICKET_STATUS_META[ticket.status]?.border}`
                        }}
                      >
                        {TICKET_STATUS_META[ticket.status]?.label}
                      </span>
                    </div>
                  </div>

                  {/* Trip Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Tuyến xe</p>
                      {(() => {
                        const trip = getTrip(ticket.booking?.tripId);
                        const route = trip ? routes.find((r) => r.id === trip.routeId) : null;
                        return route ? (
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{route.departureLocation}</p>
                            <p className="text-[11px] text-slate-500 leading-tight">đến {route.arrivalLocation}</p>
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-slate-700">Chuyến #{ticket.booking?.tripId}</p>
                        );
                      })()}
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">Khởi hành: {fmtDatetime(ticket.booking?.departureTime)}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Chỗ ngồi</p>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-extrabold">
                          {ticket.seatNumber}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">Đơn hàng #{ticket.booking?.id}</p>
                          <div className="mt-1">
                            {(() => {
                              const payStatus = ticket.booking?.status || "pending";
                              const meta = PAYMENT_STATUS_META[payStatus] || { label: payStatus, color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" };
                              return (
                                <span
                                  className="inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded-md"
                                  style={{
                                    color: meta.color,
                                    backgroundColor: meta.bg,
                                    border: `1.5px solid ${meta.border}`
                                  }}
                                >
                                  {meta.label.toUpperCase()}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pickup and Dropoff Stops */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="w-px h-5 border-l-2 border-dashed border-slate-300" />
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                      </div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700">Điểm đón: </span>
                          <span className="text-slate-600">{ticket.pickupStop?.name || "Bến xe đi"}</span>
                          {ticket.pickupStop?.address && <p className="text-[10px] text-slate-500 font-semibold">{ticket.pickupStop.address}</p>}
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Điểm trả: </span>
                          <span className="text-slate-600">{ticket.dropoffStop?.name || "Bến xe đến"}</span>
                          {ticket.dropoffStop?.address && <p className="text-[10px] text-slate-500 font-semibold">{ticket.dropoffStop.address}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="pt-2">
                    {ticket.status === "unused" ? (
                      <button
                        onClick={() => handleCheckIn(ticket.id)}
                        disabled={checkingIn}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg pulse-button disabled:opacity-50"
                      >
                        {checkingIn ? (
                          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Xác nhận hành khách lên xe
                          </>
                        )}
                      </button>
                    ) : ticket.status === "used" ? (
                      <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-200">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-400">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Khách đã check-in an toàn trên xe
                      </div>
                    ) : (
                      <div className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-red-100">
                        ⚠️ Vé không hợp lệ do đơn hàng đã bị hủy
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Sẵn sàng tra cứu</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-64">
                    Kết quả soát vé sẽ hiển thị tại bảng này sau khi quét hoặc tìm kiếm thành công.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: BOARDING LIST BY TRIP (Admin only fallback) ─────────────────────── */}
        {activeTab === "list" && role === "admin" && (
          <div className="space-y-4">
            
            {/* Filter and Select trip board */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center gap-4 flex-wrap">
              <div className="flex flex-col gap-1 flex-1 min-w-60 max-w-sm">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Chọn chuyến xe vận hành</label>
                <select
                  value={selectedTripId}
                  onChange={(e) => { setSelectedTripId(e.target.value); setPage(1); }}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition"
                >
                  <option value="">-- Chọn chuyến xe --</option>
                  {trips.map((t) => {
                    const r = getRoute(t.id);
                    return (
                      <option key={t.id} value={t.id}>
                        [Chuyến #{t.id}] {r ? `${r.departureLocation} → ${r.arrivalLocation}` : "Tuyến đường"} ({fmtDatetime(t.departureTime)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedTripId && (
                <div className="flex flex-col gap-1 flex-1 min-w-50 max-w-xs">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tìm hành khách</label>
                  <div className="relative">
                    <input
                      value={searchPassenger}
                      onChange={(e) => { setSearchPassenger(e.target.value); setPage(1); }}
                      placeholder="Tìm theo ghế, tên, SĐT..."
                      className="w-full text-xs py-3 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition"
                    />
                    {searchPassenger && (
                      <button onClick={() => setSearchPassenger("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">✕</button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Trip Passenger Table */}
            {selectedTripId ? (
              <div className="space-y-4">
                
                {/* Stats row for current trip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Tổng vé bán ra", value: tripStats.total, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Khách đã lên xe", value: tripStats.checkedIn, color: "#059669", bg: "#f0fdf4" },
                    { label: "Khách chưa lên xe", value: tripStats.remaining, color: "#d97706", bg: "#fffbeb" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center gap-3 shadow-sm">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                        <span className="material-symbols-outlined text-lg" style={{ color }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" />
                          </svg>
                        </span>
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-900 leading-tight">{value} khách</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-160">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          {["Ghế", "Hành khách", "Mã số vé", "Số điện thoại", "Trạng thái", "Hành động"].map((h) => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold tracking-widest text-slate-500 uppercase whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pageData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                              Không tìm thấy khách hàng nào khớp bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          pageData.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
                                  {t.seatNumber}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs font-bold text-slate-800">{t.passengerName}</td>
                              <td className="px-4 py-3 text-[10px] font-mono text-slate-400">{t.qrCode}</td>
                              <td className="px-4 py-3 text-xs text-slate-500">{t.passengerPhone}</td>
                              <td className="px-4 py-3">
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{
                                    color: TICKET_STATUS_META[t.status]?.color,
                                    backgroundColor: TICKET_STATUS_META[t.status]?.bg,
                                    boxShadow: `0 0 0 1px ${TICKET_STATUS_META[t.status]?.border}`
                                  }}
                                >
                                  {TICKET_STATUS_META[t.status]?.label}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {t.status === "unused" ? (
                                  <button
                                    onClick={() => handleCheckIn(t.id)}
                                    disabled={checkingIn}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 transition"
                                  >
                                    ✓ Lên xe
                                  </button>
                                ) : t.status === "used" ? (
                                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Đã duyệt
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-red-400">Không hỗ trợ</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <p className="text-xs text-slate-400">
                      Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {tripTickets.length} khách
                    </p>
                    <div className="flex items-center gap-1">
                      <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                        Trước
                      </button>
                      <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                        Sau
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm text-slate-400">
                Vui lòng chọn một chuyến xe vận hành ở trên để hiển thị danh sách soát vé chi tiết.
              </div>
            )}
          </div>
        )}

      </div>

      {/* Toast Notification */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
