import api from "./api"

export const signup = (data) => {
  return api.post('/auth/signup', data)
};
export const signin = (data) => {
  return api.post('/auth/signin', data)
};

export const logout = () => {
  return api.post('/auth/signout')
}
