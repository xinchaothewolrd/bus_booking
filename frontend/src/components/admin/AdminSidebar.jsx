import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";

const NAV_GROUPS = [
  {
    label: "Tổng quan",
    items: [
      {
        to: "/admin",
        exact: true,
        label: "Dashboard",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.4" />
          </svg>
        ),
      },
      {
        to: "/admin/statistics",
        label: "Thống kê & Báo cáo",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M3 17l4-5 4 3 4-6 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Vận hành",
    items: [
      {
        to: "/admin/routes",
        label: "Quản lý tuyến đường",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="5" cy="12" r="2.5" fill="currentColor" />
            <circle cx="19" cy="12" r="2.5" fill="currentColor" opacity="0.5" />
            <path d="M7.5 12h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
            <path d="M5 6V4M19 6V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          </svg>
        ),
      },
      {
        to: "/admin/bus-types",
        label: "Quản lý loại xe",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="7" width="20" height="11" rx="2.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.8" />
            <path d="M2 11h20" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            <circle cx="7" cy="18" r="1.5" fill="currentColor" />
            <circle cx="17" cy="18" r="1.5" fill="currentColor" />
            <path d="M8 7V5M16 7V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
        ),
      },
      {
        to: "/admin/buses",
        label: "Quản lý chi tiết xe",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="12" rx="2.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="6.5" cy="18" r="1.5" fill="currentColor" />
            <circle cx="17.5" cy="18" r="1.5" fill="currentColor" />
            <path d="M5 6V4M19 6V4M2 11h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
        ),
      },
      {
        to: "/admin/trips",
        label: "Quản lý chuyến xe",
        badge: "Live",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
            <path d="M8 4V2M16 4V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <path d="M7 14h4M7 17h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </svg>
        ),
      },
      {
        to: "/admin/seats",
        label: "Trạng thái ghế",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M6 4v8M18 4v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 12h16v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 17v3M16 17v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          </svg>
        ),
      },
      {
        to: "/admin/price-rules",
        label: "Cấu hình luật giá",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M7 10h3M7 14h5M17 9.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Giao dịch",
    items: [
      {
        to: "/admin/bookings",
        label: "Quản lý đặt vé",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M3 7h18M3 12h12M3 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <circle cx="19" cy="17" r="3" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M18 17l.8.8L20.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        to: "/admin/checkin",
        label: "Soát vé hành khách",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Người dùng",
    items: [
      {
        to: "/admin/users",
        label: "Quản lý tài khoản",
        icon: (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="7.5" r="3.5" fill="currentColor" opacity="0.9" />
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminSidebar() {
  const location = useLocation();

  const isActive = (item) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  const storeUser = useAuthStore((s) => s.user);
  const cachedUserString = localStorage.getItem("user");
  let cachedUser = null;
  try {
    cachedUser = cachedUserString ? JSON.parse(cachedUserString) : null;
  } catch (e) {
    console.error(e);
  }
  const user = storeUser || cachedUser;
  const role = user?.role ?? "admin";

  // Lọc các item và nhóm theo role
  const filteredGroups = NAV_GROUPS.map(group => {
    const items = group.items.filter(item => {
      if (role === "staff") {
        // Staff chỉ xem Trạng thái ghế, Quản lý đặt vé, Soát vé hành khách
        const allowedPaths = ["/admin/seats", "/admin/bookings", "/admin/checkin"];
        return allowedPaths.includes(item.to);
      }
      return true;
    });
    return { ...group, items };
  }).filter(group => group.items.length > 0);

  return (
    <aside className="relative flex flex-col min-h-screen bg-white border-r border-slate-100 w-64 shrink-0">

      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.75 bg-linear-to-r from-blue-600 to-blue-400" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 pt-7 pb-5 border-b border-slate-100">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
          style={{ background: role === "staff" ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="7" width="18" height="11" rx="2.5" fill="white" opacity="0.95" />
            <path d="M3 11h18" stroke={role === "staff" ? "#10b981" : "#2563eb"} strokeWidth="1.5" />
            <circle cx="7.5" cy="18" r="1.5" fill={role === "staff" ? "#10b981" : "#2563eb"} />
            <circle cx="16.5" cy="18" r="1.5" fill={role === "staff" ? "#10b981" : "#2563eb"} />
            <path d="M8 7V5M16 7V5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {role === "staff" ? "Staff Panel" : "Admin Panel"}
          </p>
          <p className="text-xs text-slate-400 font-medium truncate max-w-36">
            {user?.fullName ?? user?.name ?? (role === "staff" ? "Nhân viên" : "Quản trị viên")}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-1">
            <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase px-2 py-2">
              {group.label}
            </p>

            {group.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 overflow-hidden
                    ${active
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-[20%] bottom-[20%] rounded-r-full"
                      style={{ width: "3px", backgroundColor: "#2563eb" }}
                    />
                  )}
                  <span className={`shrink-0 ${active ? "text-blue-600" : "text-slate-400"}`}>
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={item.badge === "Live"
                        ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                        : { backgroundColor: "#dbeafe", color: "#2563eb" }
                      }
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Bottom */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col gap-0.5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-500 hover:bg-amber-50 hover:text-amber-600 transition-all duration-150"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M3 12L12 4l9 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Về trang chủ
          </Link>

          <button
            onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.href = "/login"; }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 w-full text-left"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </nav>
    </aside>
  );
}