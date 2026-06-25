package com.ptithcm.bus_booking_android.data.model;

public class PaymentUrlRequest {
    private int bookingId;
    private int amount;
    private String bankCode;
    private boolean isMobile;

    public PaymentUrlRequest(int bookingId, int amount, String bankCode, boolean isMobile) {
        this.bookingId = bookingId;
        this.amount = amount;
        this.bankCode = bankCode;
        this.isMobile = isMobile;
    }

    public int getBookingId() {
        return bookingId;
    }

    public void setBookingId(int bookingId) {
        this.bookingId = bookingId;
    }

    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }

    public String getBankCode() {
        return bankCode;
    }

    public void setBankCode(String bankCode) {
        this.bankCode = bankCode;
    }

    public boolean isMobile() {
        return isMobile;
    }

    public void setMobile(boolean mobile) {
        isMobile = mobile;
    }
}
