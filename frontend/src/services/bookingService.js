import api from './api'; 

export const createBooking = (bookingData) => {
  return api.post('/bookings', bookingData); 
};

export const updateBookingStatus = (id, status) => {
  return api.put(`/bookings/${id}`, { status }); 
};

export const cancelBooking = (bookingId) => {
  return api.post(`/bookings/${bookingId}/cancel`);
}