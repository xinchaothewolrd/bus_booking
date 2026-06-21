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
const STATUS_LIST = ["Tất cả", "active", "maintenance"];

const STATUS_META = {
  active: { label: "Đang hoạt động", color: "#059669", bg: "#f0fdf4", ring: "#a7f3d0" },
  maintenance: { label: "Bảo trì", color: "#d97706", bg: "#fffbeb", ring: "#fde68a" },
};

const PAGE_SIZE = 8;

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
  const m = STATUS_META[status] ?? STATUS_META.active;
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
function ConfirmModal({ bus, onClose, onConfirm, loading }) {
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
        <p className="font-bold text-slate-900 mb-1">Xóa xe khách?</p>
        <p className="text-xs text-slate-400 mb-3">Xe biển số <span className="font-semibold text-slate-700">{bus?.licensePlate}</span> sẽ bị xóa khỏi hệ thống.</p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
          ⚠️ Lưu ý: Bạn chỉ xóa được xe nếu xe đó chưa từng được gán vào Chuyến Đi nào.
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

// ─── Bus Modal ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  licensePlate: "",
  busTypeId: "",
  driverName: "",
  status: "active",
  maintenanceNote: "",
};

function BusModal({ bus, busTypes, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!bus?.id;

  useEffect(() => {
    if (bus) {
      setForm({
        id: bus.id,
        licensePlate: bus.licensePlate || bus.license_plate || "",
        busTypeId: bus.busTypeId || bus.bus_type_id || "",
        driverName: bus.driverName || bus.driver_name || "",
        status: bus.status || "active",
        maintenanceNote: bus.maintenanceNote || bus.maintenance_note || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [bus]);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.licensePlate.trim()) e.licensePlate = "Vui lòng nhập biển số xe";
    if (!form.busTypeId) e.busTypeId = "Vui lòng chọn loại xe";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      licensePlate: form.licensePlate.trim(),
      busTypeId: Number(form.busTypeId),
      driverName: form.driverName.trim() || null,
      status: form.status,
      maintenanceNote: form.status === "maintenance" ? form.maintenanceNote.trim() : null,
    };
    try {
      if (isEdit) {
        const { data } = await api.put(`/buses/${form.id}`, payload);
        onSave(data.data || data);
      } else {
        const { data } = await api.post("/buses", payload);
        onSave(data.data || data);
      }
    } catch (err) {
      setErrors({ _global: err.response?.data?.message || "Lưu thất bại, biển số xe có thể bị trùng." });
    } finally { setSaving(false); }
  };

  const selClass = (err) => `w-full text-sm px-3 py-2.5 rounded-xl border bg-slate-50 text-slate-900 outline-none transition ${err ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-blue-400 focus:ring-2 ring-blue-50"}`;
  const inpClass = (err) => selClass(err);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: isEdit ? '#eff6ff' : '#f0fdf4' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="12" rx="2.5" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="1.8" fill="none" />
                <circle cx="6.5" cy="18" r="1.5" fill={isEdit ? "#2563eb" : "#059669"} />
                <circle cx="17.5" cy="18" r="1.5" fill={isEdit ? "#2563eb" : "#059669"} />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">{isEdit ? "Chỉnh sửa xe khách" : "Thêm xe khách mới"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {errors._global && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{errors._global}</div>}

          {/* Biển số xe */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Biển số xe *</label>
            <input
              type="text"
              value={form.licensePlate}
              onChange={(e) => set("licensePlate", e.target.value)}
              placeholder="VD: 51A-12345"
              className={inpClass(errors.licensePlate)}
            />
            {errors.licensePlate && <p className="text-[11px] text-red-500 mt-1">{errors.licensePlate}</p>}
          </div>

          {/* Loại xe */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Loại xe tương ứng *</label>
            <select value={form.busTypeId} onChange={(e) => set("busTypeId", e.target.value)} className={selClass(errors.busTypeId)}>
              <option value="">-- Chọn loại xe --</option>
              {busTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.typeName} ({t.totalSeats} ghế)</option>
              ))}
            </select>
            {errors.busTypeId && <p className="text-[11px] text-red-500 mt-1">{errors.busTypeId}</p>}
          </div>

          {/* Tên tài xế */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tên tài xế phụ trách</label>
            <input
              type="text"
              value={form.driverName}
              onChange={(e) => set("driverName", e.target.value)}
              placeholder="Nhập tên tài xế"
              className={inpClass(false)}
            />
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Trạng thái xe</label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={selClass(false)}>
              <option value="active">Đang hoạt động</option>
              <option value="maintenance">Đang bảo trì / sửa chữa</option>
            </select>
          </div>

          {/* Ghi chú bảo trì */}
          {form.status === "maintenance" && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Ghi chú bảo trì</label>
              <textarea
                value={form.maintenanceNote}
                onChange={(e) => set("maintenanceNote", e.target.value)}
                placeholder="VD: Thay lốp, sửa máy lạnh, dự kiến xong ngày 25/05..."
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 ring-blue-50 h-20 resize-none"
              />
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
            {isEdit ? "Lưu thay đổi" : "Thêm xe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageBuses() {
  const [buses, setBuses] = useState([]);
  const [busTypes, setBusTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [busesRes, busTypesRes] = await Promise.all([
        api.get("/buses"),
        api.get("/bus-types")
      ]);
      setBuses(Array.isArray(busesRes.data) ? busesRes.data : busesRes.data.data ?? []);
      setBusTypes(Array.isArray(busTypesRes.data) ? busTypesRes.data : busTypesRes.data.data ?? []);
    } catch {
      showToast("Không thể tải danh sách xe", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save changes
  const handleSave = (saved) => {
    setModal(null);
    fetchData(); // Tải lại toàn bộ để có thông tin Join Loại Xe từ backend
    showToast(modal?.id ? "Cập nhật thông tin xe thành công!" : "Thêm xe thành công!");
  };

  // Delete bus
  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/buses/${confirmDel.id}`);
      setBuses((p) => p.filter((b) => b.id !== confirmDel.id));
      showToast(`Đã xóa xe biển số ${confirmDel.licensePlate || confirmDel.license_plate}!`);
      setConfirmDel(null);
    } catch {
      showToast("Xóa xe thất bại (xe có thể đã có chuyến chạy)", "error");
    } finally { setDelLoading(false); }
  };

  // Filter
  const filtered = buses.filter((b) => {
    const plate = (b.licensePlate || b.license_plate || "").toLowerCase();
    const driver = (b.driverName || b.driver_name || "").toLowerCase();
    const matchSearch = !search || plate.includes(search.toLowerCase()) || driver.includes(search.toLowerCase());
    const matchStatus = statusFilter === "Tất cả" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageData = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Stats
  const stats = {
    total: buses.length,
    active: buses.filter((b) => b.status === "active").length,
    maintenance: buses.filter((b) => b.status === "maintenance").length,
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
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Quản lý chi tiết xe</h1>
            <p className="text-sm text-slate-500 mt-0.5">Quản lý biển số xe, gán loại xe, tài xế và trạng thái vận hành.</p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-sm cursor-pointer"
            style={{ backgroundColor: '#2563eb' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            Thêm xe mới
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Tổng số xe đăng ký", value: stats.total, color: "#2563eb", bg: "#eff6ff", icon: "M3 11h20M7 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm13 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" },
            { label: "Đang hoạt động", value: stats.active, color: "#059669", bg: "#d1fae5", icon: "M5 13l4 4L19 7" },
            { label: "Đang bảo trì", value: stats.maintenance, color: "#d97706", bg: "#fef3c7", icon: "M10.3 21a2 2 0 11-4 0M17.7 21a2 2 0 11-4 0" },
          ].map(({ label, value, color, bg, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="6" width="20" height="12" rx="2.5" stroke={color} strokeWidth="2" fill="none" />
                  <path d={icon} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 leading-tight">{value}</p>
                <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table/Card Area */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2" />
                <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm biển số, tài xế..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
              {STATUS_LIST.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${statusFilter === s ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {s === "Tất cả" ? "Tất cả" : STATUS_META[s]?.label}
                </button>
              ))}
            </div>

            <p className="ml-auto text-xs text-slate-500 font-semibold shrink-0">{filtered.length} chiếc xe</p>
          </div>

          {/* Table */}
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["#", "Biển số xe", "Loại xe khách", "Số lượng ghế", "Tài xế phụ trách", "Trạng thái", "Ghi chú bảo trì", "Hành động"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-[11px] font-extrabold tracking-widest text-slate-500 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                            <rect x="2" y="6" width="20" height="12" rx="2.5" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                            <circle cx="6.5" cy="18" r="1.5" fill="#cbd5e1" />
                            <circle cx="17.5" cy="18" r="1.5" fill="#cbd5e1" />
                          </svg>
                          <p className="text-sm">Không tìm thấy xe nào phù hợp.</p>
                        </div>
                      </td>
                    </tr>
                  ) : pageData.map((bus) => {
                    const typeName = bus.busType?.typeName || "—";
                    const totalSeats = bus.busType?.totalSeats || "—";
                    return (
                      <tr key={bus.id} className="hover:bg-blue-50/20 transition row-fade text-slate-700">
                        <td className="px-5 py-4 text-[11px] font-mono text-slate-400">#{bus.id}</td>

                        {/* License Plate */}
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg font-mono tracking-wider shadow-2xs">
                            {bus.licensePlate || bus.license_plate}
                          </span>
                        </td>

                        {/* Bus Type */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{typeName}</p>
                        </td>

                        {/* Total Seats */}
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                            {totalSeats} chỗ
                          </span>
                        </td>

                        {/* Driver */}
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-slate-700">{bus.driverName || bus.driver_name || "—"}</p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={bus.status} />
                        </td>

                        {/* Maintenance Note */}
                        <td className="px-5 py-4 max-w-50 truncate">
                          <p className="text-xs text-slate-500" title={bus.maintenanceNote || bus.maintenance_note}>
                            {bus.maintenanceNote || bus.maintenance_note || "—"}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setModal(bus)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition border border-blue-100 cursor-pointer"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Sửa
                            </button>
                            <button
                              onClick={() => setConfirmDel(bus)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition border border-red-100 cursor-pointer"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              Xóa
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
              Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {filtered.length} chiếc xe
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p} onClick={() => setPage(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition text-white shadow-sm cursor-pointer"
                  style={{ backgroundColor: p === safePage ? '#2563eb' : 'transparent', color: p === safePage ? 'white' : '#64748b', border: p === safePage ? 'none' : '1px solid #e2e8f0' }}
                >{p}</button>
              ))}
              <button
                disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >Sau →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === "add" || (modal && modal.id)) && (
        <BusModal
          bus={modal === "add" ? null : modal}
          busTypes={busTypes}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {confirmDel && (
        <ConfirmModal bus={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete} loading={delLoading} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
