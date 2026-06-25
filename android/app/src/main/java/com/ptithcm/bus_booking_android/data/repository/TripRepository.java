package com.ptithcm.bus_booking_android.data.repository;

import android.content.Context;
import androidx.lifecycle.MutableLiveData;

import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.RouteResponse;
import com.ptithcm.bus_booking_android.data.model.RouteStopResponse;
import com.ptithcm.bus_booking_android.data.model.TripSearchResponse;
import com.ptithcm.bus_booking_android.data.model.TripSeatResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TripRepository {
    private ApiService apiService;

    public TripRepository(Context context) {
        apiService = RetrofitClient.getClient(context).create(ApiService.class);
    }

    public MutableLiveData<List<RouteResponse>> getRoutes() {
        MutableLiveData<List<RouteResponse>> liveData = new MutableLiveData<>();

        apiService.getRoutes().enqueue(new Callback<List<RouteResponse>>() {
            @Override
            public void onResponse(Call<List<RouteResponse>> call, Response<List<RouteResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    liveData.setValue(response.body());
                } else {
                    liveData.setValue(null);
                }
            }

            @Override
            public void onFailure(Call<List<RouteResponse>> call, Throwable t) {
                liveData.setValue(null);
            }
        });

        return liveData;
    }

    public MutableLiveData<List<TripSearchResponse>> searchTrips(String from, String to, String date) {
        MutableLiveData<List<TripSearchResponse>> liveData = new MutableLiveData<>();

        apiService.searchTrips(from, to, date).enqueue(new Callback<List<TripSearchResponse>>() {
            @Override
            public void onResponse(Call<List<TripSearchResponse>> call, Response<List<TripSearchResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    liveData.setValue(response.body());
                } else {
                    liveData.setValue(null);
                }
            }

            @Override
            public void onFailure(Call<List<TripSearchResponse>> call, Throwable t) {
                liveData.setValue(null);
            }
        });

        return liveData;
    }

    public MutableLiveData<List<TripSeatResponse>> getSeatsByTripId(int tripId) {
        MutableLiveData<List<TripSeatResponse>> liveData = new MutableLiveData<>();

        apiService.getSeatsByTripId(tripId).enqueue(new Callback<List<TripSeatResponse>>() {
            @Override
            public void onResponse(Call<List<TripSeatResponse>> call, Response<List<TripSeatResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    liveData.setValue(response.body());
                } else {
                    liveData.setValue(null);
                }
            }

            @Override
            public void onFailure(Call<List<TripSeatResponse>> call, Throwable t) {
                liveData.setValue(null);
            }
        });

        return liveData;
    }

    public MutableLiveData<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>> getBusTypes() {
        MutableLiveData<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>> liveData = new MutableLiveData<>();

        apiService.getBusTypes().enqueue(new Callback<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>>() {
            @Override
            public void onResponse(Call<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>> call, Response<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    liveData.setValue(response.body());
                } else {
                    liveData.setValue(null);
                }
            }

            @Override
            public void onFailure(Call<List<com.ptithcm.bus_booking_android.data.model.BusTypeResponse>> call, Throwable t) {
                liveData.setValue(null);
            }
        });

        return liveData;
    }

    public MutableLiveData<List<RouteStopResponse>> getRouteStops(int routeId) {
        MutableLiveData<List<RouteStopResponse>> liveData = new MutableLiveData<>();

        apiService.getRouteStops(routeId).enqueue(new Callback<List<RouteStopResponse>>() {
            @Override
            public void onResponse(Call<List<RouteStopResponse>> call, Response<List<RouteStopResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    liveData.setValue(response.body());
                } else {
                    liveData.setValue(null);
                }
            }

            @Override
            public void onFailure(Call<List<RouteStopResponse>> call, Throwable t) {
                liveData.setValue(null);
            }
        });

        return liveData;
    }
}
