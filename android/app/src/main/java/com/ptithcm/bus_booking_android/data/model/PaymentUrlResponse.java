package com.ptithcm.bus_booking_android.data.model;

public class PaymentUrlResponse {
    private String paymentUrl;
    private String message;

    public String getPaymentUrl() {
        return paymentUrl;
    }

    public void setPaymentUrl(String paymentUrl) {
        this.paymentUrl = paymentUrl;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
