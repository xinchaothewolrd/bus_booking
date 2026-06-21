import api from "./api"

export const getTicketByUser = (userId) => {
    return api.get(`/tickets/user/${userId}`)
}