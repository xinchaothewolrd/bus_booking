package com.ptithcm.bus_booking_android.data.repository;

import android.content.Context;
import androidx.lifecycle.MutableLiveData;

import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.LoginRequest;
import com.ptithcm.bus_booking_android.data.model.LoginResponse;
import com.ptithcm.bus_booking_android.data.model.SignupRequest;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class UserRepository {
    private ApiService apiService;

    public UserRepository(Context context) {
        apiService = RetrofitClient.getClient(context).create(ApiService.class);
    }

    public MutableLiveData<LoginResponse> signIn(String email, String password) {
        MutableLiveData<LoginResponse> liveData = new MutableLiveData<>();

        apiService.login(new LoginRequest(email, password)).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    liveData.setValue(response.body());
                } else {
                    liveData.setValue(null);
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                liveData.setValue(null);
            }
        });

        return liveData;
    }

    public MutableLiveData<Boolean> signUp(SignupRequest request) {
        MutableLiveData<Boolean> liveData = new MutableLiveData<>();

        apiService.register(request).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    liveData.setValue(true);
                } else {
                    liveData.setValue(false);
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                liveData.setValue(false);
            }
        });

        return liveData;
    }
}
