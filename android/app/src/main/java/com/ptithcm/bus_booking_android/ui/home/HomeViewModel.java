package com.ptithcm.bus_booking_android.ui.home;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.ptithcm.bus_booking_android.data.repository.TripRepository;
import com.ptithcm.bus_booking_android.data.model.RouteResponse;

import java.util.List;

public class HomeViewModel extends AndroidViewModel {
    private TripRepository tripRepository;

    public HomeViewModel(@NonNull Application application) {
        super(application);
        tripRepository = new TripRepository(application);
    }

    public LiveData<List<RouteResponse>> getRoutes() {
        return tripRepository.getRoutes();
    }
}
