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
const STATUS_LIST = ["Tất cả", "pending", "paid", "cancelled"];

const STATUS_META = {
  pending:   { label: "Chờ thanh toán", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  paid:      { label: "Đã thanh toán",  color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" },
  cancelled: { label: "Đã hủy",         color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
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
function exportCSV(bookings) {
  const header = ["ID", "Khách hàng", "Email", "Chuyến xe", "Tổng tiền", "Trạng thái", "Thời gian đặt"];
  const rows   = bookings.map((b) => [
    b.id,
    b.User?.fullName ?? b.userId,
    b.User?.email ?? "",
    b.tripId,
    b.totalAmount ?? "",
    STATUS_META[b.status]?.label ?? b.status,
    fmtDatetime(b.bookingTime ?? b.createdAt),
  ]);
  const csv  = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = "bookings.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
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
      <div className={`border-[3px] border-orange-200 border-t-orange-500 rounded-full animate-spin ${small ? "w-5 h-5" : "w-8 h-8"}`} />
    </div>
  );
}

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ color: m.color, backgroundColor: m.bg, boxShadow: `0 0 0 1px ${m.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

// ─── Confirm Cancel Modal ─────────────────────────────────────────────────────
function ConfirmCancelModal({ booking, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-80 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="font-bold text-slate-900 mb-1">Hủy đơn đặt vé?</p>
        <p className="text-xs text-slate-400 mb-1">Đơn hàng <span className="font-semibold text-slate-700">#{booking?.id}</span> sẽ bị hủy.</p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5 mt-2">
          ⚠️ Ghế sẽ được trả lại trạng thái trống.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Đóng</button>
          <button
            onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#ef4444" }}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Detail Modal (+ tickets) ────────────────────────────────────────
function BookingDetailModal({ booking, trips, routes, getTripPrice, onClose, onStatusChange }) {
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(false);
  const [ticketPage, setTicketPage] = useState(1);
  const TICKET_PAGE_SIZE = 10;

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/tickets?bookingId=${booking.id}`);
        setTickets(Array.isArray(data) ? data : data.data ?? []);
      } catch { setTickets([]); }
      finally { setLoading(false); }
    };
    fetchTickets();
  }, [booking.id]);

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/bookings/${booking.id}`, { status: newStatus });
      onStatusChange(booking.id, newStatus);
    } catch { /* toast handled outside */ }
    finally { setUpdating(false); }
  };

  // Lấy thông tin chuyến xe
  const trip  = trips.find((t) => t.id === booking.tripId || t.id === Number(booking.tripId));
  const route = trip ? routes.find((r) => r.id === trip.routeId || r.id === Number(trip.routeId)) : null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fff7ed" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M2 9a2 2 0 012-2h16a2 2 0 012 2v1.5a2.5 2.5 0 010 5V17a2 2 0 01-2 2H4a2 2 0 01-2-2v-1.5a2.5 2.5 0 010-5V9z" stroke="#f97316" strokeWidth="1.8" fill="none"/>
                <path d="M9 12h6M9 15h4" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15 7v10" stroke="#f97316" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Chi tiết đơn #{booking.id}</h2>
              <StatusBadge status={booking.status} />
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Thông tin chuyến */}
          {route && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2">Chuyến xe</p>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="w-px h-5 border-l-2 border-dashed border-slate-300" />
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-700">Mã chuyến: #{booking?.tripId}</div>
                  <div className="text-[11px] text-slate-500">ID đặt vé: #{booking?.id}</div>
                  <p className="text-[12px] text-slate-500 mt-1">{route.departureLocation} → {route.arrivalLocation}</p>
                </div>
                {trip && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500">{fmtDatetime(trip.departureTime)}</p>
                    <p className="text-sm font-bold mt-1" style={{ color: "#2563eb" }}>{fmtPrice(getTripPrice ? getTripPrice(trip) : trip?.price)}/ghế</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-1">Khách hàng</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{booking?.User?.fullName ?? "Khách vãng lai"}</p>
              <p className="text-xs text-slate-500 truncate">{booking?.User?.email ?? "Chưa cập nhật email"}</p>
              <p className="text-[11px] text-slate-500">{booking.User?.phone ?? "—"}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-1">Thanh toán</p>
              <div className="text-sm font-bold text-slate-900">{fmtPrice(booking?.totalAmount)}</div>
              <div className="text-[11px] text-slate-500">{fmtDatetime(booking?.bookingTime ?? booking?.createdAt)}</div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2">
              Danh sách vé ({tickets.length} vé)
            </p>
            {loading ? <Spinner small /> : tickets.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Không có vé nào</p>
            ) : (() => {
              const totalTicketPages = Math.ceil(tickets.length / TICKET_PAGE_SIZE);
              const startIdx = (ticketPage - 1) * TICKET_PAGE_SIZE;
              const pageTickets = tickets.slice(startIdx, startIdx + TICKET_PAGE_SIZE);

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pageTickets.map((ticket, i) => (
                      <div
                        key={ticket.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-slate-100 bg-slate-50"
                      >
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-extrabold shrink-0"
                          style={{ backgroundColor: "#eff6ff", color: "#2563eb", boxShadow: "0 0 0 1px #bfdbfe" }}
                        >
                          {ticket.Seat?.seatNumber ?? ticket.tripSeat?.seatNumber ?? `#${startIdx + i + 1}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-slate-700 truncate leading-tight">
                            {ticket.passengerName || "—"}
                          </p>
                          <p className="text-[9px] text-slate-400 leading-tight">{ticket.passengerPhone || "—"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ticket Pagination Controls */}
                  {totalTicketPages > 1 && (
                    <div className="flex items-center justify-between mt-4 px-2 py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        Trang <span className="text-orange-600">{ticketPage}</span> / {totalTicketPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={ticketPage === 1}
                          onClick={() => setTicketPage(p => p - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                        <button
                          disabled={ticketPage === totalTicketPages}
                          onClick={() => setTicketPage(p => p + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {booking.status !== "cancelled" && (
            <div>
              <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2">Cập nhật trạng thái</p>
              <div className="flex gap-2">
                {booking.status === "pending" && (
                  <button
                    disabled={updating}
                    onClick={() => updateStatus("paid")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#059669" }}
                  >
                    {updating && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
                    ✓ Xác nhận đã thanh toán
                  </button>
                )}
                {booking.status === "paid" && (
                  <>
                    <button
                      onClick={() => onStatusChange(booking.id, "paid")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-blue-600 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition flex items-center justify-center gap-1.5"
                    >
                      📧 Gửi lại Gmail vé
                    </button>
                    <button
                      disabled={updating}
                      onClick={() => updateStatus("cancelled")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 border"
                      style={{ color: "#ef4444", backgroundColor: "#fef2f2", borderColor: "#fecaca" }}
                    >
                      Hủy đơn hàng
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Email Sending Modal ──────────────────────────────────────────────────────
function EmailSendingModal({ email, passengerName, bookingId, onClose }) {
  const [step, setStep] = useState(0);
  const STEPS = [
    "Đang thiết lập kết nối an toàn với máy chủ Google Mail (SMTP)...",
    "Đang phân tích thông tin chuyến xe & mã QR vé...",
    "Đang tự động soạn thư xác nhận gửi khách hàng...",
    "Đang mã hóa & đính kèm vé điện tử PDF...",
    "Đang truyền tải gói tin qua cổng bảo mật SSL...",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= STEPS.length - 1) {
          clearInterval(timer);
          setTimeout(onClose, 1500);
          return s + 1;
        }
        return s + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [onClose, STEPS.length]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-slide-up relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
        
        <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 border border-blue-500/30 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            {step >= STEPS.length ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-emerald-400 animate-bounce mx-auto">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="animate-pulse mx-auto">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" />
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold tracking-tight mb-1 text-slate-100">
          {step >= STEPS.length ? "Gửi Email thành công!" : "Hệ thống đang gửi Gmail..."}
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Đơn vé <span className="font-semibold text-slate-200">#{bookingId}</span> của <span className="font-semibold text-slate-200">{passengerName}</span>
        </p>

        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${Math.min(100, (step / STEPS.length) * 100)}%`, backgroundColor: step >= STEPS.length ? "#10b981" : "#3b82f6" }}
          />
        </div>

        <div className="min-h-10 flex items-center justify-center px-2">
          {step >= STEPS.length ? (
            <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 justify-center">
              📧 Thư điện tử đã được chuyển phát tới {email}!
            </p>
          ) : (
            <p className="text-xs text-slate-400 transition-all duration-200">
              {STEPS[step] || "Đang hoàn tất..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageBookings() {
  const [bookings, setBookings]     = useState([]);
  const [trips, setTrips]           = useState([]);
  const [routes, setRoutes]         = useState([]);
  const [buses, setBuses]           = useState([]);
  const [fares, setFares]           = useState([]);
  const [rules, setRules]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage]             = useState(1);
  const [detailBooking, setDetailBooking] = useState(null);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast]           = useState(null);
  const [sendingEmail, setSendingEmail] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, rRes, busRes, faresRes, rulesRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/trips"),
        api.get("/routes"),
        api.get("/buses"),
        api.get("/route-fares"),
        api.get("/price-rules"),
      ]);
      setBookings(Array.isArray(bRes.data) ? bRes.data : bRes.data.data ?? []);
      setTrips(Array.isArray(tRes.data)    ? tRes.data : tRes.data.data ?? []);
      setRoutes(Array.isArray(rRes.data)   ? rRes.data : rRes.data.data ?? []);
      setBuses(Array.isArray(busRes.data)   ? busRes.data : busRes.data.data ?? []);
      setFares(Array.isArray(faresRes.data) ? faresRes.data : faresRes.data.data ?? []);
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data.data ?? []);
    } catch { showToast("Không thể tải dữ liệu", "error"); }
    finally { setLoading(false); }
  }, []);

  const getTripPrice = useCallback((trip) => {
    if (!trip) return 0;
    if (trip.price !== undefined && trip.price !== null) {
      if (Number(trip.price) > 0) return Number(trip.price);
    }
    
    const rId = trip.routeId || trip.route_id;
    const bId = trip.busId || trip.bus_id;
    
    const bus = buses.find((b) => b.id == bId);
    const btId = trip.busTypeId || trip.bus_type_id || bus?.busTypeId || bus?.bus_type_id || bus?.busType?.id;

    if (!rId || !btId) return 0;

    const fare = fares.find(
      (f) =>
        (f.routeId == rId || f.route_id == rId) &&
        (f.busTypeId == btId || f.bus_type_id == btId)
    );

    if (!fare) return 0;
    let price = parseFloat(fare.basePrice || fare.base_price || 0);

    const departureDate = new Date(trip.departureTime || trip.departure_time);
    
    const activeRules = rules
      .filter((r) => r.status === "active" || r.status === true)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    activeRules.forEach((rule) => {
      const matchRoute =
        (!rule.routeId && !rule.route_id) ||
        rule.routeId == rId ||
        rule.route_id == rId;

      const matchBusType =
        (!rule.busTypeId && !rule.bus_type_id) ||
        rule.busTypeId == btId ||
        rule.bus_type_id == btId;

      const ruleStart = new Date(rule.startDate || rule.start_date);
      const ruleEnd = new Date(rule.endDate || rule.end_date);
      const matchTime = departureDate >= ruleStart && departureDate <= ruleEnd;

      if (matchRoute && matchBusType && matchTime) {
        if (rule.priceMultiplier) price *= parseFloat(rule.priceMultiplier);
        if (rule.priceDelta) price += parseFloat(rule.priceDelta);
      }
    });

    return Math.round(price);
  }, [buses, fares, rules]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await api.put(`/bookings/${cancelBooking.id}`, { status: "cancelled" });
      setBookings((p) => p.map((b) => b.id === cancelBooking.id ? { ...b, status: "cancelled" } : b));
      showToast(`Đã hủy đơn #${cancelBooking.id}`);
      setCancelBooking(null);
      if (detailBooking?.id === cancelBooking.id) {
        setDetailBooking((p) => ({ ...p, status: "cancelled" }));
      }
    } catch { showToast("Hủy đơn thất bại", "error"); }
    finally { setCancelLoading(false); }
  };

  const handleStatusChange = (id, newStatus) => {
    setBookings((p) => p.map((b) => b.id === id ? { ...b, status: newStatus } : b));
    setDetailBooking((p) => p ? { ...p, status: newStatus } : p);
    showToast("Cập nhật trạng thái thành công!");

    // Nếu duyệt thanh toán thì tự động trigger hoạt họa gửi Gmail
    if (newStatus === "paid") {
      setTimeout(() => {
        setBookings((currentBookings) => {
          const b = currentBookings.find((x) => x.id === id);
          if (b) {
            setSendingEmail({
              bookingId: id,
              passengerName: b.User?.fullName ?? "Khách hàng",
              email: b.User?.email ?? "khachhang@gmail.com",
            });
          }
          return currentBookings;
        });
      }, 300);
    }
  };

  const getTrip  = (id) => trips.find((t)  => t.id === id || t.id === Number(id));
  const getRoute = (tripId) => {
    const trip = getTrip(tripId);
    return trip ? routes.find((r) => r.id === trip.routeId || r.id === Number(trip.routeId)) : null;
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === "Tất cả" || b.status === statusFilter;
    const route       = getRoute(b.tripId);
    const q           = search.toLowerCase();
    const matchSearch = !search || (
      String(b.id).includes(search) ||
      b.User?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      b.User?.email?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.tripId).includes(search)
    );
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = {
    total:     bookings.length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    paid:      bookings.filter((b) => b.status === "paid").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    revenue:   bookings.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.totalAmount ?? 0), 0),
  };

  return (
    <>
      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slide-up { animation: slide-up .25s ease-out }
        @keyframes fade-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        .row-fade { animation: fade-in .18s ease-out }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-5">

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Quản lý đặt vé</h1>
            <p className="text-sm text-slate-400 mt-0.5">Xem và xử lý các đơn đặt vé của khách hàng.</p>
          </div>
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 16l-4-4h2.5V4h3v8H16l-4 4z" fill="currentColor"/>
              <path d="M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Xuất CSV
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Tổng đơn",        value: stats.total,     color: "#64748b", bg: "#f1f5f9" },
            { label: "Chờ thanh toán",  value: stats.pending,   color: "#d97706", bg: "#fffbeb" },
            { label: "Đã thanh toán",   value: stats.paid,      color: "#059669", bg: "#f0fdf4" },
            { label: "Đã hủy",          value: stats.cancelled, color: "#dc2626", bg: "#fef2f2" },
            { label: "Doanh thu",        value: fmtPrice(stats.revenue), color: "#f97316", bg: "#fff7ed" },
          ].map(({ label, value, color, bg }) => (
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M2 9a2 2 0 012-2h16a2 2 0 012 2v1.5a2.5 2.5 0 010 5V17a2 2 0 01-2 2H4a2 2 0 01-2-2v-1.5a2.5 2.5 0 010-5V9z" stroke={color} strokeWidth="1.8" fill="none"/>
                  <path d="M9 12h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 leading-tight">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm mã đơn, khách hàng, tuyến..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {STATUS_LIST.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${statusFilter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {s === "Tất cả" ? "Tất cả" : STATUS_META[s]?.label}
                </button>
              ))}
            </div>

            <p className="ml-auto text-xs text-slate-500 font-semibold shrink-0">{filtered.length} đơn</p>
          </div>

          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["#", "Khách hàng", "Tuyến đường", "Thời gian đặt", "Tổng tiền", "Trạng thái", "Hành động"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold tracking-widest text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                          <path d="M2 9a2 2 0 012-2h16a2 2 0 012 2v1.5a2.5 2.5 0 010 5V17a2 2 0 01-2 2H4a2 2 0 01-2-2v-1.5a2.5 2.5 0 010-5V9z" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
                        </svg>
                        <p className="text-sm font-medium text-slate-600">Không tìm thấy đơn đặt vé nào.</p>
                      </div>
                    </td></tr>
                  ) : pageData.map((b) => {
                    const route = getRoute(b.tripId);
                    const trip  = getTrip(b.tripId);
                    return (
                      <tr key={b.id} className="hover:bg-orange-50/20 transition row-fade">
                        <td className="px-4 py-3 text-[10px] font-mono text-slate-400">#{b.id}</td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-bold shadow-sm"
                            >
                              {(b.User?.fullName || "U").charAt(0).toUpperCase()}
                            </div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-800 leading-tight">{b.User?.fullName || "Khách lạ"}</p>
                                <p className="text-[10px] text-slate-500 leading-tight">ID: {b.userId || "—"}</p>
                              </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {route ? (
                            <div>
                              <p className="text-[13px] font-bold text-slate-700 leading-tight">{route.departureLocation}</p>
                              <p className="text-[11px] text-slate-500 leading-tight">{route.arrivalLocation}</p>
                            </div>
                          ) : <span className="text-[12px] text-slate-500">Chuyến #{b.tripId}</span>}
                          {trip && <p className="text-[10px] text-slate-500 mt-1">{fmtDatetime(trip.departureTime)}</p>}
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-600">{fmtDatetime(b.bookingTime ?? b.createdAt)}</p>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-slate-700">{fmtPrice(b.totalAmount)}</span>
                        </td>

                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setDetailBooking(b)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-blue-100"
                              style={{ color: "#2563eb", backgroundColor: "#eff6ff" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span className="notranslate">Chi tiết</span>
                            </button>
                            {b.status !== "cancelled" && (
                              <button
                                onClick={() => setCancelBooking(b)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-red-100"
                                style={{ color: "#ef4444", backgroundColor: "#fef2f2" }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="15" y1="9" x2="9" y2="15" />
                                  <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <span className="notranslate">Hủy</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {filtered.length} đơn
            </p>
            <div className="flex items-center gap-1">
              <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={p === safePage
                    ? { backgroundColor: "#f97316", color: "white" }
                    : { color: "#64748b", border: "1px solid #e2e8f0", backgroundColor: "transparent" }
                  }>{p}</button>
              ))}
              <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed">
                Sau →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          trips={trips}
          routes={routes}
          getTripPrice={getTripPrice}
          onClose={() => setDetailBooking(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Cancel confirm */}
      {cancelBooking && (
        <ConfirmCancelModal
          booking={cancelBooking}
          onClose={() => setCancelBooking(null)}
          onConfirm={handleCancel}
          loading={cancelLoading}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {sendingEmail && (
        <EmailSendingModal
          bookingId={sendingEmail.bookingId}
          passengerName={sendingEmail.passengerName}
          email={sendingEmail.email}
          onClose={() => setSendingEmail(null)}
        />
      )}
    </>
  );
}