package com.ptithcm.bus_booking_android.ui.payment;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.ptithcm.bus_booking_android.data.repository.PaymentRepository;

public class PaymentViewModel extends ViewModel {
    private final PaymentRepository repository;
    
    private final MutableLiveData<String> paymentUrlLiveData = new MutableLiveData<>();
    private final MutableLiveData<String> errorLiveData = new MutableLiveData<>();
    private final MutableLiveData<Boolean> loadingLiveData = new MutableLiveData<>();

    public PaymentViewModel(PaymentRepository repository) {
        this.repository = repository;
    }

    public LiveData<String> getPaymentUrlLiveData() {
        return paymentUrlLiveData;
    }

    public LiveData<String> getErrorLiveData() {
        return errorLiveData;
    }

    public LiveData<Boolean> getLoadingLiveData() {
        return loadingLiveData;
    }

    public void createPaymentUrl(int bookingId, int amount) {
        loadingLiveData.setValue(true);
        // Pass isMobile = true
        repository.createPaymentUrl(bookingId, amount, null, true, new PaymentRepository.PaymentCallback() {
            @Override
            public void onSuccess(String paymentUrl) {
                loadingLiveData.setValue(false);
                paymentUrlLiveData.setValue(paymentUrl);
            }

            @Override
            public void onError(String message) {
                loadingLiveData.setValue(false);
                errorLiveData.setValue(message);
            }
        });
    }
}
