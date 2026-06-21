import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

// 🔥 request: gắn token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute =
      originalRequest.url.includes("/auth/signin") ||
      originalRequest.url.includes("/auth/signup");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute // 🔥 thêm điều kiện này
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "http://localhost:3000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = res.data.accessToken;

        useAuthStore.getState().setAuth(newToken, null);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (err) {
        useAuthStore.getState().logOut();
        window.location.href = "/login";
      }
    }

    // 🔥 luôn trả lỗi về component
    return Promise.reject(error);
  }
);

export default api;