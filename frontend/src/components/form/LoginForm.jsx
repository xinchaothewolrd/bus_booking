import { Bus, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signin } from "../../services/auth";
import useAuthStore from "../../store/useAuthStore";

const schema = z.object({
  identifier: z.string().min(1, "Vui lòng nhập email"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export default function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ identifier, password }) => {
  try {
    const res = await signin({ identity: identifier, password });

    const { accessToken } = res.data;
    setAuth(accessToken, null);

    // gọi me và lấy user trực tiếp
    await fetchMe(accessToken);
    const user = useAuthStore.getState().user;

    toast.success("Đăng nhập thành công");
    console.log(user)

    if (user?.role === "admin") {
      navigate("/admin");
    } else if (user?.role === "staff") {
      navigate("/admin/bookings");
    } else {
      navigate("/");
    }

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    const msg =
      err?.response?.data?.message || err.message || "Lỗi khi đăng nhập";

    toast.error(msg);
  }
};

  return (
    <div className="glass-panel rounded-xl p-8 md:p-10 flex flex-col items-center">
      {/* Logo Section */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-primary-container/30 border border-primary/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(125,211,252,0.1)]">
          <span className="material-symbols-outlined text-4xl text-primary">
            <Bus />
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-primary font-headline">
          OceanBus
        </h1>
        <p className="text-on-surface-variant mt-2 font-medium">
          Chào mừng trở lại
        </p>
      </div>

      {/* Login Form */}
      <form className="w-full space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-on-secondary-container ml-1"
            htmlFor="identifier"
          >
            Email
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Mail size={20} />
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              id="identifier"
              placeholder="example@oceanbus.com"
              type="text"
              {...register("identifier")}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-red-400 ml-1">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label
              className="text-sm font-medium text-on-secondary-container"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <a
              className="text-xs text-primary hover:text-primary-fixed transition-colors"
              href="#"
            >
              Quên mật khẩu?
            </a>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Lock size={20} />
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              id="password"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              {...register("password")}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 ml-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          className="w-full bg-primary-container hover:bg-primary-container/80 text-primary border border-primary/20 font-bold py-3.5 rounded-lg transition-all duration-200 active:scale-95 shadow-[0_4px_20px_rgba(125,211,252,0.15)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
        </button>
      </form>

      {/* Register Link */}
      <div className="mt-8 text-center">
        <p className="text-on-surface-variant text-sm">
          Chưa có tài khoản?
          <button
            className="text-primary font-bold hover:underline underline-offset-4 ml-1"
            onClick={() => navigate("/register")}
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}