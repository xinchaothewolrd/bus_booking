import api from "./api";

export const getRouteStopByRouteId = (routeId) => {
    return api.get(`/route-stops/routes/${routeId}`); 
}