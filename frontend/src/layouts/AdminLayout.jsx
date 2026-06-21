import { Outlet, Navigate, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import useAuthStore from "../store/useAuthStore";

export default function AdminLayout() {
  const location = useLocation();

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

  // Bảo vệ đường dẫn cho Nhân viên (staff)
  if (role === "staff") {
    const allowedPaths = ["/admin/seats", "/admin/bookings", "/admin/checkin"];
    const currentPath = location.pathname;

    // Nếu staff cố tình truy cập thủ công vào các trang admin khác hoặc dashboard, redirect về trang đặt vé
    if (!allowedPaths.includes(currentPath)) {
      return <Navigate to="/admin/bookings" replace />;
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-5 overflow-x-hidden">
        {/* Các trang như Dashboard, Quản lý sẽ chui vào đây */}
        <Outlet />
      </div>
    </div>
  );
}
