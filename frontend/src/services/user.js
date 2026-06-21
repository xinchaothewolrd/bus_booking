import api from "./api";

export const fetchMeApi = (token) => {
  return api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

