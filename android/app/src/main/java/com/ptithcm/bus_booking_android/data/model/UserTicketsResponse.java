package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;

public class UserTicketsResponse {
    @SerializedName("id")
    private int id;

    @SerializedName("qrCode")
    private String qrCode;

    @SerializedName("status")
    private String status;

    @SerializedName(value = "createdAt", alternate = {"created_at"})
    private String createdAt;

    @SerializedName("passengerName")
    private String passengerName;

    @SerializedName("passengerPhone")
    private String passengerPhone;

    @SerializedName("Booking")
    private BookingData booking;

    @SerializedName("Seat")
    private SeatData seat;

    public int getId() { return id; }
    public String getQrCode() { return qrCode; }
    public String getStatus() { return status; }
    public String getCreatedAt() { return createdAt; }
    public String getPassengerName() { return passengerName; }
    public String getPassengerPhone() { return passengerPhone; }
    public BookingData getBooking() { return booking; }
    public SeatData getSeat() { return seat; }

    public static class BookingData {
        @SerializedName("id")
        private int id;

        @SerializedName("status")
        private String status;

        @SerializedName(value = "totalAmount", alternate = {"total_amount"})
        private int totalAmount;

        @SerializedName("Trip")
        private TripData trip;

        public int getId() { return id; }
        public String getStatus() { return status; }
        public int getTotalAmount() { return totalAmount; }
        public TripData getTrip() { return trip; }
    }

    public static class TripData {
        @SerializedName(value = "departureTime", alternate = {"departure_time"})
        private String departureTime;

        @SerializedName("route")
        private RouteResponse route;

        public String getDepartureTime() { return departureTime; }
        public RouteResponse getRoute() { return route; }
    }

    public static class SeatData {
        @SerializedName("seatNumber")
        private String seatNumber;

        public String getSeatNumber() { return seatNumber; }
    }
}
