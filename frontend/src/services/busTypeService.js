import api from "./api";

export const getAllBusType = () => {
    return api.get("/bus-types")
}