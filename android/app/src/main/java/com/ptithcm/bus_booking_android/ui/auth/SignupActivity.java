package com.ptithcm.bus_booking_android.ui.auth;

import android.os.Bundle;
import android.util.Patterns;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;

import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.model.SignupRequest;

public class SignupActivity extends AppCompatActivity {

    private AuthViewModel authViewModel;

    private TextInputEditText edtFirstName;
    private TextInputEditText edtLastName;
    private TextInputEditText edtEmail;
    private TextInputEditText edtPhone;
    private TextInputEditText edtPassword;
    private MaterialButton btnSignup;
    private TextView tvGoToLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signup);

        authViewModel = new ViewModelProvider(this).get(AuthViewModel.class);

        edtFirstName = findViewById(R.id.edtFirstName);
        edtLastName = findViewById(R.id.edtLastName);
        edtEmail = findViewById(R.id.edtEmail);
        edtPhone = findViewById(R.id.edtPhone);
        edtPassword = findViewById(R.id.edtPassword);
        btnSignup = findViewById(R.id.btnSignup);
        tvGoToLogin = findViewById(R.id.tvGoToLogin);

        btnSignup.setOnClickListener(v -> handleSignup());

        tvGoToLogin.setOnClickListener(v -> {
            finish(); // Đóng màn hình đăng ký sẽ về lại đăng nhập
        });
    }

    private void handleSignup() {
        String ho = edtFirstName.getText().toString().trim();
        String ten = edtLastName.getText().toString().trim();
        String email = edtEmail.getText().toString().trim();
        String phone = edtPhone.getText().toString().trim();
        String password = edtPassword.getText().toString().trim();

        if (ho.isEmpty() || ten.isEmpty() || email.isEmpty() || phone.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Vui lòng nhập đầy đủ thông tin", Toast.LENGTH_SHORT).show();
            return;
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            Toast.makeText(this, "Email không hợp lệ", Toast.LENGTH_SHORT).show();
            return;
        }

        if (password.length() < 6) {
            Toast.makeText(this, "Mật khẩu phải từ 6 ký tự trở lên", Toast.LENGTH_SHORT).show();
            return;
        }

        btnSignup.setEnabled(false);
        btnSignup.setText("ĐANG ĐĂNG KÝ...");

        // Backend builds fullName as: lastName + " " + firstName
        // So we send 'ten' as firstName and 'ho' as lastName
        SignupRequest request = new SignupRequest(ten, ho, email, phone, password);

        authViewModel.register(request).observe(this, isSuccess -> {
            btnSignup.setEnabled(true);
            btnSignup.setText("Đăng ký");

            if (isSuccess != null && isSuccess) {
                Toast.makeText(this, "Đăng ký thành công! Vui lòng đăng nhập.", Toast.LENGTH_SHORT).show();
                finish();
            } else {
                Toast.makeText(this, "Đăng ký thất bại. Email/SĐT có thể đã tồn tại.", Toast.LENGTH_SHORT).show();
            }
        });
    }
}