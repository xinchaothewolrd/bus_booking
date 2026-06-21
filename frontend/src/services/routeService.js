import api from "./api"

export const getAllRoute = () => {
    return api.get('/routes')
}