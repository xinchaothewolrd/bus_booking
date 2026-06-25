package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;

public class TripSearchResponse {
    @SerializedName("trip_id")
    private int tripId;

    @SerializedName("route_id")
    private int routeId;

    @SerializedName("departure_location")
    private String departureLocation;

    @SerializedName("arrival_location")
    private String arrivalLocation;

    @SerializedName("departure_time")
    private String departureTime;

    @SerializedName("arrival_time_expected")
    private String arrivalTimeExpected;

    @SerializedName("duration")
    private String duration;

    @SerializedName("price")
    private int price;

    @SerializedName("bus_type")
    private String busType;

    public int getTripId() { return tripId; }
    public void setTripId(int tripId) { this.tripId = tripId; }

    public int getRouteId() { return routeId; }
    public void setRouteId(int routeId) { this.routeId = routeId; }

    public String getDepartureLocation() { return departureLocation; }
    public void setDepartureLocation(String departureLocation) { this.departureLocation = departureLocation; }

    public String getArrivalLocation() { return arrivalLocation; }
    public void setArrivalLocation(String arrivalLocation) { this.arrivalLocation = arrivalLocation; }

    public String getDepartureTime() { return departureTime; }
    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }

    public String getArrivalTimeExpected() { return arrivalTimeExpected; }
    public void setArrivalTimeExpected(String arrivalTimeExpected) { this.arrivalTimeExpected = arrivalTimeExpected; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public String getBusType() { return busType; }
    public void setBusType(String busType) { this.busType = busType; }
}
