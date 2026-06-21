import api from "./api"

export const getSeatByTripId = (tripId) => {
    return api.get(`/trip-seats/trip/${tripId}`)
}

// Nhận vào thẳng seatNumbers (mảng) từ component
export const holdSeat = ({ tripId, seatNumbers }) => {
  // Gửi y xì đúc cái mảng đó xuống backend
  return api.post('/trip-seats/hold', { tripId, seatNumbers });
};

export const releaseSeat = ({ tripId, seatNumbers }) => {
  return api.post('/trip-seats/release', { tripId, seatNumbers });
};