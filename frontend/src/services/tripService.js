import api from "./api";

export const findTripByFromToDate = ({from, to, date}) => {
    return api.get(`/trips/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
}

export const getTripById = (id) => {
    return api.get(`/trips/${id}`)
}