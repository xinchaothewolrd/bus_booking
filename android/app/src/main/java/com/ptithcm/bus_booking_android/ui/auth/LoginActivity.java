package com.ptithcm.bus_booking_android.ui.auth;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import com.ptithcm.bus_booking_android.MainActivity;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.UserResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private AuthViewModel authViewModel;

    private TextInputEditText edtEmail;
    private TextInputEditText edtPassword;
    private MaterialButton btnLogin;
    private TextView tvGoToRegister;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Tự động đăng nhập
        SharedPreferences prefs = getSharedPreferences("app", MODE_PRIVATE);
        String token = prefs.getString("access_token", null);
        if (token != null && !token.isEmpty()) {
            SharedPreferences appPrefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
            String savedRole = appPrefs.getString("user_role", "customer");
            Intent intent;
            if ("staff".equals(savedRole)) {
                intent = new Intent(LoginActivity.this, com.ptithcm.bus_booking_android.ui.staff.StaffScanActivity.class);
            } else {
                intent = new Intent(LoginActivity.this, MainActivity.class);
            }
            startActivity(intent);
            finish();
            return;
        }

        setContentView(R.layout.activity_login);

        authViewModel = new ViewModelProvider(this).get(AuthViewModel.class);

        edtEmail = findViewById(R.id.edtEmail);
        edtPassword = findViewById(R.id.edtPassword);
        btnLogin = findViewById(R.id.btnLogin);
        tvGoToRegister = findViewById(R.id.tvGoToRegister);

        btnLogin.setOnClickListener(v -> {
            String email = edtEmail.getText().toString().trim();
            String password = edtPassword.getText().toString().trim();

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập Email/SĐT và Mật khẩu!", Toast.LENGTH_SHORT).show();
                return;
            }

            performLogin(email, password);
        });

        tvGoToRegister.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, SignupActivity.class);
            startActivity(intent);
        });
    }

    private void performLogin(String email, String password) {
        btnLogin.setEnabled(false);
        btnLogin.setText("ĐANG ĐĂNG NHẬP...");

        authViewModel.login(email, password).observe(this, response -> {
            btnLogin.setEnabled(true);
            btnLogin.setText("ĐĂNG NHẬP");
            
            if (response != null) {
                String token = response.getAccessToken();
                Log.d("AUTH", "Token received: " + token);

                SharedPreferences prefs = getSharedPreferences("app", MODE_PRIVATE);
                prefs.edit().putString("access_token", token).apply();

                ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
                apiService.getProfile().enqueue(new Callback<UserResponse>() {
                    @Override
                    public void onResponse(Call<UserResponse> call, Response<UserResponse> res) {
                        if (res.isSuccessful() && res.body() != null && res.body().getUser() != null) {
                            SharedPreferences appPrefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
                            String role = res.body().getUser().getRole();
                            appPrefs.edit()
                                    .putInt("user_id", res.body().getUser().getId())
                                    .putString("user_name", res.body().getUser().getFullName())
                                    .putString("user_email", res.body().getUser().getEmail())
                                    .putString("user_phone", res.body().getUser().getPhone())
                                    .putString("user_role", role)
                                    .apply();
                            proceedByRole(role);
                        } else {
                            proceedByRole("customer");
                        }
                    }

                    @Override
                    public void onFailure(Call<UserResponse> call, Throwable t) {
                        proceedByRole("customer");
                    }
                });

            } else {
                Toast.makeText(this, "Sai tài khoản hoặc mật khẩu!", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void proceedByRole(String role) {
        Toast.makeText(this, "Đăng nhập thành công!", Toast.LENGTH_SHORT).show();
        Intent intent;
        if ("staff".equals(role)) {
            intent = new Intent(LoginActivity.this, com.ptithcm.bus_booking_android.ui.staff.StaffScanActivity.class);
        } else {
            intent = new Intent(LoginActivity.this, MainActivity.class);
        }
        startActivity(intent);
        finish();
    }
}