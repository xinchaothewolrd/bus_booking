import UserHero from '../../components/user/home/UserHero';
import Sidebar from '../../components/user/searchPage/SideBar';
import BusCard from '../../components/common/BusCard';
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from 'react';
import { findTripByFromToDate } from '../../services/tripService';

export default function SearchPage() {
  const [params] = useSearchParams();

  const from = params.get("from");
  const to = params.get("to");
  const date = params.get("date");
  
  const [busResults, setBusResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    time: null,        // sáng, trưa...
    busTypes: [],      // ['Limousine', ...]
    maxPrice: null,    // number
  });
  const [sort, setSort] = useState(null);  // "price" | "time"

  const applySort = (data) => {
    if (!sort) return data;

    const sorted = [...data];

    if (sort === "price") {
      sorted.sort((a, b) => {
        const priceA = parseInt(a.price.replace(/\D/g, ""));
        const priceB = parseInt(b.price.replace(/\D/g, ""));
        return priceA - priceB;
      });
    }

    if (sort === "time") {
      sorted.sort((a, b) => {
        const timeA = new Date(a.rawDepartureTime).getTime();
        const timeB = new Date(b.rawDepartureTime).getTime();

        return timeA - timeB;
      });
    }

    return sorted;
  };

  const applyFilters = (data) => {
    return data.filter((trip) => {
      // FILTER TIME
      if (filters.time) {
        const hour = new Date(trip.rawDepartureTime).getHours();

        const timeMap = {
          "Sáng": [5, 11],
          "Trưa": [11, 14],
          "Chiều": [14, 18],
          "Tối": [18, 24],
        };

        const [start, end] = timeMap[filters.time];

        if (hour < start || hour >= end) return false;
      }

      // FILTER BUS TYPE
      if (filters.busTypes.length > 0) {
        if (!filters.busTypes.includes(trip.bus_type)) return false;
      }

      // FILTER PRICE
      if (filters.maxPrice) {
        const price = parseInt(trip.price.replace(/\D/g, ""));
        if (price > filters.maxPrice) return false;
      }

      return true;
    });
  };

  const filteredResults = applyFilters(busResults);
  const finalResults = applySort(filteredResults);

  // format dữ liệu từ backend → UI
  const formatTrip = (trip) => {
    const formatTime = (iso) => {
      const d = new Date(iso);
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return {
      company: "OceanBus", // tạm
      rating: "4.5",
      reviews: "100 đánh giá",
      rawDepartureTime: trip.departureTime || trip.departure_time,
      departureTime: formatTime(trip.departureTime || trip.departure_time),
      departureLoc: trip.departureLocation || trip.departure_location,
      bus_type: trip.busType || trip.bus_type || "Xe giường nằm",
      arrivalTime: formatTime(trip.arrivalTimeExpected || trip.arrival_time_expected),
      arrivalLoc: trip.arrivalLocation || trip.arrival_location,
      tripId: trip.tripId || trip.trip_id || trip.id,
      duration: trip.duration,

      price: (trip.price || 250000).toLocaleString("vi-VN") + "đ",

      facilities: ["wifi", "water"], // tạm
    };
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        if (!from || !to || !date) return;

        setLoading(true);

        const res = await findTripByFromToDate({ from, to, date });

        const formatted = res.data.map(formatTrip);

        setBusResults(formatted);
      } catch (error) {
        console.error("Lỗi fetch trips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [from, to, date]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 font-sans antialiased overflow-x-hidden">    
      <main className="pt-16 pb-20 px-6 mx-auto">
        
        {/* Hero giữ nguyên + truyền lại dữ liệu */}
        <UserHero defaultValues={{ from, to, date }} />

        <div className="flex flex-col lg:flex-row px-32 gap-8">
          
          <Sidebar filters={filters} setFilters={setFilters} />

          <section className="flex-1 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400">
                Tuyến{" "}
                <span className="text-primary-ice font-bold">
                  {from} → {to}
                </span>{" "}
                ({date}) • Tìm thấy{" "}
                <span className="text-primary-ice font-bold">
                  {busResults.length}
                </span>{" "}
                chuyến xe
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setSort("price")}
                  className={`px-4 py-2 text-xs rounded-full cursor-pointer
                    ${sort === "price"
                      ? "bg-slate-200/20 border-primary-ice text-primary-ice"
                      : "glass-card text-slate-400 hover:text-white"
                    }`}
                >
                  Giá thấp nhất
                </button>

                <button
                  onClick={() => setSort("time")}
                  className={`px-4 py-2 text-xs rounded-full cursor-pointer
                    ${sort === "time"
                      ? "bg-slate-200/20 border-primary-ice text-primary-ice"
                      : "glass-card text-slate-400 hover:text-white"
                    }`}
                >
                  Khởi hành sớm nhất
                </button>

              </div>
            </div>

            {/* Content */}
            {loading ? (
              <p className="text-center text-slate-400">Đang tải dữ liệu...</p>
            ) : busResults.length === 0 ? (
              <p className="text-center text-slate-400">
                Không tìm thấy chuyến xe phù hợp
              </p>
            ) : (
              finalResults.map((bus, index) => (
                <BusCard key={index} {...bus} />
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
}