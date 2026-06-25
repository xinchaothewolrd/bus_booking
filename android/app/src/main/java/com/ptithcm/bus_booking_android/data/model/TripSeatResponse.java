package com.ptithcm.bus_booking_android.data.model;

public class TripSeatResponse {
    private int id;
    private int tripId;
    private String seatNumber;
    private String status; // 'available', 'pending', 'booked'
    private String pendingUntil;

    public int getId() { return id; }
    public int getTripId() { return tripId; }
    public String getSeatNumber() { return seatNumber; }
    public String getStatus() { return status; }
    public String getPendingUntil() { return pendingUntil; }
}
