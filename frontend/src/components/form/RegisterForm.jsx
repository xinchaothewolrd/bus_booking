import { Link } from "react-router-dom";
import { Bus, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signup } from "../../services/auth";

const schema = z.object({
  lastName: z.string().min(1, "Vui lòng nhập họ"),
  firstName: z.string().min(1, "Vui lòng nhập tên"),
  phone: z
    .string()
    .min(9, "Số điện thoại không hợp lệ")
    .regex(/^[0-9+\s]+$/, "Số điện thoại không hợp lệ"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(5, "Mật khẩu tối thiểu 5 ký tự"),
});

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ lastName, firstName, phone, email, password }) => {
    try {
      await signup({
        password,
        email,
        phone,
        firstName,
        lastName,
      });
      toast.success("Đăng ký thành công. Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Lỗi khi đăng ký";
      toast.error(msg);
    }
  };

  return (
    <div className="glass-card rounded-xl p-8 shadow-[0_0_30px_rgba(125,211,252,0.05)]">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          Tham gia OceanBus
        </h1>
        <p className="text-on-surface-variant text-sm mt-2">
          Bắt đầu hành trình của bạn cùng chúng tôi
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {/* Họ và Tên — 2 cột */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">
              Họ
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                <User size={18} />
              </span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none"
                placeholder="Nguyễn"
                type="text"
                {...register("lastName")}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs text-red-400 ml-1">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">
              Tên
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                <User size={18} />
              </span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none"
                placeholder="Văn A"
                type="text"
                {...register("firstName")}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-red-400 ml-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">
            Số điện thoại
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              <Phone size={18} />
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none"
              placeholder="09xx xxx xxx"
              type="tel"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-400 ml-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              <Mail size={18} />
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-12 pr-4 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none"
              placeholder="example@email.com"
              type="email"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-400 ml-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-primary uppercase tracking-wider ml-1">
            Mật khẩu
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
              <Lock size={18} />
            </span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg py-3 pl-12 pr-12 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none"
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              {...register("password")}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              type="button"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 ml-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold py-3.5 rounded-lg transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(125,211,252,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-on-surface-variant text-sm">
          Đã có tài khoản?
          <button
            onClick={() => navigate("/login")}
            className="text-primary font-semibold ml-1 hover:underline decoration-primary/30 underline-offset-4"
          >
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  );
}