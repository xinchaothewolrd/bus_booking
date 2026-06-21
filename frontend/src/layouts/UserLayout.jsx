import { Outlet } from "react-router-dom";
import UserHeader from "../components/user/UserHeader";
import UserFooter from "../components/user/UserFooter";

export default function UserLayout() {
  return (
    <div>
      <UserHeader />
      <main className="min-h-screen">
        {/* Các trang như Home, Chi tiết bài viết sẽ chui vào đây */}
        <Outlet />
      </main>
      <UserFooter />
    </div>
  );
}
