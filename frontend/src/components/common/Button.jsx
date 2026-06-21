// Common Button Component
export default function Button({ children, variant = "primary", ...props }) {
  const baseClass = "px-4 py-2 rounded font-semibold transition-colors";
  const variantClass =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-gray-300 text-black hover:bg-gray-400";

  return (
    <button className={`${baseClass} ${variantClass}`} {...props}>
      {children}
    </button>
  );
}
