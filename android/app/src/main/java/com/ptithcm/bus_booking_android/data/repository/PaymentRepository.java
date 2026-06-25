package com.ptithcm.bus_booking_android.data.repository;

import androidx.annotation.NonNull;

import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.model.PaymentUrlRequest;
import com.ptithcm.bus_booking_android.data.model.PaymentUrlResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PaymentRepository {
    private final ApiService apiService;

    public PaymentRepository(ApiService apiService) {
        this.apiService = apiService;
    }

    public void createPaymentUrl(int bookingId, int amount, String bankCode, boolean isMobile, PaymentCallback callback) {
        PaymentUrlRequest request = new PaymentUrlRequest(bookingId, amount, bankCode, isMobile);
        apiService.createPaymentUrl(request).enqueue(new Callback<PaymentUrlResponse>() {
            @Override
            public void onResponse(@NonNull Call<PaymentUrlResponse> call, @NonNull Response<PaymentUrlResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    callback.onSuccess(response.body().getPaymentUrl());
                } else {
                    callback.onError("Không thể tạo URL thanh toán. Vui lòng thử lại!");
                }
            }

            @Override
            public void onFailure(@NonNull Call<PaymentUrlResponse> call, @NonNull Throwable t) {
                callback.onError("Lỗi kết nối máy chủ: " + t.getMessage());
            }
        });
    }

    public interface PaymentCallback {
        void onSuccess(String paymentUrl);
        void onError(String message);
    }
}
