package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;

public class TicketCheckResponse {

    @SerializedName("ticket")
    private TicketData ticket;

    public TicketData getTicket() { return ticket; }

    public static class TicketData {
        @SerializedName("id")
        private int id;

        @SerializedName("qrCode")
        private String qrCode;

        @SerializedName("passengerName")
        private String passengerName;

        @SerializedName("passengerPhone")
        private String passengerPhone;

        @SerializedName("status")
        private String status; // "unused" | "used" | "cancelled"

        @SerializedName("seatNumber")
        private String seatNumber;

        @SerializedName("booking")
        private BookingData booking;

        @SerializedName("pickupStop")
        private StopData pickupStop;

        @SerializedName("dropoffStop")
        private StopData dropoffStop;

        public int getId() { return id; }
        public String getQrCode() { return qrCode; }
        public String getPassengerName() { return passengerName; }
        public String getPassengerPhone() { return passengerPhone; }
        public String getStatus() { return status; }
        public String getSeatNumber() { return seatNumber; }
        public BookingData getBooking() { return booking; }
        public StopData getPickupStop() { return pickupStop; }
        public StopData getDropoffStop() { return dropoffStop; }
    }

    public static class BookingData {
        @SerializedName("id")
        private int id;

        @SerializedName("tripId")
        private int tripId;

        @SerializedName("status")
        private String status;

        @SerializedName("departureTime")
        private String departureTime;

        @SerializedName("route")
        private RouteData route;

        public int getId() { return id; }
        public int getTripId() { return tripId; }
        public String getStatus() { return status; }
        public String getDepartureTime() { return departureTime; }
        public RouteData getRoute() { return route; }
    }

    public static class RouteData {
        @SerializedName("departureLocation")
        private String departureLocation;

        @SerializedName("arrivalLocation")
        private String arrivalLocation;

        public String getDepartureLocation() { return departureLocation; }
        public String getArrivalLocation() { return arrivalLocation; }
    }

    public static class StopData {
        @SerializedName("name")
        private String name;

        @SerializedName("address")
        private String address;

        public String getName() { return name; }
        public String getAddress() { return address; }
    }
}
