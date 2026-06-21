import AppRouter from "./routes";
import { Toaster } from "sonner";
import { useEffect } from "react";
import useAuthStore from "./store/useAuthStore";
import axios from "axios";

function App() {
  const { fetchMe, setLoading, setAuth } = useAuthStore.getState();
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post(
          "http://localhost:3000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const token = res.data.accessToken;

        setAuth(token, null);
        await fetchMe(token);

      } catch (err) {
        console.log("Chưa login");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <AppRouter />
    </>
  );
}

export default App;
