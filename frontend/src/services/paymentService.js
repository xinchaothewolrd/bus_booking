import api from './api'; // file config axios của mày

// Hàm gọi API tạo link VNPay
export const createVnpayUrl = (paymentData) => {
  return api.post('/payments/create_url', paymentData); 
}