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

// ─── Mock data ────────────────────────────────────────────────────────────────
function buildMock(range) {
  const isMonthly = range === "6m" || range === "12m";
  const count     = range === "7d" ? 7 : range === "30d" ? 30 : range === "6m" ? 6 : 12;
  const days      = ["CN","T2","T3","T4","T5","T6","T7"];

  const chartData = Array.from({ length: count }, (_, i) => {
    const base = isMonthly ? 8_000_000 : 2_000_000;
    const rand = Math.floor(Math.random() * base + base * 0.3);
    if (isMonthly) {
      const d = new Date(); d.setMonth(d.getMonth() - (count - 1 - i));
      return { label: `T${d.getMonth() + 1}`, value: rand };
    }
    const d = new Date(); d.setDate(d.getDate() - (count - 1 - i));
    return { label: count <= 7 ? days[d.getDay()] : `${d.getDate()}/${d.getMonth()+1}`, value: rand };
  });

  return {
    chartData,
    totalRevenue: chartData.reduce((s, d) => s + d.value, 0),
    totalPaid:    Math.floor(Math.random() * 50 + 60),
    totalBookings:Math.floor(Math.random() * 20 + 100),
    cancelRate:   Math.floor(Math.random() * 10 + 8),
    topRoutes: [
      { name: "HCM → Đà Lạt",    value: 18_500_000 },
      { name: "HCM → Nha Trang", value: 12_300_000 },
      { name: "HCM → Vũng Tàu", value: 8_100_000 },
      { name: "HN → Đà Nẵng",    value: 4_200_000 },
      { name: "HN → Hải Phòng",  value: 2_500_000 },
      { name: "HCM → Cần Thơ",   value: 1_800_000 },
    ],
    statusCount: { paid: 98, pending: 12, cancelled: 18 },
    tripStatus:  { scheduled: 15, departing: 5, completed: 87, cancelled: 6 },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPrice(p) {
  if (!p && p !== 0) return "0đ";
  const n = Number(p);
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("vi-VN") + "đ";
}
function fmtPriceFull(p) {
  if (!p && p !== 0) return "0đ";
  return Number(p).toLocaleString("vi-VN") + "đ";
}
function fmtMonth(key) {
  const [y, m] = key.split("-");
  return `T${parseInt(m)}/${y.slice(2)}`;
}
function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
function getDaysInRange(days) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}
function getMonthsInRange(months) {
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (months - 1 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── Pure SVG Bar Chart ───────────────────────────────────────────────────────
function BarChart({ data, color, height = 160 }) {
  if (!data || data.length === 0)
    return <p className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu</p>;

  const W     = 600, H = height;
  const padL  = 52, padB = 28, padT = 10, padR = 10;
  const drawW = W - padL - padR;
  const drawH = H - padB - padT;
  const max   = Math.max(...data.map((d) => d.value), 1);
  const barW  = Math.max(Math.floor(drawW / data.length) - 4, 4);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {/* Grid + Y labels */}
      {ticks.map((t, i) => {
        const y = padT + drawH - Math.round(t * drawH);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "3 3"} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{fmtPrice(max * t)}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bH  = Math.max(Math.round((d.value / max) * drawH), d.value > 0 ? 2 : 0);
        const x   = padL + i * (drawW / data.length) + (drawW / data.length - barW) / 2;
        const y   = padT + drawH - bH;
        const mid = padL + i * (drawW / data.length) + drawW / data.length / 2;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bH} rx="3"
              fill={color} opacity={d.value > 0 ? "0.85" : "0.2"} />
            <text x={mid} y={H - 4} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Horizontal Bar ───────────────────────────────────────────────────────────
function HBar({ items, colorFn }) {
  if (!items || items.length === 0)
    return <p className="text-xs text-slate-400 text-center py-8">Chưa có dữ liệu</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 w-5 shrink-0 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-700 truncate">{item.name}</p>
              <p className="text-xs font-bold text-slate-800 ml-2 shrink-0">{fmtPriceFull(item.value)}</p>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.round((item.value / max) * 100)}%`, backgroundColor: colorFn(i) }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { label: "7 ngày",   value: "7d"  },
  { label: "30 ngày",  value: "30d" },
  { label: "6 tháng",  value: "6m"  },
  { label: "12 tháng", value: "12m" },
];

const ROUTE_COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#db2777"];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Statistics() {
  const [range, setRange]   = useState("30d");
  const [data, setData]     = useState(() => buildMock("30d"));
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, tRes, rRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/trips"),
        api.get("/routes"),
      ]);
      const bookings = Array.isArray(bRes.data) ? bRes.data : bRes.data.data ?? [];
      const trips    = Array.isArray(tRes.data) ? tRes.data : tRes.data.data ?? [];
      const routes   = Array.isArray(rRes.data) ? rRes.data : rRes.data.data ?? [];

      const paid = bookings.filter((b) => b.status === "paid");
      const isMonthly = range === "6m" || range === "12m";

      let chartData;
      if (isMonthly) {
        const months = range === "6m" ? 6 : 12;
        const keys   = getMonthsInRange(months);
        chartData    = keys.map((key) => ({
          label: fmtMonth(key),
          value: paid.filter((b) => b.createdAt?.slice(0, 7) === key)
                     .reduce((s, b) => s + Number(b.totalAmount ?? b.total_amount ?? 0), 0),
        }));
      } else {
        const days = range === "7d" ? 7 : 30;
        const keys = getDaysInRange(days);
        chartData  = keys.map((key) => ({
          label: fmtDate(key),
          value: paid.filter((b) => b.createdAt?.slice(0, 10) === key)
                     .reduce((s, b) => s + Number(b.totalAmount ?? b.total_amount ?? 0), 0),
        }));
      }

      const routeMap = {};
      paid.forEach((b) => {
        const trip  = trips.find((t) => t.id === (b.tripId || b.trip_id) || t.id === Number(b.tripId || b.trip_id));
        const route = trip ? routes.find((r) => r.id === (trip.routeId || trip.route_id) || r.id === Number(trip.routeId || trip.route_id)) : null;
        if (route) {
          const key = `${route.departureLocation || route.departure_location} → ${route.arrivalLocation || route.arrival_location}`;
          routeMap[key] = (routeMap[key] ?? 0) + Number(b.totalAmount ?? b.total_amount ?? 0);
        }
      });
      const topRoutes = Object.entries(routeMap).sort(([,a],[,b])=>b-a).slice(0,7).map(([name,value])=>({name,value}));

      setData({
        chartData,
        totalRevenue:  paid.reduce((s, b) => s + Number(b.totalAmount ?? b.total_amount ?? 0), 0),
        totalPaid:     paid.length,
        totalBookings: bookings.length,
        cancelRate:    bookings.length ? Math.round((bookings.filter((b) => b.status === "cancelled").length / bookings.length) * 100) : 0,
        topRoutes,
        statusCount: {
          paid:      bookings.filter((b) => b.status === "paid").length,
          pending:   bookings.filter((b) => b.status === "pending").length,
          cancelled: bookings.filter((b) => b.status === "cancelled").length,
        },
        tripStatus: {
          scheduled:  trips.filter((t) => t.status === "scheduled").length,
          departing:  trips.filter((t) => t.status === "departing").length,
          completed:  trips.filter((t) => t.status === "completed").length,
          cancelled:  trips.filter((t) => t.status === "cancelled").length,
        },
      });
      setIsMock(false);
    } catch {
      // BE chưa sẵn sàng — dùng mock
      setData(buildMock(range));
      setIsMock(true);
    } finally { setLoading(false); }
  }, [range]);

  // Re-fetch hoặc rebuild mock khi đổi range
  useEffect(() => {
    if (isMock) {
      setData(buildMock(range));
    } else {
      fetchAll();
    }
  }, [range]); // eslint-disable-line

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <>
      <style>{`
        @keyframes fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .fade-in { animation: fade-in .25s ease-out }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Thống kê & Báo cáo</h1>
            <p className="text-sm text-slate-400 mt-0.5">Doanh thu, đặt vé và hiệu suất tuyến đường.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isMock && (
              <span className="text-[11px] font-bold px-2.5 py-1.5 rounded-full"
                style={{ color: "#d97706", backgroundColor: "#fffbeb", boxShadow: "0 0 0 1px #fde68a" }}>
                📋 Đang dùng dữ liệu mẫu
              </span>
            )}
            {/* Range selector */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRange(opt.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                  style={range === opt.value
                    ? { backgroundColor: "#2563eb", color: "white" }
                    : { color: "#64748b" }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchAll} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={loading ? "animate-spin" : ""}>
                <path d="M4 12a8 8 0 018-8 8 8 0 017.3 4.7M20 12a8 8 0 01-8 8 8 8 0 01-7.3-4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 4v4h-4M4 20v-4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        <div className="space-y-5 fade-in">

          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Tổng doanh thu",    value: fmtPriceFull(data.totalRevenue), color: "#f97316", bg: "#fff7ed" },
              { label: "Đơn đã thanh toán", value: data.totalPaid,                  color: "#059669", bg: "#f0fdf4" },
              { label: "Tổng đơn đặt vé",   value: data.totalBookings,             color: "#2563eb", bg: "#eff6ff" },
              { label: "Tỷ lệ hủy",         value: `${data.cancelRate}%`,          color: "#dc2626", bg: "#fef2f2" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Biểu đồ doanh thu */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-extrabold text-slate-900">Doanh thu theo thời gian</p>
              <span className="text-[11px] text-slate-400">
                Tổng: <span className="font-bold text-slate-700">{fmtPriceFull(data.totalRevenue)}</span>
              </span>
            </div>
            {loading ? <Spinner /> : <BarChart data={data.chartData} color="#2563eb" height={160} />}
          </div>

          {/* Top routes + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Top tuyến */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-sm font-extrabold text-slate-900 mb-4">Doanh thu theo tuyến</p>
              {loading ? <Spinner /> : <HBar items={data.topRoutes} colorFn={(i) => ROUTE_COLORS[i % ROUTE_COLORS.length]} />}
            </div>

            {/* Phân bổ đơn hàng */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-sm font-extrabold text-slate-900 mb-4">Phân bổ trạng thái đơn</p>
              <div className="space-y-3">
                {[
                  { key: "paid",      label: "Đã thanh toán",  color: "#059669" },
                  { key: "pending",   label: "Chờ thanh toán", color: "#d97706" },
                  { key: "cancelled", label: "Đã hủy",         color: "#dc2626" },
                ].map(({ key, label, color }) => {
                  const val = data.statusCount?.[key] ?? 0;
                  const pct = data.totalBookings ? Math.round((val / data.totalBookings) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-slate-600">{label}</p>
                          <p className="text-xs font-bold text-slate-800">{val} đơn ({pct}%)</p>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trip status */}
              <div className="border-t border-slate-100 mt-5 pt-4">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">Trạng thái chuyến xe</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Chờ khởi hành", key: "scheduled",  color: "#2563eb", bg: "#eff6ff" },
                    { label: "Đang chạy",      key: "departing",  color: "#d97706", bg: "#fffbeb" },
                    { label: "Hoàn thành",     key: "completed",  color: "#059669", bg: "#f0fdf4" },
                    { label: "Đã hủy",         key: "cancelled",  color: "#dc2626", bg: "#fef2f2" },
                  ].map(({ label, key, color, bg }) => (
                    <div key={key} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: bg }}>
                      <p className="text-lg font-extrabold" style={{ color }}>{data.tripStatus?.[key] ?? 0}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}