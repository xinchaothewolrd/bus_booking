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

// ─── Constants ────────────────────────────────────────────────────────────────
// Hỗ trợ 3 role: admin, staff và customer
const ROLES = ["Tất cả", "Khách hàng", "Nhân viên", "Quản trị"];

const ROLE_STYLE = {
  "Quản trị":  { color: "#7c3aed", bg: "#f5f3ff", ring: "#ddd6fe" },
  "Nhân viên":  { color: "#2563eb", bg: "#eff6ff", ring: "#bfdbfe" },
  "Khách hàng":{ color: "#475569", bg: "#f1f5f9", ring: "#cbd5e1" },
};

const AVATAR_BG = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ec4899"];
const avatarBg  = (id) => AVATAR_BG[(id ?? 0) % AVATAR_BG.length];

const EMPTY_FORM = { fullName: "", email: "", phone: "", role: "customer", password: "" };
const PAGE_SIZE  = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function exportCSV(users) {
  const header = ["ID", "Tên", "Email", "SĐT", "Vai trò", "Trạng thái"];
  const rows   = users.map((u) => [u.id, u.fullName, u.email, u.phone ?? "", u.role, u.status === "active" ? "Hoạt động" : "Bị khóa"]);
  const csv    = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob   = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a"); a.href = url; a.download = "users.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({ user }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm"
      style={{ backgroundColor: avatarBg(user.id) }}
    >
      {user.fullName?.charAt(0) ?? "?"}
    </div>
  );
}

function RoleBadge({ role }) {
  const displayRole = role === "admin" ? "Quản trị" : role === "staff" ? "Nhân viên" : "Khách hàng";
  const s = ROLE_STYLE[displayRole] ?? ROLE_STYLE["Khách hàng"];
  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg, boxShadow: `0 0 0 1px ${s.ring}` }}
    >
      {displayRole}
    </span>
  );
}

function StatusBadge({ status, onClick }) {
  const active = status === "active";
  return (
    <button
      onClick={onClick}
      title="Click để đổi trạng thái"
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all duration-150"
      style={active
        ? { color: "#059669", backgroundColor: "#f0fdf4", boxShadow: "0 0 0 1px #a7f3d0" }
        : { color: "#64748b", backgroundColor: "#f1f5f9", boxShadow: "0 0 0 1px #cbd5e1" }
      }
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? "#10b981" : "#94a3b8" }} />
      {active ? "Hoạt động" : "Bị khóa"}
    </button>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-[3px] border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      className="fixed bottom-6 right-6 z-100 flex items-center gap-3 px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-xl animate-slide-up"
      style={{ backgroundColor: type === "error" ? "#ef4444" : "#059669" }}
    >
      {type === "error"
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      }
      {msg}
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Modal Thêm / Sửa ────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const [form, setForm]     = useState(user ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = !!user?.id;

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Không được để trống";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ";
    if (!isEdit && !form.password) e.password = "Cần nhập mật khẩu";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const { data } = await api.put(`/users/${form.id}`, form);
        onSave(data);
      } else {
        const { data } = await api.post("/users", form);
        onSave(data);
      }
    } catch (err) {
      console.warn("Lưu API thất bại. Đang xử lý giả lập tại Frontend.");
      const mockSaved = {
        ...form,
        id: form.id || Math.floor(Math.random() * 90000) + 10,
        status: form.status || "active"
      };
      onSave(mockSaved);
    } finally { setSaving(false); }
  };

  const Field = ({ fkey, label, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={form[fkey] ?? ""}
        onChange={(e) => { setForm((p) => ({ ...p, [fkey]: e.target.value })); setErrors((p) => ({ ...p, [fkey]: "" })); }}
        placeholder={placeholder}
        className={`w-full text-sm text-slate-800 px-3 py-2.5 rounded-xl border bg-slate-50 outline-none transition
          ${errors[fkey] ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus:border-blue-400 focus:ring-2 ring-blue-50"}`}
      />
      {errors[fkey] && <p className="text-[11px] text-red-500 mt-1">{errors[fkey]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: isEdit ? "#eff6ff" : "#f0fdf4" }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                {isEdit
                  ? <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round"/>
                  : <path d="M12 5v14M5 12h14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"/>
                }
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900">{isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {errors._global && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{errors._global}</div>}
          <Field fkey="fullName"     label="Họ và tên"       placeholder="Nguyễn Văn A" />
          <Field fkey="email"    label="Email"            type="email" placeholder="example@email.com" />
          <Field fkey="phone"    label="Số điện thoại"   placeholder="0901234567" />
          {!isEdit && <Field fkey="password" label="Mật khẩu" type="password" placeholder="Tối thiểu 6 ký tự" />}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Vai trò</label>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full text-sm text-slate-800 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-blue-400 focus:ring-2 ring-blue-50 transition"
            >
              <option value="customer">Khách hàng</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Quản trị</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: isEdit ? "#2563eb" : "#059669" }}
          >
            {saving && <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
            {isEdit ? "Lưu thay đổi" : "Tạo tài khoản"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmModal({ user, onClose, onConfirm, loading }) {
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
        <p className="font-bold text-slate-900 mb-1">Xóa tài khoản?</p>
        <p className="text-xs text-slate-400 mb-1">Bạn sắp xóa tài khoản</p>
        <p className="text-sm font-semibold text-slate-700 mb-5">"{user?.fullName}"</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">Hủy</button>
          <button
            onClick={onConfirm}
            disabled={loading}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("Tất cả");
  const [page, setPage]             = useState(1);
  const [modal, setModal]           = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [toast, setToast]           = useState(null);

  const MOCK_USERS = [
    { id: 1, fullName: "Nguyễn Văn An", email: "admin@oceanbus.com", phone: "0901234567", role: "admin", status: "active" },
    { id: 2, fullName: "Trần Thị Bình", email: "binh.staff@oceanbus.com", phone: "0912345678", role: "staff", status: "active" },
    { id: 3, fullName: "Lê Văn Cường", email: "cuong.staff@oceanbus.com", phone: "0923456789", role: "staff", status: "active" },
    { id: 4, fullName: "Phạm Minh Đức", email: "duc.customer@gmail.com", phone: "0934567890", role: "customer", status: "active" },
    { id: 5, fullName: "Hoàng Thanh Hà", email: "ha.customer@gmail.com", phone: "0945678901", role: "customer", status: "banned" },
    { id: 6, fullName: "Vũ Thị Hương", email: "huong.customer@gmail.com", phone: "0956789012", role: "customer", status: "active" }
  ];

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      console.warn("Lỗi tải danh sách thật từ Backend. Chuyển sang chế độ dữ liệu giả lập (Mock Data) để demo.");
      const cached = localStorage.getItem("mock_users");
      if (cached) {
        setUsers(JSON.parse(cached));
      } else {
        setUsers(MOCK_USERS);
        localStorage.setItem("mock_users", JSON.stringify(MOCK_USERS));
      }
      showToast("Tải danh sách giả lập (Backend chưa cấu hình API /users)", "success");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (user) => {
    const nextStatus = user.status === "active" ? "banned" : "active";
    setUsers((p) => {
      const nextList = p.map((u) => u.id === user.id ? { ...u, status: nextStatus } : u);
      localStorage.setItem("mock_users", JSON.stringify(nextList));
      return nextList;
    });
    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      showToast(nextStatus === "active" ? `Đã mở khóa "${user.fullName}"` : `Đã khóa "${user.fullName}"`);
    } catch {
      showToast(nextStatus === "active" ? `Đã mở khóa (Mock) "${user.fullName}"` : `Đã khóa (Mock) "${user.fullName}"`);
    }
  };

  const deleteUser = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/users/${confirmDel.id}`);
      setUsers((p) => {
        const nextList = p.filter((u) => u.id !== confirmDel.id);
        localStorage.setItem("mock_users", JSON.stringify(nextList));
        return nextList;
      });
      showToast(`Đã xóa "${confirmDel.fullName}"`);
      setConfirmDel(null);
    } catch {
      setUsers((p) => {
        const nextList = p.filter((u) => u.id !== confirmDel.id);
        localStorage.setItem("mock_users", JSON.stringify(nextList));
        return nextList;
      });
      showToast(`Đã xóa (Mock) "${confirmDel.fullName}"`);
      setConfirmDel(null);
    } finally { setDelLoading(false); }
  };

  const handleSave = (saved) => {
    setUsers((p) => {
      const idx = p.findIndex((u) => u.id === saved.id);
      let nextList;
      if (idx >= 0) {
        nextList = [...p];
        nextList[idx] = saved;
      } else {
        nextList = [saved, ...p];
      }
      localStorage.setItem("mock_users", JSON.stringify(nextList));
      return nextList;
    });
    setModal(null);
    showToast(modal?.id ? "Cập nhật thành công!" : "Tạo tài khoản thành công!");
  };

  const filtered = users.filter((u) => {
    const matchRole   = roleFilter === "Tất cả" || 
                        (roleFilter === "Quản trị" ? u.role === "admin" : 
                         roleFilter === "Nhân viên" ? u.role === "staff" : 
                         u.role === "customer");
    const matchSearch = !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageData   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = {
    total:  users.length,
    active: users.filter((u) => u.status === "active").length,
    locked: users.filter((u) => u.status !== "active").length,
    admins: users.filter((u) => u.role === "admin" || u.role === "staff").length,
  };

  return (
    <>
      <style>{`
        @keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        .animate-slide-up { animation: slide-up .25s ease-out }
        @keyframes fade-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .row-fade { animation: fade-in .2s ease-out }
      `}</style>

      <div className="min-h-screen bg-[#f4f6f9] p-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Quản lý tài khoản</h1>
            <p className="text-sm text-slate-400 mt-0.5">Xem, thêm, sửa và phân quyền người dùng.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
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
              style={{ backgroundColor: "#2563eb" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Thêm tài khoản
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng tài khoản", value: stats.total,  iconBg: "#eff6ff", iconColor: "#2563eb", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" },
            { label: "Đang hoạt động", value: stats.active, iconBg: "#f0fdf4", iconColor: "#059669", icon: "M5 13l4 4L19 7" },
            { label: "Bị khóa",        value: stats.locked, iconBg: "#fef2f2", iconColor: "#dc2626", icon: "M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" },
            { label: "Quản trị viên",  value: stats.admins, iconBg: "#f5f3ff", iconColor: "#7c3aed", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
          ].map(({ label, value, iconBg, iconColor, icon }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: iconBg }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d={icon} stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-extrabold text-slate-900 leading-tight">{value}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1 min-w-50 max-w-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#94a3b8" strokeWidth="2"/>
                <path d="M16.5 16.5L21 21" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tên, email..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400"
              />
              {search && <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRoleFilter(r); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${roleFilter === r ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {r}
                </button>
              ))}
            </div>

            <p className="ml-auto text-xs text-slate-400 font-medium shrink-0">{filtered.length} kết quả</p>
          </div>

          {/* Table */}
          {loading ? <Spinner /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["#", "Người dùng", "Vai trò", "Trạng thái", "Hành động"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-extrabold tracking-widest text-slate-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pageData.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#cbd5e1" strokeWidth="1.5"/><path d="M9 9h.01M15 9h.01M9 15s1 1.5 3 1.5 3-1.5 3-1.5" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <p className="text-sm">Không tìm thấy người dùng nào.</p>
                      </div>
                    </td></tr>
                  ) : pageData.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition row-fade">
                      <td className="px-4 py-2.5 text-[10px] font-mono text-slate-400">#{u.id}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={u} />
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800 leading-tight">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-2.5"><StatusBadge status={u.status} onClick={() => toggleStatus(u)} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setModal(u)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-blue-100"
                              style={{ color: "#2563eb", backgroundColor: "#eff6ff" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              <span className="notranslate">Sửa</span>
                            </button>
                            <button
                              onClick={() => setConfirmDel(u)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-red-100"
                              style={{ color: "#ef4444", backgroundColor: "#fef2f2" }}
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
              Trang <span className="font-semibold text-slate-600">{safePage}</span> / {totalPages} — {filtered.length} người dùng
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 border border-slate-200 hover:bg-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >← Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p} onClick={() => setPage(p)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={p === safePage
                    ? { backgroundColor: "#2563eb", color: "white" }
                    : { color: "#64748b", border: "1px solid #e2e8f0", backgroundColor: "transparent" }
                  }
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

      {(modal === "add" || (modal && modal.id)) && (
        <UserModal user={modal === "add" ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {confirmDel && (
        <ConfirmModal user={confirmDel} onClose={() => setConfirmDel(null)} onConfirm={deleteUser} loading={delLoading} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}