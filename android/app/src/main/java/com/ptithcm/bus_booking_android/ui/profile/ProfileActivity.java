package com.ptithcm.bus_booking_android.ui.profile;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.ptithcm.bus_booking_android.MainActivity;
import com.ptithcm.bus_booking_android.R;
import androidx.appcompat.app.AppCompatDelegate;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.ptithcm.bus_booking_android.ui.auth.LoginActivity;
import com.ptithcm.bus_booking_android.ui.history.BookingHistoryActivity;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.UserResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;



public class ProfileActivity extends AppCompatActivity {

    private TextView tvAvatarInitials;
    private TextView tvUserName;
    private TextView tvUserEmail;
    private TextView tvUserPhone;
    private LinearLayout menuPersonalInfo;
    private LinearLayout menuBookingHistory;
    private LinearLayout menuSupport;
    private LinearLayout menuTheme;
    private SwitchMaterial switchDarkMode;
    private LinearLayout menuLogout;
    private LinearLayout menuBackToHome;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        // Bind views
        tvAvatarInitials = findViewById(R.id.tvAvatarInitials);
        tvUserName = findViewById(R.id.tvUserName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvUserPhone = findViewById(R.id.tvUserPhone);
        menuPersonalInfo = findViewById(R.id.menuPersonalInfo);
        menuBookingHistory = findViewById(R.id.menuBookingHistory);
        menuSupport = findViewById(R.id.menuSupport);
        menuTheme = findViewById(R.id.menuTheme);
        switchDarkMode = findViewById(R.id.switchDarkMode);
        menuLogout = findViewById(R.id.menuLogout);
        menuBackToHome = findViewById(R.id.menuBackToHome);


        loadUserData();

        menuPersonalInfo.setOnClickListener(v -> {
            startActivity(new Intent(ProfileActivity.this, UpdateProfileActivity.class));
        });

        menuBookingHistory.setOnClickListener(v -> {
            startActivity(new Intent(ProfileActivity.this, BookingHistoryActivity.class));
        });

        menuSupport.setOnClickListener(v -> {
            Toast.makeText(this, "Chức năng đang phát triển", Toast.LENGTH_SHORT).show();
        });

        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        boolean isDarkMode = prefs.getBoolean("dark_mode", false);
        switchDarkMode.setChecked(isDarkMode);

        switchDarkMode.setOnCheckedChangeListener((buttonView, isChecked) -> {
            prefs.edit().putBoolean("dark_mode", isChecked).apply();
            if (isChecked) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            }
        });

        menuTheme.setOnClickListener(v -> {
            switchDarkMode.setChecked(!switchDarkMode.isChecked());
        });

        menuLogout.setOnClickListener(v -> {
            // Clear profile prefs
            SharedPreferences clearPrefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
            clearPrefs.edit().clear().apply();

            // Clear token prefs
            SharedPreferences appPrefs = getSharedPreferences("app", MODE_PRIVATE);
            appPrefs.edit().clear().apply();
            Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });

        menuBackToHome.setOnClickListener(v -> {
            Intent intent = new Intent(ProfileActivity.this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
            finish();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadUserData();
    }

    private void loadUserData() {
        // Load local first for fast display
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String name = prefs.getString("user_name", "Khách");
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
        tvUserName.setText(name);
        tvUserEmail.setText(email);
        tvUserPhone.setText(phone);

        if (name != null && !name.isEmpty()) {
            tvAvatarInitials.setText(String.valueOf(name.charAt(0)).toUpperCase());
        } else {
            tvAvatarInitials.setText("U");
        }
    }
}
