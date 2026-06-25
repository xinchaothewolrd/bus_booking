package com.ptithcm.bus_booking_android.ui.seat;

import android.app.Application;

import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.MutableLiveData;

import com.ptithcm.bus_booking_android.data.model.TripSeatResponse;
import com.ptithcm.bus_booking_android.data.repository.TripRepository;

import java.util.List;

public class SeatViewModel extends AndroidViewModel {
    private TripRepository repository;

    public SeatViewModel(@NonNull Application application) {
        super(application);
        repository = new TripRepository(application);
    }

    public MutableLiveData<List<TripSeatResponse>> getSeatsByTripId(int tripId) {
        return repository.getSeatsByTripId(tripId);
    }

    public MutableLiveData<List<com.ptithcm.bus_booking_android.data.model.RouteStopResponse>> getRouteStops(int routeId) {
        return repository.getRouteStops(routeId);
    }
}
