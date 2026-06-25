package com.ptithcm.bus_booking_android.ui.trip;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.ptithcm.bus_booking_android.data.repository.TripRepository;
import com.ptithcm.bus_booking_android.data.model.TripSearchResponse;

import java.util.List;

public class TripViewModel extends AndroidViewModel {
    private TripRepository tripRepository;

    public TripViewModel(@NonNull Application application) {
        super(application);
        tripRepository = new TripRepository(application);
    }

    public LiveData<List<TripSearchResponse>> searchTrips(String from, String to, String date) {
        return tripRepository.searchTrips(from, to, date);
    }

    public LiveData<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>> getBusTypes() {
        return tripRepository.getBusTypes();
    }
}
