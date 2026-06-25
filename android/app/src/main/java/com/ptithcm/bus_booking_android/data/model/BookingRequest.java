package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class BookingRequest {
    @SerializedName("userId")
    private int userId;

    @SerializedName("tripId")
    private int tripId;

    @SerializedName("totalAmount")
    private int totalAmount;

    @SerializedName("email")
    private String email;

    @SerializedName("fullName")
    private String fullName;

    @SerializedName("tickets")
    private List<TicketRequest> tickets;

    public BookingRequest(int userId, int tripId, int totalAmount, String email, String fullName, List<TicketRequest> tickets) {
        this.userId = userId;
        this.tripId = tripId;
        this.totalAmount = totalAmount;
        this.email = email;
        this.fullName = fullName;
        this.tickets = tickets;
    }

    public int getUserId() { return userId; }
    public int getTripId() { return tripId; }
    public int getTotalAmount() { return totalAmount; }
    public List<TicketRequest> getTickets() { return tickets; }

    public static class TicketRequest {
        @SerializedName("tripSeatId")
        private int tripSeatId;

        @SerializedName("passengerName")
        private String passengerName;

        @SerializedName("passengerPhone")
        private String passengerPhone;

        @SerializedName("passengerEmail")
        private String passengerEmail;

        @SerializedName("pickupStopId")
        private Integer pickupStopId;

        @SerializedName("dropoffStopId")
        private Integer dropoffStopId;

        public TicketRequest(int tripSeatId, String passengerName, String passengerPhone, String passengerEmail, Integer pickupStopId, Integer dropoffStopId) {
            this.tripSeatId = tripSeatId;
            this.passengerName = passengerName;
            this.passengerPhone = passengerPhone;
            this.passengerEmail = passengerEmail;
            this.pickupStopId = pickupStopId;
            this.dropoffStopId = dropoffStopId;
        }

        public int getTripSeatId() { return tripSeatId; }
        public String getPassengerName() { return passengerName; }
        public String getPassengerPhone() { return passengerPhone; }
        public String getPassengerEmail() { return passengerEmail; }
        public Integer getPickupStopId() { return pickupStopId; }
        public Integer getDropoffStopId() { return dropoffStopId; }
    }
}
