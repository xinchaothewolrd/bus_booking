package com.ptithcm.bus_booking_android.ui.booking;

import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.ptithcm.bus_booking_android.MainActivity;
import com.ptithcm.bus_booking_android.R;

public class BookingSuccessActivity extends AppCompatActivity {

    private TextView tvBookingCode;
    private TextView tvStartCity;
    private TextView tvEndCity;
    private TextView tvDateLabel;
    private TextView tvTimeLabel;
    private TextView tvSeatsLabel;
    private TextView tvPriceLabel;
    private MaterialButton btnViewTickets;
    private MaterialButton btnGoHome;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_success);

        // Bind views
        tvBookingCode = findViewById(R.id.tvBookingCode);
        tvStartCity = findViewById(R.id.tvStartCity);
        tvEndCity = findViewById(R.id.tvEndCity);
        tvDateLabel = findViewById(R.id.tvDateLabel);
        tvTimeLabel = findViewById(R.id.tvTimeLabel);
        tvSeatsLabel = findViewById(R.id.tvSeatsLabel);
        tvPriceLabel = findViewById(R.id.tvPriceLabel);
        btnViewTickets = findViewById(R.id.btnViewTickets);
        btnGoHome = findViewById(R.id.btnGoHome);

        // Get extras from Intent
        String bookingCode = getIntent().getStringExtra("booking_code");
        String from = getIntent().getStringExtra("from");
        String to = getIntent().getStringExtra("to");
        String date = getIntent().getStringExtra("departure_date");
        String time = getIntent().getStringExtra("departure_time");
        String seats = getIntent().getStringExtra("seats");
        String price = getIntent().getStringExtra("total_price");

        // Display data
        tvBookingCode.setText(bookingCode != null ? bookingCode : "");
        tvStartCity.setText(from != null ? from : "");
        tvEndCity.setText(to != null ? to : "");
        tvDateLabel.setText(date != null ? date : "");
        tvTimeLabel.setText(time != null ? time : "");
        tvSeatsLabel.setText("Ghế: " + (seats != null ? seats : ""));
        tvPriceLabel.setText(price != null ? price : "");

        // Button actions
        btnViewTickets.setOnClickListener(v -> {
            Toast.makeText(this, "Vé của bạn sẽ sớm được hiển thị trong hòm thư hoặc lịch sử!", Toast.LENGTH_LONG).show();
            goHome();
        });

        btnGoHome.setOnClickListener(v -> goHome());
    }

    private void goHome() {
        Intent intent = new Intent(BookingSuccessActivity.this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
