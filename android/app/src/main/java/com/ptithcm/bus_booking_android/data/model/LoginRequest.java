package com.ptithcm.bus_booking_android.data.model;

public class LoginRequest {
    private String identity;
    private String password;

    public LoginRequest(String identity, String password) {
        this.identity = identity;
        this.password = password;
    }

    public String getIdentity() { return identity; }
    public void setIdentity(String identity) { this.identity = identity; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
