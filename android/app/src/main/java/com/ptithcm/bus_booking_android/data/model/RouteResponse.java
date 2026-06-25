package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;

public class RouteResponse {
    private int id;
    
    @SerializedName("departureLocation")
    private String departureLocation;
    
    @SerializedName("arrivalLocation")
    private String arrivalLocation;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getDepartureLocation() { return departureLocation; }
    public void setDepartureLocation(String departureLocation) { this.departureLocation = departureLocation; }

    public String getArrivalLocation() { return arrivalLocation; }
    public void setArrivalLocation(String arrivalLocation) { this.arrivalLocation = arrivalLocation; }
}
