package com.ptithcm.bus_booking_android.ui.booking;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.ptithcm.bus_booking_android.MainActivity;
import com.ptithcm.bus_booking_android.R;

public class BookingErrorActivity extends AppCompatActivity {

    private TextView tvErrorMessage;
    private MaterialButton btnRetryPayment;
    private MaterialButton btnGoHome;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_error);

        // Bind views
        tvErrorMessage = findViewById(R.id.tvErrorMessage);
        btnRetryPayment = findViewById(R.id.btnRetryPayment);
        btnGoHome = findViewById(R.id.btnGoHome);

        // Get extras from Intent
        String errorMessage = getIntent().getStringExtra("error_message");
        if (errorMessage != null && !errorMessage.isEmpty()) {
            tvErrorMessage.setText(errorMessage);
        }

        // Button actions
        btnRetryPayment.setOnClickListener(v -> {
            // Finish this activity to go back to BookingConfirmationActivity
            finish();
        });

        btnGoHome.setOnClickListener(v -> {
            Intent intent = new Intent(BookingErrorActivity.this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });
    }
}
