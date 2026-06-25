package com.ptithcm.bus_booking_android.ui.profile;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.EditText;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.google.android.material.button.MaterialButton;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.UserResponse;
import com.ptithcm.bus_booking_android.data.model.UserUpdateRequest;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class UpdateProfileActivity extends AppCompatActivity {

    private EditText etFullName, etEmail, etPhone, etPassword;
    private MaterialButton btnSave;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_update_profile);

        Toolbar toolbar = findViewById(R.id.toolbar);
        // Fix rotation of back icon if needed
        toolbar.getNavigationIcon().setAutoMirrored(true);
        toolbar.setNavigationOnClickListener(v -> finish());

        etFullName = findViewById(R.id.etFullName);
        etEmail = findViewById(R.id.etEmail);
        etPhone = findViewById(R.id.etPhone);
        etPassword = findViewById(R.id.etPassword);
        btnSave = findViewById(R.id.btnSave);

        loadCurrentInfo();

        btnSave.setOnClickListener(v -> saveProfile());
    }

    private void loadCurrentInfo() {
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String name = prefs.getString("user_name", "");
        String email = prefs.getString("user_email", "");
        String phone = prefs.getString("user_phone", "");

        etFullName.setText(name);
        etEmail.setText(email);
        etPhone.setText(phone);
    }

    private void saveProfile() {
        String name = etFullName.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String phone = etPhone.getText().toString().trim();
        String password = etPassword.getText().toString();

        if (name.isEmpty() || email.isEmpty() || phone.isEmpty()) {
            Toast.makeText(this, "Vui lòng nhập đủ họ tên, email và số điện thoại", Toast.LENGTH_SHORT).show();
            return;
        }

        btnSave.setEnabled(false);
        btnSave.setText("Đang lưu...");

        UserUpdateRequest request = new UserUpdateRequest(name, email, phone, password);
        ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
        
        apiService.updateMyProfile(request).enqueue(new Callback<UserResponse>() {
            @Override
            public void onResponse(Call<UserResponse> call, Response<UserResponse> response) {
                btnSave.setEnabled(true);
                btnSave.setText("Lưu thông tin");
                
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(UpdateProfileActivity.this, "Cập nhật thành công!", Toast.LENGTH_SHORT).show();
                    
                    // Update SharedPreferences
                    if (response.body().getUser() != null) {
                        UserResponse.UserData user = response.body().getUser();
                        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
                        prefs.edit()
                                .putString("user_name", user.getFullName())
                                .putString("user_email", user.getEmail())
                                .putString("user_phone", user.getPhone())
                                .apply();
                    }
                    finish();
                } else {
                    Toast.makeText(UpdateProfileActivity.this, "Cập nhật thất bại. Vui lòng thử lại.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<UserResponse> call, Throwable t) {
                btnSave.setEnabled(true);
                btnSave.setText("Lưu thông tin");
                Toast.makeText(UpdateProfileActivity.this, "Lỗi kết nối", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
