package com.ptithcm.bus_booking_android.data.model;

public class LoginResponse {
    private String message;
    private String accessToken;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
}
