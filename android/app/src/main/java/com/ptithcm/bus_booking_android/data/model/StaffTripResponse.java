package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;

public class StaffTripResponse {
    private int id;
    private int routeId;
    private String departureTime;
    private RouteData route;

    public int getId() { return id; }
    public String getDepartureTime() { return departureTime; }
    public RouteData getRoute() { return route; }

    public static class RouteData {
        @SerializedName(value = "departure_location", alternate = {"departureLocation"})
        private String departureLocation;

        @SerializedName(value = "arrival_location", alternate = {"arrivalLocation"})
        private String arrivalLocation;

        public String getDepartureLocation() { return departureLocation; }
        public String getArrivalLocation() { return arrivalLocation; }
    }
}
