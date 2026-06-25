package com.ptithcm.bus_booking_android.data.model;

public class RouteStopResponse {
    private int id;
    private int routeId;
    private String stopName;
    private String address;
    private String stopType; // 'pickup', 'dropoff', 'both'
    private int stopOrder;
    private int arriveOffsetMinutes;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getRouteId() { return routeId; }
    public void setRouteId(int routeId) { this.routeId = routeId; }

    public String getStopName() { return stopName; }
    public void setStopName(String stopName) { this.stopName = stopName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStopType() { return stopType; }
    public void setStopType(String stopType) { this.stopType = stopType; }

    public int getStopOrder() { return stopOrder; }
    public void setStopOrder(int stopOrder) { this.stopOrder = stopOrder; }

    public int getArriveOffsetMinutes() { return arriveOffsetMinutes; }
    public void setArriveOffsetMinutes(int arriveOffsetMinutes) { this.arriveOffsetMinutes = arriveOffsetMinutes; }
}
