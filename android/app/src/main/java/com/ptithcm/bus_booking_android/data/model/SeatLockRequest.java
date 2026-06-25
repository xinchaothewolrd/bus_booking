package com.ptithcm.bus_booking_android.data.model;

import java.util.List;

public class SeatLockRequest {
    private int tripId;
    private List<Integer> seatIds;
    private String pendingUntil;

    public SeatLockRequest(int tripId, List<Integer> seatIds) {
        this.tripId = tripId;
        this.seatIds = seatIds;
    }
    
    public SeatLockRequest(int tripId, List<Integer> seatIds, String pendingUntil) {
        this.tripId = tripId;
        this.seatIds = seatIds;
        this.pendingUntil = pendingUntil;
    }
}
