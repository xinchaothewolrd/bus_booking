import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Mock data (dùng khi BE chưa sẵn sàng) ───────────────────────────────────
const MOCK_DATA = {
  revenue: 45_600_000,
  totalBookings: 128,
  pendingCount: 12,
  totalPaid: 98,
  activeTrips: 5,
  totalTrips: 42,
  customers: 76,
  cancelRate: 15,
  last7: [
    { label: "T2", value: 3_200_000 },
    { label: "T3", value: 5_100_000 },
    { label: "T4", value: 2_800_000 },
    { label: "T5", value: 7_400_000 },
    { label: "T6", value: 6_900_000 },
    { label: "T7", value: 9_200_000 },
    { label: "CN", value: 11_000_000 },
  ],
  topRoutes: [
    { name: "Hồ Chí Minh → Đà Lạt", rev: 18_500_000 },
    { name: "Hồ Chí Minh → Nha Trang", rev: 12_300_000 },
    { name: "Hồ Chí Minh → Vũng Tàu", rev: 8_100_000 },
    { name: "Hà Nội → Đà Nẵng", rev: 4_200_000 },
    { name: "Hà Nội → Hải Phòng", rev: 2_500_000 },
  ],
  recentBookings: [
    { id: 128, user: { full_name: "Nguyễn Văn A", email: "nva@gmail.com" }, route: { departure_location: "HCM", arrival_location: "Đà Lạt" }, booking_time: new Date().toISOString(), total_amount: 350_000, status: "paid" },
    { id: 127, user: { full_name: "Trần Thị B", email: "ttb@gmail.com" }, route: { departure_location: "HCM", arrival_location: "Nha Trang" }, booking_time: new Date(Date.now() - 3600_000).toISOString(), total_amount: 420_000, status: "pending" },
    { id: 126, user: { full_name: "Lê Hoàng C", email: "lhc@gmail.com" }, route: { departure_location: "HN", arrival_location: "Đà Nẵng" }, booking_time: new Date(Date.now() - 7200_000).toISOString(), total_amount: 500_000, status: "paid" },
    { id: 125, user: { full_name: "Phạm Minh D", email: "pmd@gmail.com" }, route: { departure_location: "HCM", arrival_location: "Vũng Tàu" }, booking_time: new Date(Date.now() - 10800_000).toISOString(), total_amount: 180_000, status: "cancelled" },
    { id: 124, user: { full_name: "Hoàng Thị E", email: "hte@gmail.com" }, route: { departure_location: "HN", arrival_location: "Hải Phòng" }, booking_time: new Date(Date.now() - 14400_000).toISOString(), total_amount: 220_000, status: "paid" },
    { id: 123, user: { full_name: "Vũ Quốc F", email: "vqf@gmail.com" }, route: { departure_location: "HCM", arrival_location: "Đà Lạt" }, booking_time: new Date(Date.now() - 18000_000).toISOString(), total_amount: 350_000, status: "pending" },
  ],
  upcomingTrips: [
    { id: 15, route: { departure_location: "HCM", arrival_location: "Đà Lạt" }, departure_time: new Date(Date.now() + 3600_000).toISOString(), status: "departing" },
    { id: 16, route: { departure_location: "HCM", arrival_location: "Nha Trang" }, departure_time: new Date(Date.now() + 7200_000).toISOString(), status: "scheduled" },
    { id: 17, route: { departure_location: "HN", arrival_location: "Đà Nẵng" }, departure_time: new Date(Date.now() + 10800_000).toISOString(), status: "scheduled" },
    { id: 18, route: { departure_location: "HCM", arrival_location: "Vũng Tàu" }, departure_time: new Date(Date.now() + 14400_000).toISOString(), status: "scheduled" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(p) {
  if (!p && p !== 0) return "0đ";
  const n = Number(p);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M đ";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K đ";
  return n.toLocaleString("vi-VN") + "đ";
}
function fmtPriceFull(p) {
  if (!p && p !== 0) return "0đ";
  return Number(p).toLocaleString("vi-VN") + "đ";
}
function fmtDatetime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}
function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("vi-VN");
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 180, H = 48;
  const barW = Math.floor(W / data.length) - 2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {data.map((d, i) => {
        const h = Math.max(Math.round((d.value / max) * (H - 8)), d.value > 0 ? 2 : 0);
        const x = i * (barW + 2);
        return <rect key={i} x={x} y={H - h} width={barW} height={h} rx="2" fill={color} opacity="0.8" />;
      })}
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, iconColor, iconBg, icon, chartData, onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-3 ${onClick ? "cursor-pointer hover:border-blue-200 hover:shadow-md transition-all duration-200" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d={icon} stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        {chartData && <MiniBarChart data={chartData} color={iconColor} />}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-tight">{value}</p>
        <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, type = "booking" }) {
  const BOOKING = {
    pending: { label: "Chờ TT", color: "#d97706", bg: "#fffbeb" },
    paid: { label: "Đã TT", color: "#059669", bg: "#f0fdf4" },
    cancelled: { label: "Đã hủy", color: "#dc2626", bg: "#fef2f2" },
  };
  const TRIP = {
    scheduled: { label: "Chờ", color: "#2563eb", bg: "#eff6ff" },
    departing: { label: "Đang chạy", color: "#d97706", bg: "#fffbeb" },
    completed: { label: "Xong", color: "#059669", bg: "#f0fdf4" },
    cancelled: { label: "Hủy", color: "#dc2626", bg: "#fef2f2" },
  };
  const map = type === "trip" ? TRIP : BOOKING;
  const m = map[status] ?? { label: status, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: m.color, backgroundColor: m.bg }}>
      {m.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(MOCK_DATA); // Hiển thị mock ngay
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(true);

  // Thử fetch BE, nếu lỗi giữ mock
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, uRes, rRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/trips"),
        api.get("/users"),
        api.get("/routes"),
      ]);

      const bookings = Array.isArray(bRes.data) ? bRes.data : bRes.data.data ?? [];
      const trips = Array.isArray(tRes.data) ? tRes.data : tRes.data.data ?? [];
      const users = Array.isArray(uRes.data) ? uRes.data : uRes.data.data ?? [];
      const routes = Array.isArray(rRes.data) ? rRes.data : rRes.data.data ?? [];

      const paid = bookings.filter((b) => b.status === "paid");
      const revenue = paid.reduce((s, b) => s + Number(b.totalAmount ?? 0), 0);
      const pendingCount = bookings.filter((b) => b.status === "pending").length;
      const activeTrips = trips.filter((t) => t.status === "departing").length;
      const customers = users.filter((u) => u.role === "customer").length;

      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        return {
          label: days[d.getDay()],
          value: paid.filter((b) => b.createdAt?.slice(0, 10) === key)
            .reduce((s, b) => s + Number(b.totalAmount ?? 0), 0),
        };
      });

      const routeRevenue = {};
      paid.forEach((b) => {
        const trip = trips.find((t) => t.id === (b.tripId || b.trip_id) || t.id === Number(b.tripId || b.trip_id));
        const route = trip ? (trip.route || routes.find((r) => r.id === (trip.routeId || trip.route_id) || r.id === Number(trip.routeId || trip.route_id))) : null;
        if (route) {
          const key = `${route.departureLocation || route.departure_location} → ${route.arrivalLocation || route.arrival_location}`;
          routeRevenue[key] = (routeRevenue[key] ?? 0) + Number(b.totalAmount || b.total_amount || 0);
        }
      });

      const topRoutes = Object.entries(routeRevenue).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, rev]) => ({ name, rev }));

      const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6)
        .map((b) => {
          const tripObj = trips.find((t) => t.id === (b.tripId || b.trip_id) || t.id === Number(b.tripId || b.trip_id));
          return {
            ...b,
            route: tripObj ? (tripObj.route || routes.find((r) => r.id === (tripObj.routeId || tripObj.route_id) || r.id === Number(tripObj.routeId || tripObj.route_id))) : null,
          };
        });

      const upcomingTrips = trips
        .filter((t) => t.status === "scheduled" || t.status === "departing")
        .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
        .slice(0, 5)
        .map((t) => ({ ...t, route: t.route || routes.find((r) => r.id === (t.routeId || t.route_id) || r.id === Number(t.routeId || t.route_id)) }));

      setData({ revenue, totalBookings: bookings.length, pendingCount, totalPaid: paid.length, activeTrips, totalTrips: trips.length, customers, last7, topRoutes, recentBookings, upcomingTrips });
      setIsMock(false);
    } catch {
      // BE chưa sẵn sàng — giữ mock data
      setIsMock(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const maxRev = data.topRoutes?.length ? Math.max(...data.topRoutes.map((r) => r.rev), 1) : 1;

  return (
    <>
      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .fade-up { animation: fade-up .3s ease-out both }
        .fade-up-1{animation-delay:.05s} .fade-up-2{animation-delay:.1s}
        .fade-up-3{animation-delay:.15s} .fade-up-4{animation-delay:.2s}
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-400 mt-0.5">Tổng quan hệ thống — {fmtDate(new Date())}</p>
          </div>
          <div className="flex items-center gap-2">
            {isMock && (
              <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-full" style={{ color: "#d97706", backgroundColor: "#fffbeb", boxShadow: "0 0 0 1px #fde68a" }}>
                📋 Đang dùng dữ liệu mẫu
              </span>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={loading ? "animate-spin" : ""}>
                <path d="M4 12a8 8 0 018-8 8 8 0 017.3 4.7M20 12a8 8 0 01-8 8 8 8 0 01-7.3-4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 4v4h-4M4 20v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="fade-up fade-up-1">
            <StatCard label="Doanh thu" value={fmtPrice(data.revenue)} sub={`${data.totalPaid ?? 0} đơn đã thanh toán`}
              iconColor="#f97316" iconBg="#fff7ed" icon="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
              chartData={data.last7} onClick={() => navigate("/admin/statistics")} />
          </div>
          <div className="fade-up fade-up-2">
            <StatCard label="Tổng đơn đặt vé" value={data.totalBookings} sub={`${data.pendingCount} đơn chờ thanh toán`}
              iconColor="#2563eb" iconBg="#eff6ff" icon="M2 9a2 2 0 012-2h16a2 2 0 012 2v1.5a2.5 2.5 0 010 5V17a2 2 0 01-2 2H4a2 2 0 01-2-2v-1.5a2.5 2.5 0 010-5V9z"
              onClick={() => navigate("/admin/bookings")} />
          </div>
          <div className="fade-up fade-up-3">
            <StatCard label="Chuyến xe đang chạy" value={data.activeTrips} sub={`${data.totalTrips} tổng chuyến`}
              iconColor="#d97706" iconBg="#fffbeb" icon="M5 12h14M13 6l6 6-6 6"
              onClick={() => navigate("/admin/trips")} />
          </div>
          <div className="fade-up fade-up-4">
            <StatCard label="Khách hàng" value={data.customers} sub="Tài khoản customer"
              iconColor="#7c3aed" iconBg="#f5f3ff" icon="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.5 3.6-6 8-6s8 2.5 8 6"
              onClick={() => navigate("/admin/users")} />
          </div>
        </div>

        {/* Top routes + Upcoming trips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-extrabold text-slate-900">Top tuyến đường</p>
              <span className="text-[11px] text-slate-400">Theo doanh thu</span>
            </div>
            <div className="space-y-3">
              {(data.topRoutes ?? []).map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0"
                    style={{ backgroundColor: i === 0 ? "#fef9c3" : "#f1f5f9", color: i === 0 ? "#ca8a04" : "#64748b" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{r.name}</p>
                    <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.round((r.rev / maxRev) * 100)}%`, backgroundColor: "#2563eb" }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0">{fmtPrice(r.rev)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-extrabold text-slate-900">Chuyến xe sắp tới</p>
              <button onClick={() => navigate("/admin/trips")} className="text-[11px] font-semibold text-blue-600 hover:underline">Xem tất cả →</button>
            </div>
            <div className="space-y-2.5">
              {(data.upcomingTrips ?? []).map((trip) => (
                <div key={trip.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <div className="w-px h-3 border-l-2 border-dashed border-slate-300" />
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {trip.route ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{trip.route.departureLocation}</p>
                        <p className="text-[11px] text-slate-400 truncate">→ {trip.route.arrivalLocation}</p>
                      </>
                    ) : <p className="text-xs text-slate-400">Trip #{trip.id}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500">{fmtDatetime(trip.departureTime)}</p>
                    <StatusBadge status={trip.status} type="trip" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-extrabold text-slate-900">Đơn đặt vé gần nhất</p>
            <button onClick={() => navigate("/admin/bookings")} className="text-[11px] font-semibold text-blue-600 hover:underline">Xem tất cả →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  {["#", "Khách hàng", "Tuyến đường", "Thời gian đặt", "Tổng tiền", "Trạng thái"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-extrabold tracking-widest text-slate-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data.recentBookings ?? []).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3.5 text-xs font-mono text-slate-400">#{b.id}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: "#f97316" }}>
                          {(b.User?.fullName ?? "U").charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 leading-tight">{b.User?.fullName ?? `User #${b.userId}`}</p>
                          <p className="text-[10px] text-slate-400">{b.User?.email ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {b.route
                        ? <p className="text-xs text-slate-700">{b.route.departureLocation} → {b.route.arrivalLocation}</p>
                        : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{fmtDatetime(b.createdAt)}</td>
                    <td className="px-4 py-3.5 text-xs font-bold" style={{ color: "#f97316" }}>{fmtPriceFull(b.totalAmount)}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Thêm chuyến xe", to: "/admin/trips", color: "#2563eb", bg: "#eff6ff" },
            { label: "Quản lý tuyến", to: "/admin/routes", color: "#059669", bg: "#f0fdf4" },
            { label: "Xem sơ đồ ghế", to: "/admin/seats", color: "#d97706", bg: "#fffbeb" },
            { label: "Thống kê chi tiết", to: "/admin/statistics", color: "#7c3aed", bg: "#f5f3ff" },
          ].map(({ label, to, color, bg }) => (
            <button key={to} onClick={() => navigate(to)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition text-sm font-semibold"
              style={{ color }}
            >
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}