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
const STATUS_LIST = ["Tất cả", "scheduled", "departing", "completed", "cancelled"];

const STATUS_META = {
  scheduled: { label: "Chờ khởi hành", color: "#2563eb", bg: "#eff6ff", ring: "#bfdbfe" },
  departing: { label: "Đang chạy", color: "#d97706", bg: "#fffbeb", ring: "#fde68a" },
  completed: { label: "Hoàn thành", color: "#059669", bg: "#f0fdf4", ring: "#a7f3d0" },
  cancelled: { label: "Đã hủy", color: "#dc2626", bg: "#fef2f2", ring: "#fecaca" },
};

const PAGE_SIZE = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDatetime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function fmtPrice(p) {
  if (p === undefined || p === null || p === "") return "—";
  return Number(p).toLocaleString("vi-VN") + "đ";
}

function toInputDatetime(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [onClose]);
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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.scheduled;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ color: m.color, backgroundColor: m.bg, boxShadow: `0 0 0 1px ${m.ring}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmModal({ trip, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-80 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polyline points="3 6 5 6 21 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 11v6M14 11v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <p className="font-bold text-slate-900 mb-1">Xóa chuyến xe?</p>
        <p className="text-xs text-slate-400 mb-3">Chuyến xe <span className="font-semibold text-slate-700">#{trip?.id}</span> sẽ bị xóa vĩnh viễn.</p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
          ⚠️ Các vé đã đặt thuộc chuyến này cũng có thể bị ảnh hưởng.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#ef4444' }}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Trip Modal ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  routeId: "",
  busTypeId: "",
  busId: "",
  departureTime: "",
  arrivalTimeExpected: "",
  price: "",
  status: "scheduled",
};

function TripModal({ trip, routes, busTypes, buses, fares, rules, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!trip?.id;

  // Ép dữ liệu vào form mỗi khi trip thay đổi
  useEffect(() => {
    if (trip) {
      const initialBusId = trip.busId || trip.bus_id || "";
      const associatedBus = buses.find((b) => b.id == initialBusId);
      const initialBusTypeId = associatedBus?.busTypeId || associatedBus?.bus_type_id || associatedBus?.busType?.id || "";

      setForm({
        ...trip,
        routeId: trip.routeId || trip.route_id || "",
        busTypeId: initialBusTypeId,
        busId: initialBusId,
        price: trip.price ?? trip.fare ?? trip.ticketPrice ?? "",
        departureTime: toInputDatetime(trip.departureTime || trip.departure_time),
        arrivalTimeExpected: toInputDatetime(trip.arrivalTimeExpected || trip.arrival_time_expected),
        status: trip.status || "scheduled"
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [trip, buses]);

  // Tự động tính giá vé khi chọn Tuyến đường, Xe hoặc thời gian xuất bến thay đổi
  useEffect(() => {
    const rId = form.routeId;
    const bId = form.busId;
    if (!rId || !bId) {
      setForm((p) => ({ ...p, price: 0 }));
      return;
    }

    const bus = buses.find((b) => b.id == bId);
    const btId = bus?.busTypeId || bus?.bus_type_id || bus?.busType?.id;

    if (!btId) {
      setForm((p) => ({ ...p, price: 0 }));
      return;
    }

    const fare = fares?.find(
      (f) =>
        (f.routeId == rId || f.route_id == rId) &&
        (f.busTypeId == btId || f.bus_type_id == btId)
    );

    if (!fare) {
      setForm((p) => ({ ...p, price: 0 }));
      return;
    }

    let calculatedPrice = parseFloat(fare.basePrice || fare.base_price || 0);

    // Áp dụng luật phụ thu nếu có thời gian xuất bến
    if (form.departureTime) {
      const departureDate = new Date(form.departureTime);
      const activeRules = (rules || [])
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
          if (rule.priceMultiplier) calculatedPrice *= parseFloat(rule.priceMultiplier);
          if (rule.priceDelta) calculatedPrice += parseFloat(rule.priceDelta);
        }
      });
    }

    setForm((p) => ({ ...p, price: Math.round(calculatedPrice) }));
  }, [form.routeId, form.busId, form.departureTime, buses, fares, rules]);

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: "" })); };

  const handleBusTypeChange = (val) => {
    setForm((p) => ({ ...p, busTypeId: val, busId: "" }));
    setErrors((p) => ({ ...p, busTypeId: "", busId: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.routeId) e.routeId = "Chọn tuyến đường";
    if (!form.busTypeId) e.busTypeId = "Chọn loại xe";
    if (!form.busId) e.busId = "Chọn xe theo biển số";
    if (!form.departureTime) e.departureTime = "Chọn giờ khởi hành";
    if (!form.price || isNaN(Number(form.price))) e.price = "Giá vé không hợp lệ";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      ...form,
      price: Number(form.price),
      routeId: Number(form.routeId),
      busId: Number(form.busId)
    };
    try {
      if (isEdit) {
        const { data } = await api.put(`/trips/${form.id}`, payload);
        onSave(data.data || data);
      } else {
        const { data } = await api.post("/trips", payload);
        onSave(data.data || data);
      }
    } catch {
      setErrors({ _global: "Lưu thất bại, thử lại." });
    } finally { setSaving(false); }
  };

  const selClass = (err) => `w-full text-sm px-3 py-2.5 rounded-xl border bg-slate-50 text-slate-900 outline-none transition ${err ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-blue-400 focus:ring-2 ring-blue-50"}`;
  const inpClass = (err) => selClass(err);

  const filteredBuses = buses.filter(b => b.busTypeId == form.busTypeId || b.bus_type_id == form.busTypeId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: isEdit ? '#eff6ff' : '#f0fdf4' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="1.8" fill="none" />
                <path d="M3 9h18M8 4V2M16 4V2" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">{isEdit ? "Chỉnh sửa chuyến xe" : "Tạo chuyến xe mới"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {errors._global && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{errors._global}</div>}

          {/* Route + Bus type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tuyến đường *</label>
              <select value={form.routeId} onChange={(e) => set("routeId", e.target.value)} className={selClass(errors.routeId)}>
                <option value="">-- Chọn tuyến --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.departureLocation} → {r.arrivalLocation}</option>
                ))}
              </select>
              {errors.routeId && <p className="text-[11px] text-red-500 mt-1">{errors.routeId}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Loại xe khách *</label>
              <select value={form.busTypeId} onChange={(e) => handleBusTypeChange(e.target.value)} className={selClass(errors.busTypeId)}>
                <option value="">-- Chọn loại xe --</option>
                {busTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.typeName} ({t.totalSeats} chỗ)</option>
                ))}
              </select>
              {errors.busTypeId && <p className="text-[11px] text-red-500 mt-1">{errors.busTypeId}</p>}
            </div>
          </div>

          {/* Bus (License Plate) + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn xe khách (Theo biển số) *</label>
              <select
                value={form.busId}
                onChange={(e) => set("busId", e.target.value)}
                disabled={!form.busTypeId}
                className={selClass(errors.busId)}
              >
                <option value="">{form.busTypeId ? "-- Chọn biển số xe --" : "-- Chọn loại xe trước --"}</option>
                {filteredBuses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.licensePlate || b.license_plate} {b.driverName || b.driver_name ? `(Tài: ${b.driverName || b.driver_name})` : ""}
                  </option>
                ))}
              </select>
              {errors.busId && <p className="text-[11px] text-red-500 mt-1">{errors.busId}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Trạng thái chuyến xe</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selClass(false)}>
                <option value="scheduled">Chờ khởi hành</option>
                <option value="departing">Đang chạy</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Departure + Arrival */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ xuất bến *</label>
              <input type="datetime-local" value={form.departureTime} onChange={(e) => set("departureTime", e.target.value)} className={inpClass(errors.departureTime)} />
              {errors.departureTime && <p className="text-[11px] text-red-500 mt-1">{errors.departureTime}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ đến dự kiến</label>
              <input type="datetime-local" value={form.arrivalTimeExpected} onChange={(e) => set("arrivalTimeExpected", e.target.value)} className={inpClass(false)} />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Giá vé tự động (VNĐ) *</label>
            <input
              type="number"
              value={form.price}
              disabled={true}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none cursor-not-allowed font-semibold"
            />
            <p className="text-[10px] text-blue-500 mt-1 italic font-medium">
              ⓘ Lưu ý: Giá vé tự động tính theo tuyến + loại xe của chuyến đi.
            </p>
            {errors.price && <p className="text-[11px] text-red-500 mt-1">{errors.price}</p>}
          </div>

          {/* Preview card */}
          {(form.route_id || form.departure_time || form.price) && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase mb-2">Xem trước</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {routes.find((r) => r.id == form.routeId)
                      ? `${routes.find((r) => r.id == form.routeId).departureLocation} → ${routes.find((r) => r.id == form.routeId).arrivalLocation}`
                      : "Chưa chọn tuyến"}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{form.departureTime ? fmtDatetime(form.departureTime) : "Chưa chọn giờ"}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-blue-600">{form.price ? fmtPrice(form.price) : "—"}</p>
                  <StatusBadge status={form.status} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: isEdit ? '#2563eb' : '#059669' }}
          >
            {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Tạo chuyến xe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageTrips() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [fares, setFares] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── Fetch all data ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tripsRes, routesRes, busTypeRes, busRes, faresRes, rulesRes] = await Promise.all([
        api.get("/trips"),
        api.get("/routes"),
        api.get("/bus-types"),
        api.get("/buses"),
        api.get("/route-fares"),
        api.get("/price-rules"),
      ]);
      setTrips(Array.isArray(tripsRes.data) ? tripsRes.data : tripsRes.data.data ?? []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : routesRes.data.data ?? []);
      setBusTypes(Array.isArray(busTypeRes.data) ? busTypeRes.data : busTypeRes.data.data ?? []);
      setBuses(Array.isArray(busRes.data) ? busRes.data : busRes.data.data ?? []);
      setFares(Array.isArray(faresRes.data) ? faresRes.data : faresRes.data.data ?? []);
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data.data ?? []);
    } catch {
      showToast("Không thể tải dữ liệu", "error");
    } finally { setLoading(false); }
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

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = (saved) => {
    setTrips((p) => {
      const idx = p.findIndex((t) => t.id === saved.id);
      if (idx >= 0) { const n = [...p]; n[idx] = saved; return n; }
      return [saved, ...p];
    });
    setModal(null);
    fetchAll(); // Tải lại toàn bộ để có đầy đủ thông tin Join (Route, BusType)
    showToast(modal?.id ? "Cập nhật chuyến xe thành công!" : "Tạo chuyến xe thành công!");
  };

  // ── Update status inline ─────────────────────────────────────────────────────
  const updateStatus = async (trip, newStatus) => {
    const prev = trip.status;
    setTrips((p) => p.map((t) => t.id === trip.id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/trips/${trip.id}/status`, { status: newStatus });
      showToast("Cập nhật trạng thái thành công!");
    } catch {
      setTrips((p) => p.map((t) => t.id === trip.id ? { ...t, status: prev } : t));
      showToast("Cập nhật thất bại", "error");
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/trips/${confirmDel.id}`);
      setTrips((p) => p.filter((t) => t.id !== confirmDel.id));
      showToast("Đã xóa chuyến xe!");
      setConfirmDel(null);
    } catch {
      showToast("Xóa thất bại", "error");
    } finally { setDelLoading(false); }
  };

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = trips.filter((t) => {
    const route = routes.find((r) => r.id === t.routeId);
    const matchSearch = !search || (
      route?.departureLocation?.toLowerCase().includes(search.toLowerCase()) ||
      route?.arrivalLocation?.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).includes(search)
    );
    const matchStatus = statusFilter === "Tất cả" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total: trips.length,
    scheduled: trips.filter((t) => t.status === "scheduled").length,
    departing: trips.filter((t) => t.status === "departing").length,
    completed: trips.filter((t) => t.status === "completed").length,
  };

  const getRoute = (id) => routes.find((r) => r.id === id || r.id === Number(id));
  const getBusType = (id) => busTypes.find((b) => b.id === id || b.id === Number(id));

  return (
    <>
      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slide-up { animation: slide-up .25s ease-out }
        @keyframes fade-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        .row-fade { animation: fade-in .18s ease-out }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Quản lý chuyến xe</h1>
            <p className="text-sm text-slate-500 mt-0.5">Tạo lịch chạy và cập nhật trạng thái chuyến xe.</p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-sm"
            style={{ backgroundColor: '#2563eb' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Tạo chuyến xe
          </button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng chuyến xe", value: stats.total, color: "#2563eb", bg: "#eff6ff", icon: "M3 4h18M3 8h18M5 12h14M7 16h10M9 20h6" },
            { label: "Chờ khởi hành", value: stats.scheduled, color: "#2563eb", bg: "#dbeafe", icon: "M12 8v4l3 3M12 3a9 9 0 100 18A9 9 0 0012 3z" },
            { label: "Đang chạy", value: stats.departing, color: "#d97706", bg: "#fef3c7", icon: "M5 12h14M13 6l6 6-6 6" },
            { label: "Hoàn thành", value: stats.completed, color: "#059669", bg: "#d1fae5", icon: "M5 13l4 4L19 7" },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d={icon} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 leading-tight">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-slate-100">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tuyến, mã chuyến..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
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

            <p className="ml-auto text-xs text-slate-500 font-semibold shrink-0">{filtered.length} chuyến</p>
          </div>

          {/* Table */}
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["#", "Tuyến đường", "Loại xe", "Khởi hành", "Giá vé", "Trạng thái", "Hành động"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold tracking-widest text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="16" rx="2" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                          <path d="M3 9h18M8 4V2M16 4V2" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p className="text-sm">Không tìm thấy chuyến xe nào.</p>
                      </div>
                    </td></tr>
                  ) : pageData.map((trip) => {
                    const rId = trip.route_id || trip.routeId;
                    const bId = trip.bus_id || trip.busId;
                    const btId = trip.bus_type_id || trip.busTypeId || buses.find(b => b.id == bId)?.bus_type_id;

                    const route = getRoute(rId);
                    const busType = getBusType(btId);
                    return (
                      <tr key={trip.id} className="hover:bg-blue-50/20 transition row-fade text-slate-700">
                        <td className="px-5 py-4 text-[11px] font-mono text-slate-500">#{trip.id}</td>

                        {/* Route */}
                        <td className="px-5 py-4">
                          {route ? (
                            <div>
                              <p className="text-[14px] font-bold text-slate-800 leading-tight">{route.departureLocation}</p>
                              <p className="text-[11px] text-slate-500 mt-1 leading-tight">{route.arrivalLocation}</p>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </td>

                        {/* Bus type */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            {busType?.typeName || trip.bus?.busType?.typeName || "—"}
                          </span>
                        </td>

                        {/* Departure */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-700">{fmtDatetime(trip.departureTime)}</p>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-blue-600">
                            {fmtPrice(getTripPrice(trip))}
                          </span>
                        </td>

                        {/* Status — inline dropdown */}
                        <td className="px-5 py-4">
                          <select
                            value={trip.status}
                            onChange={(e) => updateStatus(trip, e.target.value)}
                            className="text-[10px] font-bold px-2 py-1.5 rounded-full border-0 outline-none cursor-pointer"
                            style={{
                              color: STATUS_META[trip.status]?.color,
                              backgroundColor: STATUS_META[trip.status]?.bg,
                              boxShadow: `0 0 0 1px ${STATUS_META[trip.status]?.ring}`,
                            }}
                          >
                            <option value="scheduled">Sắp đi</option>
                            <option value="departing">Đang đi</option>
                            <option value="completed">Xong</option>
                            <option value="cancelled">Hủy</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModal(trip)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-100"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span className="notranslate">Sửa</span>
                            </button>
                            <button
                              onClick={() => setConfirmDel(trip)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition border border-red-100"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              <span className="notranslate">Xóa</span>
                            </button>
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
              Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {filtered.length} chuyến xe
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p} onClick={() => setPage(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white shadow-sm"
                  style={{ backgroundColor: p === safePage ? '#2563eb' : 'transparent', color: p === safePage ? 'white' : '#64748b', border: p === safePage ? 'none' : '1px solid #e2e8f0' }}
                >{p}</button>
              ))}
              <button
                disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >Sau →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "add" || (modal && modal.id)) && (
        <TripModal
          trip={modal === "add" ? null : { ...modal, price: getTripPrice(modal) }}
          routes={routes}
          busTypes={busTypes}
          buses={buses}
          fares={fares}
          rules={rules}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {confirmDel && (
        <ConfirmModal trip={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete} loading={delLoading} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}