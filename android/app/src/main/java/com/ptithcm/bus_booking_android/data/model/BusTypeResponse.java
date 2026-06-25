package com.ptithcm.bus_booking_android.data.model;

import com.google.gson.annotations.SerializedName;

public class BusTypeResponse {
    @SerializedName("id")
    private int id;

    @SerializedName("typeName")
    private String typeName;

    @SerializedName("totalSeats")
    private int totalSeats;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTypeName() { return typeName; }
    public void setTypeName(String typeName) { this.typeName = typeName; }

    public int getTotalSeats() { return totalSeats; }
    public void setTotalSeats(int totalSeats) { this.totalSeats = totalSeats; }
    
    @Override
    public String toString() {
        return typeName != null ? typeName : "";
    }
}
