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

// ─── Config giới hạn ─────────────────────────────────────────────────────────
const LIMITS = { rows: { min: 1, max: 10 }, cols: { min: 1, max: 10 } };

// Clamp giá trị trong giới hạn
function clamp(val, min, max) {
  const n = Number(val);
  if (isNaN(n)) return min;
  return Math.min(Math.max(n, min), max);
}

// ─── Build seat_layout JSON ──────────────────────────────────────────────────
function buildLayout(rows, cols, floors = 2) {
  return {
    floors: Number(floors) || 1,
    rows: rows,
    cols: cols
  };
}

// Parse layout về rows/cols để hiện vào form khi edit
function parseLayout(layout) {
  if (!layout) return { rows: 3, cols: 2 };
  // Format 2 tầng (array of floor objects)
  if (layout.floors && Array.isArray(layout.floors)) {
    const firstFloor = layout.floors[0];
    return {
      rows: firstFloor?.rows?.length ?? 3,
      cols: firstFloor?.rows?.[0]?.length ?? 2,
    };
  }
  // Format đơn giản (object {rows, cols, floors})
  if (layout.rows && layout.cols) {
    return { rows: layout.rows, cols: layout.cols };
  }
  // Format cũ (array 2D)
  if (Array.isArray(layout)) {
    return { rows: layout.length, cols: layout[0]?.length ?? 2 };
  }
  return { rows: 3, cols: 2 };
}

function totalSeatsFromLayout(rows, cols, floors = 2) {
  return rows * cols * (Number(floors) || 1);
}

const PAGE_SIZE = 6;

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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── Input số có giới hạn (clamp + hiện cảnh báo) ────────────────────────────
function ClampedInput({ label, value, min, max, onChange, hint }) {
  const [warn, setWarn] = useState("");

  const handleChange = (e) => {
    const raw = e.target.value;
    const n   = Number(raw);
    if (raw === "" || isNaN(n)) { onChange(min); return; }
    if (n < min) { setWarn(`Tối thiểu ${min}`); onChange(min); return; }
    if (n > max) { setWarn(`Tối đa ${max}`);    onChange(max); return; }
    setWarn("");
    onChange(n);
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number" min={min} max={max} value={value}
          onChange={handleChange}
          className={`w-full text-sm px-3 py-2.5 rounded-xl border bg-slate-50 text-slate-900 outline-none transition
            ${warn ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200 focus:border-indigo-400 focus:ring-2 ring-indigo-50"}`}
        />
        {warn && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
            {warn}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Seat Layout Preview (2 tầng) ─────────────────────────────────────────────
function SeatLayoutPreview({ layout, compact }) {
  const size = compact ? "w-5 h-5 text-[7px]" : "w-8 h-8 text-[10px]";
  const gap  = compact ? "gap-1" : "gap-1.5";

  const FLOOR_STYLE = [
    { color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", label: "Tầng dưới (A)" },
    { color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", label: "Tầng trên (B)" },
  ];

  let floorData = [];
  if (layout?.floors) {
    if (Array.isArray(layout.floors)) {
        floorData = layout.floors;
    } else if (typeof layout.floors === 'number') {
        for (let i = 0; i < layout.floors; i++) {
            const prefix = String.fromCharCode(65 + i);
            const rowsArr = [];
            for (let r = 0; r < layout.rows; r++) {
                const colsArr = [];
                for (let c = 0; c < layout.cols; c++) {
                    colsArr.push(`${prefix}${r * layout.cols + c + 1}`);
                }
                rowsArr.push(colsArr);
            }
            floorData.push({ floor: i + 1, label: `Tầng ${i + 1}`, rows: rowsArr });
        }
    }
  } else if (Array.isArray(layout)) {
    floorData = [{ floor: 1, label: "Sơ đồ", rows: layout }];
  } else if (layout?.rows && layout?.cols) {
     const rowsArr = [];
     for (let r = 0; r < layout.rows; r++) {
         const colsArr = [];
         for (let c = 0; c < layout.cols; c++) {
             colsArr.push(`${r * layout.cols + c + 1}`);
         }
         rowsArr.push(colsArr);
     }
     floorData = [{ floor: 1, label: "Sơ đồ", rows: rowsArr }];
  }

  if (floorData.length === 0) return <span className="text-xs text-slate-500">Chưa có sơ đồ</span>;

  return (
    <div className="space-y-3">
      {floorData.map((floor, fi) => {
        const s = FLOOR_STYLE[fi] ?? FLOOR_STYLE[0];
        return (
          <div key={fi}>
            <p className="text-[10px] font-bold mb-1.5" style={{ color: s.color }}>{floor.label ?? s.label}</p>
            <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
              {floor.rows?.map((row, ri) => (
                <div key={ri} className={`flex ${gap}`}>
                  {row.map((seat, ci) => (
                    <div
                      key={ci}
                      className={`${size} rounded flex items-center justify-center font-bold`}
                      style={{ backgroundColor: s.bg, color: s.color, boxShadow: `0 0 0 1px ${s.border}` }}
                    >
                      {compact ? "" : seat}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmModal({ busType, onClose, onConfirm, loading }) {
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
        <p className="font-bold text-slate-900 mb-1">Xóa loại xe?</p>
        <p className="text-xs text-slate-400 mb-1">Bạn sắp xóa loại xe</p>
        <p className="text-sm font-semibold text-slate-700 mb-2">"{busType?.typeName}"</p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-5">
          ⚠️ Các chuyến xe dùng loại xe này có thể bị ảnh hưởng.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#ef4444" }}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bus Type Modal ───────────────────────────────────────────────────────────
function BusTypeModal({ busType, onClose, onSave }) {
  const isEdit = !!busType?.id;

  const initForm = () => {
    if (!busType) return { typeName: "", rows: 3, cols: 2, floors: 2 };
    const { rows, cols } = parseLayout(busType.seatLayout);
    const floorsVal = busType.seatLayout?.floors;
    const floorsCount = typeof floorsVal === 'number' 
      ? floorsVal 
      : (floorsVal?.length ?? (busType.totalSeats === rows * cols ? 1 : 2));
    return { typeName: busType.typeName ?? "", rows, cols, floors: floorsCount };
  };

  const [form, setForm]     = useState(initForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setRows = (v) => setForm((p) => ({ ...p, rows: clamp(v, LIMITS.rows.min, LIMITS.rows.max) }));
  const setCols = (v) => setForm((p) => ({ ...p, cols: clamp(v, LIMITS.cols.min, LIMITS.cols.max) }));
  const setFloors = (v) => setForm((p) => ({ ...p, floors: Number(v) }));

  const previewLayout  = buildLayout(form.rows, form.cols, form.floors);
  const totalSeats     = totalSeatsFromLayout(form.rows, form.cols, form.floors);

  const validate = () => {
    const e = {};
    if (!form.typeName.trim()) e.typeName = "Không được để trống";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const payload = {
      typeName:   form.typeName.trim(),
      totalSeats: totalSeats,
      seatLayout: previewLayout,
    };
    try {
      if (isEdit) {
        const { data } = await api.put(`/bus-types/${busType.id}`, payload);
        onSave(data.data || data);
      } else {
        const { data } = await api.post("/bus-types", payload);
        onSave(data.data || data);
      }
    } catch {
      setErrors({ _global: "Lưu thất bại, thử lại." });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg my-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: isEdit ? "#eff6ff" : "#f0fdf4" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="7" width="20" height="11" rx="2.5" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="1.8" fill="none"/>
                <path d="M2 11h20" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="1.2" opacity="0.6"/>
                <circle cx="7" cy="18" r="1.5" fill={isEdit ? "#2563eb" : "#059669"}/>
                <circle cx="17" cy="18" r="1.5" fill={isEdit ? "#2563eb" : "#059669"}/>
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">{isEdit ? "Chỉnh sửa loại xe" : "Thêm loại xe mới"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {errors._global && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{errors._global}</div>
          )}

          {/* Tên loại xe */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Tên loại xe *</label>
            <input
              value={form.typeName}
              onChange={(e) => { setForm((p) => ({ ...p, typeName: e.target.value })); setErrors((p) => ({ ...p, typeName: "" })); }}
              placeholder="VD: Giường nằm 2 tầng 36 chỗ"
              className={`w-full text-sm px-3 py-2.5 rounded-xl border bg-slate-50 text-slate-900 outline-none transition
                ${errors.typeName ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-indigo-400 focus:ring-2 ring-indigo-50"}`}
            />
            {errors.typeName && <p className="text-[11px] text-red-500 mt-1">{errors.typeName}</p>}
          </div>

          {/* Cấu hình */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-500">Cấu hình sơ đồ ghế</label>
            </div>

            {/* Segmented Control chọn 1 tầng hoặc 2 tầng cực kỳ Premium */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Số tầng xe</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/30">
                <button
                  type="button"
                  onClick={() => setFloors(1)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                    form.floors === 1
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🚌 Xe 1 Tầng
                </button>
                <button
                  type="button"
                  onClick={() => setFloors(2)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                    form.floors === 2
                      ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                      : "text-slate-500 hover:text-indigo-500"
                  }`}
                >
                  ⚡ Xe 2 Tầng
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-1">
              <ClampedInput
                label="Số hàng / tầng"
                value={form.rows}
                min={LIMITS.rows.min} max={LIMITS.rows.max}
                onChange={setRows}
              />
              <ClampedInput
                label="Số cột"
                value={form.cols}
                min={LIMITS.cols.min} max={LIMITS.cols.max}
                onChange={setCols}
              />
            </div>

            {/* Tổng ghế */}
            <div className="flex items-center gap-2 mt-3 mb-4">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs font-bold text-slate-500">
                Tổng: <span style={{ color: "#4f46e5" }}>{totalSeats} ghế</span>
                <span className="text-slate-400 font-normal"> ({form.rows * form.cols} ghế × {form.floors} tầng)</span>
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Live preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-3">Xem trước sơ đồ</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-200"/>
                <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-200 rounded-full">Đầu xe</span>
                <div className="h-px flex-1 bg-slate-200"/>
              </div>
              <div className="overflow-auto max-h-60 pr-1.5 scrollbar-thin">
                <SeatLayoutPreview layout={previewLayout} compact={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: isEdit ? "#2563eb" : "#4f46e5" }}
          >
            {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            {isEdit ? "Lưu thay đổi" : "Tạo loại xe"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageBusTypes() {
  const [busTypes, setBusTypes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [modal, setModal]           = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchBusTypes = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/bus-types");
      setBusTypes(Array.isArray(data) ? data : data.data ?? []);
    } catch { showToast("Không thể tải danh sách loại xe", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBusTypes(); }, [fetchBusTypes]);

  const handleSave = (saved) => {
    setBusTypes((p) => {
      const idx = p.findIndex((b) => b.id === saved.id);
      if (idx >= 0) { const n = [...p]; n[idx] = saved; return n; }
      return [saved, ...p];
    });
    setModal(null);
    showToast(modal?.id ? "Cập nhật loại xe thành công!" : "Thêm loại xe thành công!");
  };

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/bus-types/${confirmDel.id}`);
      setBusTypes((p) => p.filter((b) => b.id !== confirmDel.id));
      showToast(`Đã xóa "${confirmDel.typeName}"`);
      setConfirmDel(null);
    } catch { showToast("Xóa thất bại", "error"); }
    finally { setDelLoading(false); }
  };

  const filtered   = busTypes.filter((b) => !search || b.typeName?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalSeats = busTypes.reduce((s, b) => s + (b.totalSeats ?? 0), 0);
  const maxSeats   = busTypes.length ? Math.max(...busTypes.map((b) => b.totalSeats ?? 0)) : 0;

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
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Quản lý loại xe</h1>
            <p className="text-sm text-slate-400 mt-0.5">Cấu hình loại xe 2 tầng và sơ đồ ghế.</p>
          </div>
          <button
            onClick={() => setModal("add")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-sm"
            style={{ backgroundColor: "#4f46e5" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            Thêm loại xe
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng loại xe",      value: busTypes.length,    color: "#4f46e5", bg: "#eef2ff" },
            { label: "Tổng ghế quản lý",  value: totalSeats,         color: "#0891b2", bg: "#ecfeff" },
            { label: "Xe nhiều ghế nhất", value: `${maxSeats} ghế`,  color: "#d97706", bg: "#fffbeb" },
            { label: "Kết quả tìm kiếm",  value: filtered.length,    color: "#7c3aed", bg: "#f5f3ff" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="11" rx="2.5" stroke={color} strokeWidth="2" fill="none"/>
                  <path d="M2 11h20" stroke={color} strokeWidth="1.5" opacity="0.5"/>
                  <circle cx="7" cy="18" r="1.5" fill={color}/>
                  <circle cx="17" cy="18" r="1.5" fill={color}/>
                </svg>
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900">{value}</p>
                <p className="text-[11px] text-slate-400 font-medium leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table/card area */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tên loại xe..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
            </div>
            <p className="ml-auto text-xs text-slate-400 font-medium shrink-0">{filtered.length} loại xe</p>
          </div>

          {/* Cards */}
          {loading ? <Spinner /> : (
            <div className="p-5">
              {pageData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="7" width="20" height="11" rx="2.5" stroke="#cbd5e1" strokeWidth="1.5" fill="none"/>
                    <path d="M2 11h20" stroke="#cbd5e1" strokeWidth="1.2"/>
                    <circle cx="7" cy="18" r="1.5" fill="#cbd5e1"/>
                    <circle cx="17" cy="18" r="1.5" fill="#cbd5e1"/>
                  </svg>
                  <p className="text-sm mt-2">Không tìm thấy loại xe nào.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pageData.map((bt) => {
                    const { rows, cols } = parseLayout(bt.seatLayout);
                    const isDoubleFloor  = bt.seatLayout?.floors === 2 || bt.seatLayout?.floors?.length === 2;
                    return (
                      <div
                        key={bt.id}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all duration-200 row-fade"
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#eef2ff" }}>
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="7" width="20" height="11" rx="2.5" stroke="#4f46e5" strokeWidth="1.8" fill="none"/>
                                <path d="M2 11h20" stroke="#4f46e5" strokeWidth="1.2" opacity="0.5"/>
                                <circle cx="7" cy="18" r="1.5" fill="#4f46e5"/>
                                <circle cx="17" cy="18" r="1.5" fill="#4f46e5"/>
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">{bt.typeName}</p>
                              <p className="text-[11px] text-slate-400 font-mono">#{bt.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setModal(bt)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                              style={{ color: "#2563eb", backgroundColor: "#eff6ff" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                              title="Sửa"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                            <button
                              onClick={() => setConfirmDel(bt)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition"
                              style={{ color: "#ef4444", backgroundColor: "#fef2f2" }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fef2f2"}
                              title="Xóa"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: "#4f46e5", backgroundColor: "#eef2ff" }}>
                            {bt.totalSeats ?? bt.total_seats} ghế
                          </span>
                          {isDoubleFloor && (
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ color: "#7c3aed", backgroundColor: "#f5f3ff" }}>
                              2 tầng
                            </span>
                          )}
                          {rows > 0 && (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                              {rows} hàng × {cols} cột
                            </span>
                          )}
                        </div>

                        {/* Seat preview */}
                        <div className="bg-white rounded-xl p-3 border border-slate-100">
                          <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase mb-2">Sơ đồ ghế</p>
                          {(bt.seatLayout || bt.seat_layout)
                            ? <SeatLayoutPreview layout={bt.seatLayout || bt.seat_layout} compact={(bt.totalSeats ?? bt.total_seats) > 24} />
                            : <p className="text-xs text-slate-400 text-center py-2">Chưa có sơ đồ ghế</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-slate-400">
              Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {filtered.length} loại xe
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
                    ? { backgroundColor: "#4f46e5", color: "white" }
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

      {(modal === "add" || (modal && modal.id)) && (
        <BusTypeModal busType={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {confirmDel && (
        <ConfirmModal busType={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={handleDelete} loading={delLoading} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}