export default function AuthLayout({ children }) {
  return (
    <div className="bg-background text-on-background font-body min-h-screen relative overflow-x-hidden flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          alt="OceanBus Background"
          className="w-full h-full object-cover opacity-30 grayscale-[20%]"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUv7laDq_tRR964QvYYwv--zJI5UDsDYichQIt9iD4ipSnhbFOVn-o8LTGNuDaB9LPvO48knoYtfaoXOWiV5Yv8BaWR770_zA0s3lzr8c1acJY_ardfiFsxFiflUqjIEn1DF4ueLTSdMj0nUk8kcJboHC6Ls5SNhJgWWKoxAQEWeIscLCKGfnn7A3Kx4z_DlTr6fxzZ9bOmTlOzVldHjUR3TDgBshBcO1KpRWUp-FPkq5pBrvhCm2nre7Gyg1L0pkxnQXOGbRKZhA"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background"></div>
      </div>

      {/* Blur effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-tertiary/10 rounded-full blur-[120px]" />

      <main className="relative z-10 w-full max-w-md">{children}</main>

      {/* Footer */}
      <div className="fixed bottom-6 left-0 right-0 z-10 flex justify-center gap-6 px-6">
        <button className="text-xs text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">language</span>
          Tiếng Việt
        </button>
        <button className="text-xs text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">help</span>
          Trợ giúp
        </button>
        <button className="text-xs text-on-surface-variant">
          Điều khoản & Chính sách
        </button>
      </div>
    </div>
  );
}