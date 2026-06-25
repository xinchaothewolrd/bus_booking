package com.ptithcm.bus_booking_android.ui.auth;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.ptithcm.bus_booking_android.data.repository.UserRepository;
import com.ptithcm.bus_booking_android.data.model.LoginResponse;
import com.ptithcm.bus_booking_android.data.model.SignupRequest;

public class AuthViewModel extends AndroidViewModel {
    private UserRepository userRepository;

    public AuthViewModel(@NonNull Application application) {
        super(application);
        userRepository = new UserRepository(application);
    }

    public LiveData<LoginResponse> login(String email, String password) {
        return userRepository.signIn(email, password);
    }
    
    public LiveData<Boolean> register(SignupRequest request) {
        return userRepository.signUp(request);
    }
}
