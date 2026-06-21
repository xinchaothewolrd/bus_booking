import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── API Config ───────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDuration(timeStr) {
  // timeStr: "HH:MM:SS" hoặc số phút
  if (!timeStr) return "—";
  if (typeof timeStr === "number") {
    const h = Math.floor(timeStr / 60), m = timeStr % 60;
    return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
  }
  const parts = timeStr.split(":").map(Number);
  const h = parts[0], m = parts[1];
  return h > 0 ? `${h}h${m > 0 ? m + "m" : ""}` : `${m}m`;
}

function fmtDistance(km) {
  if (!km) return "—";
  return `${km} km`;
}

function exportCSV(routes) {
  const header = ["ID", "Điểm đi", "Điểm đến", "Khoảng cách (km)", "Thời gian dự kiến"];
  const rows = routes.map((r) => [r.id, r.departureLocation, r.arrivalLocation, r.distanceKm ?? "", r.durationEst ?? ""]);
  const csv = [header, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "tuyen-duong.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-100 flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-xl animate-slide-up ${type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
      {type === "error"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-xs">✕</button>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmModal({ route, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-80 p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <polyline points="3 6 5 6 21 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 11v6M14 11v6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="font-bold text-slate-900 mb-1">Xóa tuyến đường?</p>
        <p className="text-xs text-slate-400 mb-1">Bạn sắp xóa tuyến</p>
        <p className="text-sm font-semibold text-slate-700 mb-2">
          "{route?.departureLocation} → {route?.arrivalLocation}"
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
          ⚠️ Các chuyến xe thuộc tuyến này cũng có thể bị ảnh hưởng.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Route Modal (Add / Edit) ─────────────────────────────────────────────────
const EMPTY_FORM = {
  departureLocation: "",
  arrivalLocation: "",
  distanceKm: "",
  durationEst: "",
};

function RouteModal({ route, onClose, onSave }) {
  const [form, setForm]   = useState(route ?? EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!route?.id;

  const [busTypes, setBusTypes] = useState([]);
  const [faresMap, setFaresMap] = useState({});
  const [loadingFares, setLoadingFares] = useState(false);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  useEffect(() => {
    const initModal = async () => {
      setLoadingFares(true);
      try {
        const [btRes, fRes] = await Promise.all([
          api.get("/bus-types"),
          isEdit ? api.get("/route-fares") : Promise.resolve({ data: [] })
        ]);
        const btypes = Array.isArray(btRes.data) ? btRes.data : btRes.data.data ?? [];
        setBusTypes(btypes);

        if (isEdit) {
          const allFares = Array.isArray(fRes.data) ? fRes.data : fRes.data.data ?? [];
          const routeFares = allFares.filter(f => f.routeId == route.id || f.route_id == route.id);
          const fMap = {};
          routeFares.forEach(f => {
            const btId = f.busTypeId || f.bus_type_id;
            fMap[btId] = {
              id: f.id,
              basePrice: f.basePrice || f.base_price || 0
            };
          });
          setFaresMap(fMap);
        }
      } catch (err) {
        console.error("Lỗi tải loại xe và bảng giá:", err);
      } finally {
        setLoadingFares(false);
      }
    };
    initModal();
  }, [isEdit, route]);

  const validate = () => {
    const e = {};
    if (!form.departureLocation.trim()) e.departureLocation = "Không được để trống";
    if (!form.arrivalLocation.trim())   e.arrivalLocation   = "Không được để trống";
    if (form.departureLocation.trim() === form.arrivalLocation.trim()) {
      e.arrivalLocation = "Điểm đến phải khác điểm đi";
    }
    if (form.distanceKm && isNaN(Number(form.distanceKm))) e.distanceKm = "Phải là số";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      ...form,
      distanceKm: form.distanceKm ? Number(form.distanceKm) : null,
    };
    try {
      let savedRoute;
      if (isEdit) {
        const { data } = await api.put(`/routes/${form.id}`, payload);
        savedRoute = data.data || data;
      } else {
        const { data } = await api.post("/routes", payload);
        savedRoute = data.data || data;
      }

      // Lưu song song thông tin bảng giá cho tuyến xe này
      const routeId = savedRoute.id;
      const farePromises = busTypes.map(async (bt) => {
        const price = faresMap[bt.id]?.basePrice ?? "";
        const existing = faresMap[bt.id];

        if (price === "" || price === undefined || price === null) return;

        if (existing?.id) {
          // Update existing
          await api.put(`/route-fares/${existing.id}`, { basePrice: Number(price) });
        } else {
          // Create new
          await api.post("/route-fares", {
            routeId,
            busTypeId: bt.id,
            basePrice: Number(price)
          });
        }
      });

      await Promise.all(farePromises);

      onSave(savedRoute);
    } catch {
      setErrors({ _global: "Lưu thất bại, thử lại." });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEdit ? "bg-blue-50" : "bg-emerald-50"}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <circle cx="5" cy="12" r="2.5" fill={isEdit ? "#2563eb" : "#059669"}/>
                <circle cx="19" cy="12" r="2.5" fill={isEdit ? "#2563eb" : "#059669"} opacity="0.5"/>
                <path d="M7.5 12h9" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2"/>
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">{isEdit ? "Chỉnh sửa tuyến đường" : "Thêm tuyến đường mới"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {errors._global && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{errors._global}</div>
          )}

          {/* Route visual */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Điểm đi</p>
              <p className="text-sm font-semibold text-slate-700 truncate">{form.departureLocation || "—"}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <div className="w-8 border-t-2 border-dashed border-slate-300" />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Điểm đến</p>
              <p className="text-sm font-semibold text-slate-700 truncate">{form.arrivalLocation || "—"}</p>
            </div>
          </div>

          <Field fkey="departureLocation" label="Điểm đi *" placeholder="VD: Hồ Chí Minh" form={form} set={set} errors={errors} />
          <Field fkey="arrivalLocation"   label="Điểm đến *" placeholder="VD: Đà Lạt" form={form} set={set} errors={errors} />

          <div className="grid grid-cols-2 gap-3">
            <Field fkey="distanceKm" label="Khoảng cách (km)" placeholder="VD: 300" type="number" form={form} set={set} errors={errors} />
            <Field fkey="durationEst" label="Thời gian dự kiến" placeholder="VD: 06:00:00" hint="Định dạng HH:MM:SS" form={form} set={set} errors={errors} />
          </div>

          {/* Cấu hình giá mặc định theo loại xe */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Giá vé mặc định theo loại xe
            </h3>
            {loadingFares ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            ) : busTypes.length === 0 ? (
              <p className="text-xs text-slate-400">Không tìm thấy loại xe nào trong hệ thống.</p>
            ) : (
              <div className="space-y-3">
                {busTypes.map((bt) => (
                  <div key={bt.id} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 min-w-[140px] truncate">
                      {bt.typeName || bt.type_name} ({bt.totalSeats || bt.total_seats} chỗ):
                    </span>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={faresMap[bt.id]?.basePrice ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFaresMap((p) => ({
                            ...p,
                            [bt.id]: {
                              ...p[bt.id],
                              basePrice: val === "" ? "" : Number(val)
                            }
                          }));
                        }}
                        placeholder="Chưa cấu hình (0đ)"
                        className="w-full text-sm pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-emerald-400 focus:ring-2 ring-emerald-50 transition"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">đ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: isEdit ? '#2563eb' : '#16a34a' }}
          >
            {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            {isEdit ? "Lưu thay đổi" : "Tạo tuyến đường"}
          </button>
        </div>
      </div>
    </div>
  );
}

const Field = ({ fkey, label, placeholder, type = "text", hint, form, set, errors }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
    <input
      type={type}
      value={form[fkey] ?? ""}
      onChange={(e) => set(fkey, e.target.value)}
      placeholder={placeholder}
      className={`w-full text-sm px-3 py-2.5 rounded-xl border bg-slate-50 text-slate-900 outline-none transition
        ${errors[fkey] ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-emerald-400 focus:ring-2 ring-emerald-50"}`}
    />
    {errors[fkey] && <p className="text-[11px] text-red-500 mt-1">{errors[fkey]}</p>}
    {hint && !errors[fkey] && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

// ─── RouteStopsModal (Manage Pick-up/Drop-off Stops) ──────────────────────────
function RouteStopsModal({ route, onClose }) {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingStop, setEditingStop] = useState(null); // null | { ...stop } | "add"
  const [form, setForm] = useState({
    stopName: "",
    address: "",
    stopType: "pickup",
    stopOrder: 1,
    arriveOffsetMinutes: 0
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchStops = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/route-stops?routeId=${route.id}`);
      setStops(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      console.error("Lỗi tải điểm đậu:", err);
    } finally {
      setLoading(false);
    }
  }, [route.id]);

  useEffect(() => {
    fetchStops();
  }, [fetchStops]);

  const handleEditClick = (stop) => {
    setEditingStop(stop);
    setForm({
      stopName: stop.stopName || stop.stop_name || "",
      address: stop.address || "",
      stopType: stop.stopType || stop.stop_type || "pickup",
      stopOrder: stop.stopOrder !== undefined ? stop.stopOrder : (stop.stop_order ?? 1),
      arriveOffsetMinutes: stop.arriveOffsetMinutes !== undefined ? stop.arriveOffsetMinutes : (stop.arrive_offset_minutes ?? 0)
    });
    setError("");
  };

  const handleAddClick = () => {
    setEditingStop("add");
    // Auto-calculate next stopOrder
    const maxOrder = stops.reduce((max, s) => {
      const ord = s.stopOrder !== undefined ? s.stopOrder : (s.stop_order ?? 0);
      return ord > max ? ord : max;
    }, 0);
    setForm({
      stopName: "",
      address: "",
      stopType: "pickup",
      stopOrder: maxOrder + 1,
      arriveOffsetMinutes: maxOrder === 0 ? 0 : 30
    });
    setError("");
  };

  const handleCancelForm = () => {
    setEditingStop(null);
    setError("");
  };

  const handleSaveStop = async () => {
    if (!form.stopName.trim()) {
      setError("Tên bến/điểm đậu không được để trống.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      routeId: route.id,
      stopName: form.stopName.trim(),
      address: form.address.trim(),
      stopType: form.stopType,
      stopOrder: Number(form.stopOrder),
      arriveOffsetMinutes: Number(form.arriveOffsetMinutes)
    };

    try {
      if (editingStop === "add") {
        await api.post("/route-stops", payload);
      } else {
        await api.put(`/route-stops/${editingStop.id}`, payload);
      }
      fetchStops();
      setEditingStop(null);
    } catch (err) {
      setError(err.response?.data?.message || "Lưu điểm đậu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa điểm đậu này?")) return;
    try {
      await api.delete(`/route-stops/${stopId}`);
      fetchStops();
    } catch (err) {
      alert("Xóa thất bại: " + (err.response?.data?.message || "Điểm dừng đang được sử dụng trong vé đặt."));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quản lý điểm đậu / Đón trả</h2>
              <p className="text-xs text-slate-400 font-medium">Tuyến: {route.departureLocation} → {route.arrivalLocation}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body content (scrollable list) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {editingStop ? (
            /* Form thêm / sửa */
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4 animate-slide-up">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {editingStop === "add" ? "Thêm điểm đậu mới" : "Chỉnh sửa điểm đậu"}
              </h3>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-xs text-red-600">{error}</div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên bến / Điểm đậu *</label>
                  <input
                    type="text"
                    value={form.stopName}
                    onChange={(e) => setForm({ ...form, stopName: e.target.value })}
                    placeholder="VD: Bến xe Phan Rang, Ngã 3 Tân Phong..."
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold outline-none focus:border-blue-400 focus:ring-2 ring-blue-50 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Địa chỉ chi tiết</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="VD: Số 24 Thống Nhất, Phan Rang..."
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold outline-none focus:border-blue-400 focus:ring-2 ring-blue-50 transition"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Loại điểm</label>
                    <select
                      value={form.stopType}
                      onChange={(e) => setForm({ ...form, stopType: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold outline-none focus:border-blue-400 focus:ring-2 ring-blue-50 transition"
                    >
                      <option value="pickup">Đón khách (Pickup)</option>
                      <option value="dropoff">Trả khách (Dropoff)</option>
                      <option value="both">Cả hai (Both)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Thứ tự chặng</label>
                    <input
                      type="number"
                      value={form.stopOrder}
                      onChange={(e) => setForm({ ...form, stopOrder: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold outline-none focus:border-blue-400 focus:ring-2 ring-blue-50 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Thời gian chênh (phút)</label>
                    <input
                      type="number"
                      value={form.arriveOffsetMinutes}
                      onChange={(e) => setForm({ ...form, arriveOffsetMinutes: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold outline-none focus:border-blue-400 focus:ring-2 ring-blue-50 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveStop}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition disabled:opacity-60 flex items-center gap-1.5"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Lưu điểm đậu
                </button>
              </div>
            </div>
          ) : (
            /* Nút thêm điểm đậu */
            <div className="flex justify-end shrink-0">
              <button
                onClick={handleAddClick}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold bg-blue-600 hover:bg-blue-700 transition shadow-sm"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Thêm điểm đón/trả khách
              </button>
            </div>
          )}

          {/* Danh sách điểm đậu (Timeline Style) */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : stops.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-600 font-semibold">Tuyến đường này chưa cấu hình các điểm đón/trả khách.</p>
              <p className="text-[10px] text-slate-500 mt-1">Vui lòng nhấp vào nút phía trên để thêm mới.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
                Lộ trình chi tiết ({stops.length} điểm)
              </h3>
              
              <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-5 py-1">
                {stops.map((stop, idx) => {
                  const sName = stop.stopName || stop.stop_name;
                  const sType = stop.stopType || stop.stop_type || "pickup";
                  const sOrder = stop.stopOrder !== undefined ? stop.stopOrder : (stop.stop_order ?? 0);
                  const sOffset = stop.arriveOffsetMinutes !== undefined ? stop.arriveOffsetMinutes : (stop.arrive_offset_minutes ?? 0);
                  
                  // Dot color and icons
                  const isPickup = sType === "pickup";
                  const isDropoff = sType === "dropoff";
                  const dotColor = isPickup ? "bg-emerald-500 ring-emerald-100" : isDropoff ? "bg-orange-500 ring-orange-100" : "bg-blue-500 ring-blue-100";
                  const labelColor = isPickup ? "text-emerald-700 bg-emerald-50" : isDropoff ? "text-orange-700 bg-orange-50" : "text-blue-700 bg-blue-50";
                  const labelText = isPickup ? "Đón" : isDropoff ? "Trả" : "Cả hai";

                  return (
                    <div key={stop.id} className="relative group animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                      {/* Timeline dot marker */}
                      <span className={`absolute -left-10 top-0.5 w-7 h-7 rounded-full border border-white flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 ${dotColor} ring-4 transition group-hover:scale-110`}>
                        {sOrder}
                      </span>

                      {/* Content block */}
                      <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 hover:bg-slate-50 hover:border-slate-200 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-xs font-bold text-slate-800 truncate leading-tight">{sName}</h4>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 ${labelColor}`}>
                              {labelText}
                            </span>
                            {sOffset > 0 && (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                                +{sOffset} phút
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{stop.address || "Chưa có địa chỉ chi tiết"}</p>
                        </div>

                        {/* Actions for this stop */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition shrink-0">
                          <button
                            onClick={() => handleEditClick(stop)}
                            className="w-7 h-7 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-slate-400 transition"
                            title="Sửa điểm dừng"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteStop(stop.id)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-400 transition"
                            title="Xóa điểm dừng"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex justify-end border-t border-slate-100 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

export default function ManageRoutes() {
  const [routes, setRoutes]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [modal, setModal]         = useState(null);   // null | "add" | { ...route }
  const [confirmDel, setConfirmDel] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast]         = useState(null);
  const [manageStopsRoute, setManageStopsRoute] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/routes");
      setRoutes(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      showToast("Không thể tải danh sách tuyến đường", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = (saved) => {
    setRoutes((p) => {
      const idx = p.findIndex((r) => r.id === saved.id);
      if (idx >= 0) { const next = [...p]; next[idx] = saved; return next; }
      return [saved, ...p];
    });
    setModal(null);
    showToast(modal?.id ? "Cập nhật tuyến đường thành công!" : "Thêm tuyến đường thành công!");
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/routes/${confirmDel.id}`);
      setRoutes((p) => p.filter((r) => r.id !== confirmDel.id));
      showToast(`Đã xóa tuyến "${confirmDel.departureLocation} → ${confirmDel.arrivalLocation}"`);
      setConfirmDel(null);
    } catch {
      showToast("Xóa thất bại", "error");
    } finally { setDelLoading(false); }
  };

  // ── Filter & paginate ────────────────────────────────────────────────────────
  const filtered = routes.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.departureLocation?.toLowerCase().includes(q) || r.arrivalLocation?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalKm = routes.reduce((s, r) => s + (r.distanceKm ?? 0), 0);
  const avgKm   = routes.length ? Math.round(totalKm / routes.length) : 0;

  return (
    <>
      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slide-up { animation: slide-up .25s ease-out }
        @keyframes fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .row-fade { animation: fade-in .2s ease-out }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Quản lý tuyến đường</h1>
            <p className="text-sm text-slate-500 mt-0.5">Thêm, sửa, xóa các tuyến xe trong hệ thống.</p>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              onClick={() => setModal("add")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-sm"
              style={{ backgroundColor: '#16a34a' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Thêm tuyến đường
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Tổng tuyến đường", value: routes.length, color: "emerald",
              icon: "M5 12h14M13 6l6 6-6 6",
            },
            {
              label: "Tổng km quản lý", value: `${totalKm.toLocaleString()} km`, color: "blue",
              icon: "M3 12h18M3 6h18M3 18h18",
            },
            {
              label: "Khoảng cách TB", value: `${avgKm} km`, color: "amber",
              icon: "M12 2v20M2 12h20",
            },
            {
              label: "Kết quả tìm kiếm", value: filtered.length, color: "violet",
              icon: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
            },
          ].map(({ label, value, color, icon }) => {
            const bg = { emerald:"bg-emerald-50", blue:"bg-blue-50", amber:"bg-amber-50", violet:"bg-violet-50" };
            const tx = { emerald:"text-emerald-600", blue:"text-blue-600", amber:"text-amber-600", violet:"text-violet-600" };
            const bd = { emerald:"border-emerald-100", blue:"border-blue-100", amber:"border-amber-100", violet:"border-violet-100" };
            return (
              <div key={label} className={`bg-white rounded-2xl border ${bd[color]} p-4 flex items-center gap-3 shadow-sm`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg[color]} ${tx[color]}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d={icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-slate-900">{value}</p>
                  <p className="text-[11px] text-slate-400 font-medium leading-tight">{label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Table card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm điểm đi, điểm đến..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
            </div>
            <p className="ml-auto text-xs text-slate-500 font-semibold shrink-0">{filtered.length} tuyến</p>
          </div>

          {/* Table */}
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["#", "Tuyến đường", "Khoảng cách", "Thời gian dự kiến", "Hành động"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-extrabold tracking-widest text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="9" stroke="#cbd5e1" strokeWidth="1.5"/>
                          <path d="M8 12h8M12 8v8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <p className="text-sm">Không tìm thấy tuyến đường nào.</p>
                      </div>
                    </td></tr>
                  ) : pageData.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/10 transition row-fade">
                      <td className="px-5 py-3.5 text-[11px] font-mono text-slate-500">#{r.id}</td>

                      {/* Route visual cell */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {/* Departure dot */}
                          <div className="flex flex-col items-center gap-0.5 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <div className="w-px h-3 border-l-2 border-dashed border-slate-200" />
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                          </div>
                          {/* Labels */}
                          <div>
                            <p className="text-[14px] font-bold text-slate-800 leading-tight">{r.departureLocation}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{r.arrivalLocation}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="5" cy="12" r="2" fill="currentColor" opacity="0.4"/>
                            <circle cx="19" cy="12" r="2" fill="currentColor" opacity="0.4"/>
                          </svg>
                          <span className="text-xs font-medium text-slate-700">{fmtDistance(r.distanceKm)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <span className="text-xs font-medium text-slate-700">{fmtDuration(r.durationEst)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setModal(r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-100"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span className="notranslate">Sửa</span>
                          </button>
                          <button
                            onClick={() => setManageStopsRoute(r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition border border-emerald-100"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                            </svg>
                            <span>Điểm đậu</span>
                          </button>
                          <button
                            onClick={() => setConfirmDel(r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition border border-red-100"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {filtered.length} tuyến đường
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${p === safePage ? "text-white shadow-sm" : "text-slate-500 border border-slate-200 hover:bg-white"}`}
                  style={p === safePage ? { backgroundColor: '#16a34a' } : {}}
                >{p}</button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >Sau →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "add" || (modal && modal.id)) && (
        <RouteModal route={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {confirmDel && (
        <ConfirmModal route={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete} loading={delLoading} />
      )}
      {manageStopsRoute && (
        <RouteStopsModal route={manageStopsRoute} onClose={() => setManageStopsRoute(null)} />
      )}

      {/* Toast */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}