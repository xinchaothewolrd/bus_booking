import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// ─── API Client ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

const STATUS_META = {
  active: { label: "Hoạt động", color: "#10b981", bg: "#ecfdf5", ring: "#a7f3d0" },
  inactive: { label: "Tạm khóa", color: "#64748b", bg: "#f8fafc", ring: "#cbd5e1" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return d.toLocaleDateString("vi-VN", { dateStyle: "medium" });
}

function fmtPrice(p) {
  if (p === undefined || p === null || p === "") return "—";
  return Number(p).toLocaleString("vi-VN") + "đ";
}

function toInputDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl border border-white/10 animate-slide-up"
      style={{ backgroundColor: type === "error" ? "#ef4444" : "#10b981" }}
    >
      <span>{msg}</span>
      <button onClick={onClose} className="hover:opacity-80 font-bold ml-2 transition">✕</button>
    </div>
  );
}

// ─── Confirm Modal (Delete) ───────────────────────────────────────────────────
function ConfirmModal({ rule, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm p-6 text-center animate-scale-up">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h3 className="text-base font-extrabold text-slate-900 mb-1">Xóa luật giá vé?</h3>
        <p className="text-xs text-slate-500 mb-6">
          Bạn có chắc chắn muốn xóa luật giá <strong className="text-slate-800">"{rule.ruleName || rule.rule_name}"</strong>? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-98">Hủy</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition disabled:opacity-60 flex items-center justify-center gap-2 active:scale-98"
            style={{ backgroundColor: '#ef4444' }}
          >
            {loading && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            Xóa luật
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rule Modal (Add / Edit) ──────────────────────────────────────────────────
const EMPTY_FORM = {
  ruleName: "",
  routeId: "",
  busTypeId: "",
  priceMultiplier: "1.00",
  priceDelta: "0",
  startDate: "",
  endDate: "",
  priority: 1,
  status: "active",
};

function RuleModal({ rule, routes, busTypes, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!rule?.id;

  useEffect(() => {
    if (rule) {
      setForm({
        ...rule,
        ruleName: rule.ruleName || rule.rule_name || "",
        routeId: rule.routeId || rule.route_id || "",
        busTypeId: rule.busTypeId || rule.bus_type_id || "",
        priceMultiplier: rule.priceMultiplier || rule.price_multiplier || "1.00",
        priceDelta: rule.priceDelta || rule.price_delta || "0",
        startDate: toInputDate(rule.startDate || rule.start_date),
        endDate: toInputDate(rule.endDate || rule.end_date),
        priority: rule.priority ?? 1,
        status: rule.status || "active",
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [rule]);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.ruleName.trim()) e.ruleName = "Vui lòng nhập tên luật";
    if (!form.startDate) e.startDate = "Vui lòng chọn ngày bắt đầu";
    if (!form.endDate) e.endDate = "Vui lòng chọn ngày kết thúc";
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
      e.endDate = "Ngày kết thúc phải lớn hơn ngày bắt đầu";
    }
    if (isNaN(Number(form.priceMultiplier)) || Number(form.priceMultiplier) <= 0) {
      e.priceMultiplier = "Hệ số nhân phải là số dương lớn hơn 0";
    }
    if (isNaN(Number(form.priceDelta))) {
      e.priceDelta = "Hệ số chênh lệch phải là số hợp lệ";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);

    const payload = {
      ruleName: form.ruleName.trim(),
      routeId: form.routeId ? Number(form.routeId) : null,
      busTypeId: form.busTypeId ? Number(form.busTypeId) : null,
      priceMultiplier: parseFloat(form.priceMultiplier),
      priceDelta: parseFloat(form.priceDelta),
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      priority: Number(form.priority),
      status: form.status,
    };

    try {
      if (isEdit) {
        const { data } = await api.put(`/price-rules/${rule.id}`, payload);
        onSave(data.data || data);
      } else {
        const { data } = await api.post("/price-rules", payload);
        onSave(data.data || data);
      }
    } catch (err) {
      console.error(err);
      setErrors({ _global: "Có lỗi xảy ra khi lưu quy tắc giá vé." });
    } finally { setSaving(false); }
  };

  const fieldClass = (err) => `w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white text-slate-800 outline-none transition duration-150 hover:border-slate-300 focus:border-blue-500 focus:ring-3 focus:ring-blue-50 focus:shadow-xs ${err ? 'border-red-400 ring-3 ring-red-50' : 'border-slate-200'}`;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEdit ? "bg-blue-50" : "bg-emerald-50"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isEdit ? "#2563eb" : "#059669"} strokeWidth="2.2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-slate-900">{isEdit ? "Chỉnh sửa luật giá" : "Cấu hình luật giá mới"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition font-bold text-base">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {errors._global && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600 font-semibold">{errors._global}</div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tên luật giá *</label>
            <input
              type="text"
              value={form.ruleName}
              onChange={(e) => set("ruleName", e.target.value)}
              placeholder="VD: Phụ thu Tết Nguyên Đán, Đợt giảm giá Hè..."
              className={fieldClass(errors.ruleName)}
            />
            {errors.ruleName && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.ruleName}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tuyến đường áp dụng</label>
              <select
                value={form.routeId}
                onChange={(e) => set("routeId", e.target.value)}
                className={`${fieldClass(false)} cursor-pointer`}
              >
                <option value="">-- Tất cả tuyến đường --</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.departureLocation} → {r.arrivalLocation}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loại xe áp dụng</label>
              <select
                value={form.busTypeId}
                onChange={(e) => set("busTypeId", e.target.value)}
                className={`${fieldClass(false)} cursor-pointer`}
              >
                <option value="">-- Tất cả loại xe --</option>
                {busTypes.map((bt) => (
                  <option key={bt.id} value={bt.id}>{bt.typeName || bt.type_name} ({bt.totalSeats || bt.total_seats} chỗ)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tỷ lệ điều chỉnh (Multiplier)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  value={form.priceMultiplier}
                  onChange={(e) => set("priceMultiplier", e.target.value)}
                  placeholder="VD: 1.20"
                  className={fieldClass(errors.priceMultiplier)}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 pointer-events-none">x</span>
              </div>
              <p className="text-[9.5px] font-medium text-slate-400 mt-1">Giữ 1.00 nếu không đổi. VD: 1.2 = tăng 20%</p>
              {errors.priceMultiplier && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.priceMultiplier}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cộng/Trừ cố định (Delta - VNĐ)</label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  value={form.priceDelta}
                  onChange={(e) => set("priceDelta", e.target.value)}
                  placeholder="VD: 50000"
                  className={fieldClass(errors.priceDelta)}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400 pointer-events-none">đ</span>
              </div>
              <p className="text-[9.5px] font-medium text-slate-400 mt-1">Giữ 0 nếu không đổi. VD: 50000 = cộng thêm 50k</p>
              {errors.priceDelta && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.priceDelta}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Áp dụng từ ngày *</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className={`${fieldClass(errors.startDate)} cursor-pointer`}
              />
              {errors.startDate && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đến hết ngày *</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className={`${fieldClass(errors.endDate)} cursor-pointer`}
              />
              {errors.endDate && <p className="text-[10px] font-semibold text-red-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Độ ưu tiên (Priority)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
                className={fieldClass(false)}
              />
              <p className="text-[9.5px] font-medium text-slate-400 mt-1">Số lớn hơn sẽ được ưu tiên áp dụng trước</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trạng thái kích hoạt</label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={`${fieldClass(false)} cursor-pointer`}
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Tạm khóa (Inactive)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 border-t border-slate-50 pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition active:scale-98">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-60 active:scale-98 shadow-sm"
            style={{ backgroundColor: isEdit ? '#2563eb' : '#059669' }}
          >
            {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            {isEdit ? "Lưu thay đổi" : "Kích hoạt luật"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManagePriceRules() {
  const [rules, setRules] = useState([]);
  const [routes, setRoutes] = useState([]);
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

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, routesRes, btRes] = await Promise.all([
        api.get("/price-rules"),
        api.get("/routes"),
        api.get("/bus-types"),
      ]);
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : rulesRes.data.data ?? []);
      setRoutes(Array.isArray(routesRes.data) ? routesRes.data : routesRes.data.data ?? []);
      setBusTypes(Array.isArray(btRes.data) ? btRes.data : btRes.data.data ?? []);
    } catch (err) {
      console.error(err);
      showToast("Không thể tải danh sách luật giá", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Cập nhật nhanh trạng thái Active/Inactive
  const toggleStatus = async (rule) => {
    const nextStatus = rule.status === "active" ? "inactive" : "active";
    try {
      await api.put(`/price-rules/${rule.id}`, {
        ...rule,
        status: nextStatus,
        startDate: rule.startDate || rule.start_date,
        endDate: rule.endDate || rule.end_date,
        ruleName: rule.ruleName || rule.rule_name,
        routeId: rule.routeId || rule.route_id || null,
        busTypeId: rule.busTypeId || rule.bus_type_id || null,
        priceMultiplier: parseFloat(rule.priceMultiplier || rule.price_multiplier || 1),
        priceDelta: parseFloat(rule.priceDelta || rule.price_delta || 0),
        priority: Number(rule.priority || 1)
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, status: nextStatus } : r))
      );
      showToast(`Đã ${nextStatus === "active" ? "kích hoạt" : "tạm khóa"} luật giá thành công!`);
    } catch {
      showToast("Không thể cập nhật trạng thái", "error");
    }
  };

  const handleSave = (savedRule) => {
    if (modal === "add") {
      setRules((p) => [savedRule, ...p]);
      showToast("Đã tạo luật giá vé mới thành công!");
    } else {
      setRules((p) => p.map((r) => (r.id === savedRule.id ? savedRule : r)));
      showToast("Đã cập nhật thay đổi thành công!");
    }
    setModal(null);
  };

  const handleDelete = async () => {
    if (!confirmDel) return;
    setDelLoading(true);
    try {
      await api.delete(`/price-rules/${confirmDel.id}`);
      setRules((p) => p.filter((r) => r.id !== confirmDel.id));
      showToast("Đã xóa luật giá vé thành công!");
    } catch {
      showToast("Không thể xóa luật giá này", "error");
    } finally {
      setDelLoading(false);
      setConfirmDel(null);
    }
  };

  // Lọc danh sách
  const filteredRules = rules.filter((r) => {
    const name = (r.ruleName || r.rule_name || "").toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "Tất cả" ||
      (statusFilter === "Hoạt động" && r.status === "active") ||
      (statusFilter === "Tạm khóa" && r.status === "inactive");
    return matchSearch && matchStatus;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredRules.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);
  const paginatedRules = filteredRules.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* ─── Inject Global Premium Styles ─── */}
      <style>{`
        /* Hide browsers native spinners for number inputs */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }

        /* Pulse green active dot animation */
        @keyframes active-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .animate-active-dot {
          animation: active-pulse 2s infinite;
        }
      `}</style>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Cấu hình luật tăng/giảm giá</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Cấu hình tăng giá vé dịp Lễ/Tết, cuối tuần hoặc tạo các chương trình khuyến mãi theo ngày chạy.
          </p>
        </div>
        <button
          onClick={() => setModal("add")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition flex items-center gap-2 active:scale-97"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>
          Thêm luật giá mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Tìm theo tên luật giá..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-50/50 transition"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3" strokeLinecap="round"/></svg>
        </div>

        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-100 shrink-0">
          {["Tất cả", "Hoạt động", "Tạm khóa"].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all duration-150 ${statusFilter === status ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400 animate-pulse">Đang tải danh sách luật giá...</p>
          </div>
        ) : paginatedRules.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-xs font-bold text-slate-400">Không tìm thấy quy tắc giá vé nào</p>
            <p className="text-[11px] text-slate-400 mt-1">Hãy tạo một đợt điều chỉnh giá để quản lý các chuyến đi tốt hơn!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  <th className="px-3.5 py-3.5">Tên luật giá</th>
                  <th className="px-3.5 py-3.5">Áp dụng</th>
                  <th className="px-3.5 py-3.5">Thay đổi giá</th>
                  <th className="px-3.5 py-3.5">Thời gian hoạt động</th>
                  <th className="px-3.5 py-3.5 text-center">Độ ưu tiên</th>
                  <th className="px-3.5 py-3.5 text-center">Trạng thái</th>
                  <th className="px-3.5 py-3.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {paginatedRules.map((rule) => {
                  const meta = STATUS_META[rule.status] || STATUS_META.inactive;
                  const rId = rule.routeId || rule.route_id;
                  const btId = rule.busTypeId || rule.bus_type_id;

                  const routeObj = routes.find((r) => r.id == rId);
                  const busTypeObj = busTypes.find((bt) => bt.id == btId);

                  const multi = parseFloat(rule.priceMultiplier || rule.price_multiplier || 1);
                  const delta = parseFloat(rule.priceDelta || rule.price_delta || 0);

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-3.5 py-4">
                        <p className="font-extrabold text-slate-800 leading-snug">{rule.ruleName || rule.rule_name}</p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 font-bold tracking-wider">MÃ LUẬT: #{rule.id}</p>
                      </td>
                      <td className="px-3.5 py-4 min-w-[170px]">
                        <div className="space-y-1.5 text-xs">
                          <p className="text-slate-600 leading-normal">
                            <span className="text-[10px] font-bold text-slate-400 inline-block w-14 uppercase tracking-wide">Tuyến:</span>
                            <span className="font-semibold text-slate-700">{routeObj ? `${routeObj.departureLocation} → ${routeObj.arrivalLocation}` : "Tất cả các tuyến"}</span>
                          </p>
                          <p className="text-slate-500 leading-normal">
                            <span className="text-[10px] font-bold text-slate-400 inline-block w-14 uppercase tracking-wide">Loại xe:</span>
                            <span className="font-semibold text-slate-600">{busTypeObj ? `${busTypeObj.typeName || busTypeObj.type_name} (${busTypeObj.totalSeats || busTypeObj.total_seats} chỗ)` : "Tất cả loại xe"}</span>
                          </p>
                        </div>
                      </td>
                      <td className="px-3.5 py-4">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-[150px]">
                          {multi !== 1 && (
                            <span className="inline-flex items-center bg-blue-50/70 text-blue-600 text-[10.5px] px-2.5 py-0.5 rounded-full border border-blue-100 font-bold shadow-2xs whitespace-nowrap">
                              Nhân ×{multi}
                            </span>
                          )}
                          {delta !== 0 && (
                            <span className={`inline-flex items-center text-[10.5px] px-2.5 py-0.5 rounded-full border font-bold shadow-2xs whitespace-nowrap ${delta > 0 ? 'bg-emerald-50/70 text-emerald-600 border-emerald-100' : 'bg-red-50/70 text-red-600 border-red-100'}`}>
                              {delta > 0 ? "+" : ""}{fmtPrice(delta)}
                            </span>
                          )}
                          {multi === 1 && delta === 0 && <span className="text-slate-400 text-[10px] font-medium">Không thay đổi</span>}
                        </div>
                      </td>
                      <td className="px-3.5 py-4 text-slate-500 font-medium whitespace-nowrap">
                        <p className="text-slate-700 font-bold text-[11.5px]">{fmtDate(rule.startDate || rule.start_date)}</p>
                        <p className="text-[9.5px] text-slate-400 mt-0.5 font-semibold">đến {fmtDate(rule.endDate || rule.end_date)}</p>
                      </td>
                      <td className="px-3.5 py-4 text-center font-extrabold text-slate-600">
                        <span className="bg-slate-100/90 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200/50">
                          {rule.priority ?? 1}
                        </span>
                      </td>
                      <td className="px-3.5 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(rule)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border transition-all duration-200 hover:shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
                          style={{
                            color: meta.color,
                            backgroundColor: meta.bg,
                            borderColor: meta.ring
                          }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${rule.status === 'active' ? 'animate-active-dot' : ''}`} style={{ backgroundColor: meta.color }} />
                          {meta.label}
                        </button>
                      </td>
                      <td className="px-3.5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setModal(rule)}
                            className="w-7 h-7 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition active:scale-90"
                            title="Sửa"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          <button
                            onClick={() => setConfirmDel(rule)}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition active:scale-90"
                            title="Xóa"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
        {!loading && filteredRules.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wide">
              Trang {safePage} / {totalPages} (Tổng số {filteredRules.length} luật)
            </span>
            <div className="flex gap-1">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-40"
              >
                ← Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition shadow-2xs ${p === safePage ? 'bg-blue-600 text-white border-none' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage(safePage + 1)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-40"
              >
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals & Toasts */}
      {modal && (
        <RuleModal
          rule={modal === "add" ? null : modal}
          routes={routes}
          busTypes={busTypes}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirmDel && (
        <ConfirmModal
          rule={confirmDel}
          onClose={() => setConfirmDel(null)}
          onConfirm={handleDelete}
          loading={delLoading}
        />
      )}

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
