import api from "./api"

export const getSeatByTripId = (tripId) => {
    return api.get(`/trip-seats/trip/${tripId}`)
}

// Nhận vào thẳng seatIds (mảng id trong DB) từ component
export const holdSeat = ({ tripId, seatIds }) => {
  return api.patch('/trip-seats/lock', { tripId, seatIds });
};

export const releaseSeat = ({ tripId, seatIds }) => {
  return api.patch('/trip-seats/release', { tripId, seatIds });
};