package com.ptithcm.bus_booking_android.ui.staff;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.UserResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StaffProfileActivity extends AppCompatActivity {

    private ImageView btnBack;
    private TextView tvStaffAvatarInitials;
    private TextView tvStaffName;
    private TextView tvStaffEmail;
    private TextView tvStaffPhone;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_staff_profile);

        btnBack = findViewById(R.id.btnBack);
        tvStaffAvatarInitials = findViewById(R.id.tvStaffAvatarInitials);
        tvStaffName = findViewById(R.id.tvStaffName);
        tvStaffEmail = findViewById(R.id.tvStaffEmail);
        tvStaffPhone = findViewById(R.id.tvStaffPhone);

        btnBack.setOnClickListener(v -> finish());

        loadStaffData();
    }

    private void loadStaffData() {
        // Load local first for fast display
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String name = prefs.getString("user_name", "Nhân viên");
        String email = prefs.getString("user_email", "Chưa cập nhật");
        String phone = prefs.getString("user_phone", "Chưa cập nhật");

        updateProfileUI(name, email, phone);

        // Fetch fresh from network
        ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
        apiService.getProfile().enqueue(new Callback<UserResponse>() {
            @Override
            public void onResponse(Call<UserResponse> call, Response<UserResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getUser() != null) {
                    UserResponse.UserData user = response.body().getUser();
                    String fetchedName = user.getFullName();
                    String fetchedEmail = user.getEmail();
                    String fetchedPhone = user.getPhone();

                    // Save to prefs
                    prefs.edit()
                            .putInt("user_id", user.getId())
                            .putString("user_name", fetchedName)
                            .putString("user_email", fetchedEmail)
                            .putString("user_phone", fetchedPhone)
                            .apply();

                    // Update UI
                    updateProfileUI(fetchedName, fetchedEmail, fetchedPhone);
                }
            }

            @Override
            public void onFailure(Call<UserResponse> call, Throwable t) {
                // Ignore, fallback to local data
            }
        });
    }

    private void updateProfileUI(String name, String email, String phone) {
        tvStaffName.setText(name);
        tvStaffEmail.setText(email);
        tvStaffPhone.setText(phone);

        if (name != null && !name.isEmpty()) {
            tvStaffAvatarInitials.setText(String.valueOf(name.charAt(0)).toUpperCase());
        } else {
            tvStaffAvatarInitials.setText("U");
        }
    }
}
