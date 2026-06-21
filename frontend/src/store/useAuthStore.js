import create from 'zustand';
import { fetchMeApi } from '../services/user';

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isLogin: false,

  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    set({
      accessToken: token,
      user,
      isLogin: true,
    });
  },

  setLoading: (val) => set({ isLoading: val }),

  fetchMe: async (token) => {
    try {
      const res = await fetchMeApi(token);
      const user = res.data.user;
      localStorage.setItem("user", JSON.stringify(user));

      set({
        user,
        isLogin: true,
      });

      return user; 
    } catch (err) {
      localStorage.removeItem("user");
      set({
        user: null,
        isLogin: false,
      });
      throw err; 
    }
  },

  logOut: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({
      accessToken: null,
      user: null,
      isLogin: false,
    });
  },
}));

export default useAuthStore;
