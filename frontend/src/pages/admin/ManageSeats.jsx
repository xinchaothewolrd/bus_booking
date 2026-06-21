import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
const WS_URL = import.meta.env.VITE_WS_URL ?? "http://localhost:8080";

const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Constants ────────────────────────────────────────────────────────────────
const SEAT_STATUS = {
  available: { label: "Trống", color: "#059669", bg: "#f0fdf4", border: "#a7f3d0" },
  pending: { label: "Đang giữ", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  booked: { label: "Đã đặt", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};

const TRIP_STATUS_META = {
  scheduled: { label: "Chờ khởi hành", color: "#2563eb", bg: "#eff6ff" },
  departing: { label: "Đang chạy", color: "#d97706", bg: "#fffbeb" },
  completed: { label: "Hoàn thành", color: "#059669", bg: "#f0fdf4" },
  cancelled: { label: "Đã hủy", color: "#dc2626", bg: "#fef2f2" },
};

function fmtDatetime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
function fmtPrice(p) {
  if (!p) return "—";
  return Number(p).toLocaleString("vi-VN") + "đ";
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
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" /><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      }
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  );
}

function Spinner({ small }) {
  return (
    <div className={`flex items-center justify-center ${small ? "py-8" : "py-24"}`}>
      <div className={`border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin ${small ? "w-6 h-6" : "w-8 h-8"}`} />
    </div>
  );
}

// ─── WS Status Indicator ──────────────────────────────────────────────────────
function WsIndicator({ status }) {
  const cfg = {
    connected: { dot: "#10b981", text: "Real-time đang hoạt động", pulse: true },
    connecting: { dot: "#f59e0b", text: "Đang kết nối...", pulse: true },
    disconnected: { dot: "#94a3b8", text: "Chưa kết nối", pulse: false },
    error: { dot: "#ef4444", text: "Mất kết nối", pulse: false },
  }[status] ?? { dot: "#94a3b8", text: "—", pulse: false };

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
      style={{ color: cfg.dot, backgroundColor: cfg.dot + "18" }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.pulse ? "pulse-dot" : ""}`}
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.text}
    </div>
  );
}

// ─── Seat Detail Modal ────────────────────────────────────────────────────────
function SeatDetailModal({ seat, onClose, onStatusChange }) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const changeStatus = async (newStatus) => {
    setSaving(true);
    setErr("");
    try {
      await api.patch(`/trip-seats/${seat.id}/status`, { status: newStatus });
      // Socket.io sẽ tự push "seat-updated" về
      // Nhưng cũng update local ngay cho nhanh
      onStatusChange(seat.id, newStatus);
      onClose();
    } catch {
      setErr("Cập nhật thất bại, thử lại.");
    } finally { setSaving(false); }
  };

  const s = SEAT_STATUS[seat.status] ?? SEAT_STATUS.available;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-72">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold"
              style={{ backgroundColor: s.bg, color: s.color, boxShadow: `0 0 0 1.5px ${s.border}` }}
            >
              {seat.seatNumber}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Ghế {seat.seatNumber}</p>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: s.color, backgroundColor: s.bg }}
              >
                {s.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition text-xs">✕</button>
        </div>

        {/* Info */}
        <div className="px-5 py-4 space-y-2">
          {seat.status === "pending" && seat.pendingUntil && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <p className="text-[11px] font-semibold text-amber-700">⏱ Giữ chỗ đến:</p>
              <p className="text-xs font-bold text-amber-800 mt-0.5">{fmtDatetime(seat.pendingUntil)}</p>
            </div>
          )}
          {seat.status === "booked" && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-[11px] font-semibold text-red-600">🎫 Ghế đã có người đặt</p>
            </div>
          )}
          {err && <p className="text-xs text-red-500 text-center">{err}</p>}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Đổi trạng thái</p>
          {Object.entries(SEAT_STATUS).filter(([k]) => k !== seat.status).map(([k, v]) => (
            <button
              key={k}
              disabled={saving}
              onClick={() => changeStatus(k)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition border disabled:opacity-60"
              style={{ color: v.color, backgroundColor: v.bg, borderColor: v.border }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
              Chuyển sang "{v.label}"
              {saving && <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin ml-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Seat Map ─────────────────────────────────────────────────────────────────
function SeatMap({ seats, onSeatClick, flashSeatId }) {
  if (!seats || seats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M6 4v8M18 4v8" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <path d="M4 12h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
          <path d="M8 17v3M16 17v3" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="text-sm mt-2">Không có dữ liệu ghế</p>
      </div>
    );
  }

  // Tách tầng: Nếu số ghế > 22 hoặc có dấu hiệu lặp, chia đôi danh sách
  const isDoubleFloor = seats.length > 22;
  const floor1 = isDoubleFloor ? seats.slice(0, Math.ceil(seats.length / 2)) : seats;
  const floor2 = isDoubleFloor ? seats.slice(Math.ceil(seats.length / 2)) : [];

  const renderFloor = (floorSeats, label) => {
    const rows = {};
    floorSeats.forEach((seat) => {
      const key = seat.seatNumber?.replace(/\d+/g, "") || "Hàng";
      if (!rows[key]) rows[key] = [];
      rows[key].push(seat);
    });

    const displayRows = Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));

    return (
      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 relative">
        <div className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-bold text-blue-600 border border-blue-100 rounded-md shadow-sm uppercase tracking-wider">
          {label}
        </div>
        <div className="space-y-4 mt-2">
          {displayRows.map(([rowLabel, rowSeats]) => (
            <div key={rowLabel} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 w-10 text-right shrink-0">{rowLabel}</span>
              <div className="flex gap-2 flex-wrap">
                {[...rowSeats]
                  .sort((a, b) =>
                    parseInt(a.seatNumber?.replace(/\D/g, "") || 0) -
                    parseInt(b.seatNumber?.replace(/\D/g, "") || 0)
                  )
                  .map((seat) => {
                    const s = SEAT_STATUS[seat.status] ?? SEAT_STATUS.available;
                    const isFlash = flashSeatId === seat.id;
                    return (
                      <button
                        key={seat.id}
                        onClick={() => onSeatClick(seat)}
                        className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all duration-200 hover:scale-110 hover:shadow-md relative ${isFlash ? "flash-seat" : ""}`}
                        style={{ backgroundColor: s.bg, color: s.color, boxShadow: `0 0 0 1.5px ${s.border}` }}
                      >
                        {seat.seatNumber}
                        {seat.status === "pending" && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white pulse-dot" style={{ backgroundColor: "#f59e0b" }} />
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Đầu xe */}
      <div className="flex items-center justify-center gap-2">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phía trước (Đầu xe)</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFloor(floor1, "Tầng dưới")}
        {isDoubleFloor && renderFloor(floor2, "Tầng trên")}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageSeats() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [fares, setFares] = useState([]);
  const [rules, setRules] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchTrip, setSearchTrip] = useState("");
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [flashSeatId, setFlashSeatId] = useState(null);

  const socketRef = useRef(null);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── Fetch trips + routes ──────────────────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const [t, r, b, f, ru] = await Promise.all([
        api.get("/trips"),
        api.get("/routes"),
        api.get("/buses"),
        api.get("/route-fares"),
        api.get("/price-rules"),
      ]);
      setTrips(Array.isArray(t.data) ? t.data : t.data.data ?? []);
      setRoutes(Array.isArray(r.data) ? r.data : r.data.data ?? []);
      setBuses(Array.isArray(b.data) ? b.data : b.data.data ?? []);
      setFares(Array.isArray(f.data) ? f.data : f.data.data ?? []);
      setRules(Array.isArray(ru.data) ? ru.data : ru.data.data ?? []);
    } catch { showToast("Không thể tải danh sách chuyến xe", "error"); }
    finally { setLoadingTrips(false); }
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

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // ── Fetch seats ───────────────────────────────────────────────────────────────
  const fetchSeats = useCallback(async (tripId) => {
    if (!tripId) return;
    setLoadingSeats(true);
    try {
      const { data } = await api.get(`/trip-seats/trip/${tripId}`);
      setSeats(Array.isArray(data) ? data : data.data ?? []);
    } catch { showToast("Không thể tải sơ đồ ghế", "error"); }
    finally { setLoadingSeats(false); }
  }, []);

  // ── Socket.io — kết nối/ngắt khi đổi chuyến ──────────────────────────────────
  useEffect(() => {
    // Ngắt kết nối cũ nếu có
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setWsStatus("disconnected");
    }

    if (!selectedTrip) return;

    // Load ghế lần đầu qua REST
    fetchSeats(selectedTrip.id);

    // Kết nối Socket.io
    setWsStatus("connecting");

    const socket = io(WS_URL, {
      transports: ["websocket"],
      reconnectionDelay: 3000,
    });

    socket.on("connect", () => {
      setWsStatus("connected");
      // Đăng ký theo dõi chuyến này
      socket.emit("join-trip", selectedTrip.id);
    });

    // Nhận update ghế real-time từ BE
    socket.on("seat-updated", (updated) => {
      // updated = { id, tripId, seatNumber, status, pendingUntil }
      setSeats((prev) =>
        prev.map((s) => s.id === updated.id ? { ...s, ...updated } : s)
      );

      // Flash ghế vừa thay đổi
      setFlashSeatId(updated.id);
      setTimeout(() => setFlashSeatId(null), 800);

      // Cập nhật modal nếu đang mở đúng ghế đó
      setSelectedSeat((prev) =>
        prev?.id === updated.id ? { ...prev, ...updated } : prev
      );
    });

    socket.on("disconnect", () => setWsStatus("disconnected"));
    socket.on("connect_error", () => setWsStatus("error"));
    socket.on("reconnect", () => {
      setWsStatus("connected");
      socket.emit("join-trip", selectedTrip.id);
    });

    socketRef.current = socket;

    // Cleanup khi đổi chuyến hoặc unmount
    return () => {
      socket.emit("leave-trip", selectedTrip.id);
      socket.disconnect();
      socketRef.current = null;
      setWsStatus("disconnected");
    };
  }, [selectedTrip?.id, fetchSeats]);

  // ── Handle status change (optimistic update) ──────────────────────────────────
  const handleStatusChange = (seatId, newStatus) => {
    setSeats((p) => p.map((s) => s.id === seatId ? { ...s, status: newStatus } : s));
    // Socket.io sẽ confirm lại qua "seat-updated" event
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const seatStats = {
    total: seats.length,
    available: seats.filter((s) => s.status === "available").length,
    pending: seats.filter((s) => s.status === "pending").length,
    booked: seats.filter((s) => s.status === "booked").length,
  };
  const occupancyPct = seats.length
    ? Math.round(((seatStats.booked + seatStats.pending) / seats.length) * 100)
    : 0;

  const getRoute = (id) => routes.find((r) => r.id === id || r.id === Number(id));

  const filteredTrips = trips.filter((t) => {
    if (!searchTrip) return true;
    const route = getRoute(t.routeId);
    const q = searchTrip.toLowerCase();
    return (
      route?.departureLocation?.toLowerCase().includes(q) ||
      route?.arrivalLocation?.toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  });

  return (
    <>
      <style>{`
        @keyframes slide-up  { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slide-up { animation: slide-up .25s ease-out }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pulse-dot { animation: pulse-dot 1.5s ease-in-out infinite }
        @keyframes flash-seat { 0%{transform:scale(1.25);box-shadow:0 0 0 4px #fbbf24} 100%{transform:scale(1)} }
        .flash-seat { animation: flash-seat .6s ease-out }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Trạng thái ghế</h1>
            <p className="text-sm text-slate-400 mt-0.5">Real-time — ghế thay đổi sẽ cập nhật tức thì.</p>
          </div>
          {selectedTrip && <WsIndicator status={wsStatus} />}
        </div>

        <div className="flex gap-5 flex-col lg:flex-row items-start">

          {/* ── Left: Trip list ── */}
          <div className="lg:w-80 w-full shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-100">
                <p className="text-xs font-extrabold tracking-widest text-slate-400 uppercase mb-2">Chọn chuyến xe</p>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2" />
                    <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    value={searchTrip} onChange={(e) => setSearchTrip(e.target.value)}
                    placeholder="Tìm tuyến đường..."
                    className="flex-1 text-xs bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-130">
                {loadingTrips ? <Spinner small /> : filteredTrips.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Không có chuyến xe nào</p>
                ) : filteredTrips.map((trip) => {
                  const route = getRoute(trip.routeId);
                  const tm = TRIP_STATUS_META[trip.status] ?? TRIP_STATUS_META.scheduled;
                  const active = selectedTrip?.id === trip.id;
                  return (
                    <button
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className="w-full text-left px-4 py-3.5 border-b border-slate-50 transition-all duration-150 relative"
                      style={{ backgroundColor: active ? "#eff6ff" : "transparent" }}
                    >
                      {active && (
                        <span className="absolute left-0 top-[15%] bottom-[15%] w-0.75 rounded-r-full" style={{ backgroundColor: "#2563eb" }} />
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-500 font-mono">#{trip.id}</p>
                          {route ? (
                            <div className="mt-0.5">
                              <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{route.departureLocation}</p>
                              <p className="text-xs text-slate-400 truncate">→ {route.arrivalLocation}</p>
                            </div>
                          ) : <p className="text-xs text-slate-400">—</p>}
                          <p className="text-[11px] text-slate-400 mt-1">{fmtDatetime(trip.departureTime)}</p>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                          style={{ color: tm.color, backgroundColor: tm.bg }}
                        >
                          {tm.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Seat map ── */}
          <div className="flex-1 space-y-4">
            {!selectedTrip ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-24 text-slate-400">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M6 4v8M18 4v8" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M4 12h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                  <path d="M8 17v3M16 17v3" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <p className="text-sm mt-3 font-medium">Chọn một chuyến xe để xem sơ đồ ghế</p>
                <p className="text-xs mt-1 text-slate-300">Danh sách bên trái</p>
              </div>
            ) : (
              <>
                {/* Trip info bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-mono text-slate-400">#{selectedTrip.id}</p>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: TRIP_STATUS_META[selectedTrip.status]?.color, backgroundColor: TRIP_STATUS_META[selectedTrip.status]?.bg }}
                        >
                          {TRIP_STATUS_META[selectedTrip.status]?.label}
                        </span>
                      </div>
                      {(() => {
                        const r = getRoute(selectedTrip.routeId);
                        return r ? (
                          <p className="text-base font-bold text-slate-900">
                            {r.departureLocation} <span className="text-slate-400 font-normal">→</span> {r.arrivalLocation}
                          </p>
                        ) : null;
                      })()}
                      <p className="text-xs text-slate-400 mt-0.5">{fmtDatetime(selectedTrip.departureTime)} · {fmtPrice(getTripPrice(selectedTrip))}</p>
                    </div>
                    <button
                      onClick={() => fetchSeats(selectedTrip.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M4 12a8 8 0 018-8 8 8 0 017.3 4.7M20 12a8 8 0 01-8 8 8 8 0 01-7.3-4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M20 4v4h-4M4 20v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Tải lại
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Tổng ghế", value: seatStats.total, color: "#64748b", bg: "#f1f5f9" },
                    { label: "Còn trống", value: seatStats.available, color: "#059669", bg: "#f0fdf4" },
                    { label: "Đang giữ", value: seatStats.pending, color: "#d97706", bg: "#fffbeb" },
                    { label: "Đã đặt", value: seatStats.booked, color: "#dc2626", bg: "#fef2f2" },
                  ].map(({ label, value, color, bg }) => (
                    <div key={label} className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm text-center">
                      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Occupancy bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-600">Tỷ lệ lấp đầy</p>
                    <p className="text-xs font-extrabold" style={{ color: occupancyPct > 80 ? "#dc2626" : occupancyPct > 50 ? "#d97706" : "#059669" }}>
                      {occupancyPct}%
                    </p>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${occupancyPct}%`, backgroundColor: occupancyPct > 80 ? "#dc2626" : occupancyPct > 50 ? "#f59e0b" : "#10b981" }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    {Object.entries(SEAT_STATUS).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: v.color }} />
                        <span className="text-[11px] text-slate-500">{v.label}</span>
                        <span className="text-[11px] font-bold text-slate-700">
                          ({k === "available" ? seatStats.available : k === "pending" ? seatStats.pending : seatStats.booked})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seat map */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
                  <p className="text-xs font-extrabold tracking-widest text-slate-400 uppercase mb-4">Sơ đồ ghế</p>
                  {loadingSeats ? <Spinner small /> : (
                    <SeatMap seats={seats} onSeatClick={setSelectedSeat} flashSeatId={flashSeatId} />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedSeat && (
        <SeatDetailModal
          seat={selectedSeat}
          onClose={() => setSelectedSeat(null)}
          onStatusChange={(id, status) => {
            handleStatusChange(id, status);
            setSelectedSeat(null);
          }}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}