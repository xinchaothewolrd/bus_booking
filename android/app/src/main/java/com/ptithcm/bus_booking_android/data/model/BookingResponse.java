package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class BookingResponse {
    @SerializedName("message")
    private String message;

    @SerializedName("data")
    private BookingData data;

    public String getMessage() { return message; }
    public BookingData getData() { return data; }

    public static class BookingData {
        @SerializedName("id")
        private int id;

        @SerializedName("userId")
        private int userId;

        @SerializedName("tripId")
        private int tripId;

        @SerializedName("totalAmount")
        private int totalAmount;

        @SerializedName("status")
        private String status;

        @SerializedName("Tickets")
        private List<TicketData> tickets;

        public int getId() { return id; }
        public int getUserId() { return userId; }
        public int getTripId() { return tripId; }
        public int getTotalAmount() { return totalAmount; }
        public String getStatus() { return status; }
        public List<TicketData> getTickets() { return tickets; }
    }

    public static class TicketData {
        @SerializedName("id")
        private int id;

        @SerializedName("bookingId")
        private int bookingId;

        @SerializedName("tripSeatId")
        private int tripSeatId;

        @SerializedName("passengerName")
        private String passengerName;

        @SerializedName("passengerPhone")
        private String passengerPhone;

        @SerializedName("qrCode")
        private String qrCode;

        @SerializedName("status")
        private String status;

        public int getId() { return id; }
        public int getBookingId() { return bookingId; }
        public int getTripSeatId() { return tripSeatId; }
        public String getPassengerName() { return passengerName; }
        public String getPassengerPhone() { return passengerPhone; }
        public String getQrCode() { return qrCode; }
        public String getStatus() { return status; }
    }
}
