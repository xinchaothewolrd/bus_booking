import { SunMedium, Sun, Sunset, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { getAllBusType } from "../../../services/busTypeService";

export default function Sidebar({ filters, setFilters }) {
  const [busTypes, setBusTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBusType = async () => {
      try {
        setLoading(true);

        const res = await getAllBusType();

        setBusTypes(res.data);
      } catch (error) {
        console.error("Lỗi fetch bus types:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusType();
  }, []); // 👈 FIX LOOP

  return (
    <aside className="w-full lg:w-72 space-y-6">
      <div className="glass-card p-6 rounded-2xl">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-primary-ice">Bộ lọc</h2>
          <button
            className="text-xs text-slate-400 hover:text-primary-ice uppercase tracking-wider 
            font-semibold cursor-pointer transition-colors"
            onClick={() =>
              setFilters({
                time: null,
                busTypes: [],
                maxPrice: null,
              })
            }
          >
            Xóa hết
          </button>
        </div>

        {/* TIME */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-4 text-slate-200">
            Khung giờ
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: SunMedium, label: "Sáng" },
              { icon: Sun, label: "Trưa" },
              { icon: Sunset, label: "Chiều" },
              { icon: Moon, label: "Tối" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    time: prev.time === item.label ? null : item.label,
                  }))
                }
                className={`p-2 text-xs border rounded-lg flex flex-col items-center gap-1 cursor-pointer
                  ${
                    filters.time === item.label
                      ? "border-primary-ice text-primary-ice bg-primary-ice/10"
                      : "border-sky-400/10 hover:border-primary-ice hover:text-primary-ice bg-white/5"
                  }`}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* BUS TYPE (API REAL) */}
        <div className="mb-8">
          <label className="block text-sm font-semibold mb-4 text-slate-200">
            Loại xe
          </label>

          {loading ? (
            <p className="text-xs text-slate-400">Đang tải...</p>
          ) : (
            <div className="space-y-3">
              {busTypes.map((type) => (
                <label
                  key={type.id}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    className="rounded border-sky-400/20 bg-transparent text-primary-ice w-5 h-5 cursor-pointer"
                    checked={filters.busTypes.includes(type.typeName)}
                    onChange={() => {
                      setFilters((prev) => {
                        const exists = prev.busTypes.includes(type.typeName);
                        return {
                          ...prev,
                          busTypes: exists
                            ? prev.busTypes.filter((t) => t !== type.typeName)
                            : [...prev.busTypes, type.typeName],
                        };
                      });
                    }}
                  />

                  <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                    {type.typeName}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* PRICE */}
        <div>
          <label className="block text-sm font-semibold mb-4 text-slate-200">
            Giá vé
          </label>

          <input
            type="range"
            min={100000}
            max={1500000}
            step={50000}
            className="w-full h-1.5 bg-white/10 rounded-lg cursor-pointer accent-primary-ice"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                maxPrice: Number(e.target.value),
              }))
            }
          />

          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>100k</span>
            <span>1,500k</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
