package com.ptithcm.bus_booking_android.ui.passenger;

import android.os.Bundle;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.appbar.MaterialToolbar;
import com.ptithcm.bus_booking_android.R;

import java.text.DecimalFormat;
import java.util.ArrayList;

import android.widget.Toast;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.android.material.textfield.TextInputEditText;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.UserResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class PassengerInfoActivity extends AppCompatActivity {

    private MaterialToolbar topAppBar;
    private ImageView btnBack;
    private TextView tvSummary;
    private SwitchMaterial switchUseProfile;
    private TextInputEditText etFullName;
    private TextInputEditText etPhone;
    private TextInputEditText etEmail;
    private MaterialButton btnSubmit;
    
    // New Views matching the mockup
    private TextView tvTotalPrice;
    private TextView tvTotalSeatsLabel;
    private android.view.View btnToggleDetails;
    private LinearLayout layoutDetails;
    private ImageView ivChevron;

    private String fromCity = "";
    private String toCity = "";
    private String departureTime = "";
    private String arrivalTime = "";
    private int pickupStopId = -1;
    private int dropoffStopId = -1;

    private UserResponse.UserData currentUser;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_passenger_info);

        topAppBar = findViewById(R.id.topAppBar);
        btnBack = findViewById(R.id.btnBack);
        
        btnBack.setOnClickListener(v -> finish());
        topAppBar.setNavigationOnClickListener(v -> finish());

        tvSummary = findViewById(R.id.tvSummary);
        switchUseProfile = findViewById(R.id.switchUseProfile);
        etFullName = findViewById(R.id.etFullName);
        etPhone = findViewById(R.id.etPhone);
        etEmail = findViewById(R.id.etEmail);
        btnSubmit = findViewById(R.id.btnSubmit);

        tvTotalPrice = findViewById(R.id.tvTotalPrice);
        tvTotalSeatsLabel = findViewById(R.id.tvTotalSeatsLabel);
        btnToggleDetails = findViewById(R.id.btnToggleDetails);
        layoutDetails = findViewById(R.id.layoutDetails);
        ivChevron = findViewById(R.id.ivChevron);

        int tripId = getIntent().getIntExtra("trip_id", -1);
        int tripPrice = getIntent().getIntExtra("trip_price", 0);
        ArrayList<String> seatNumbers = getIntent().getStringArrayListExtra("seat_numbers");
        ArrayList<Integer> seatIds = getIntent().getIntegerArrayListExtra("seat_ids");
        String pickupName = getIntent().getStringExtra("pickup_name");
        String dropoffName = getIntent().getStringExtra("dropoff_name");
        pickupStopId = getIntent().getIntExtra("pickup_stop_id", -1);
        dropoffStopId = getIntent().getIntExtra("dropoff_stop_id", -1);
        fromCity = getIntent().getStringExtra("from");
        toCity = getIntent().getStringExtra("to");
        departureTime = getIntent().getStringExtra("departure_time");
        arrivalTime = getIntent().getStringExtra("arrival_time");

        if (seatNumbers != null) {
            String seats = String.join(", ", seatNumbers);
            
            // Format dynamic details summary
            tvSummary.setText("Chuyến: " + tripId + "\nGhế: " + seats + 
                              "\nĐón: " + pickupName + "\nTrả: " + dropoffName);
            
            // Set dynamic price and seats label
            int total = tripPrice * seatNumbers.size();
            DecimalFormat formatter = new DecimalFormat("###,###,###");
            tvTotalPrice.setText(formatter.format(total) + "đ");
            tvTotalSeatsLabel.setText("Tổng cộng (" + seatNumbers.size() + " vé)");
        }

        // Toggle details panel visibility
        btnToggleDetails.setOnClickListener(v -> {
            if (layoutDetails.getVisibility() == android.view.View.VISIBLE) {
                layoutDetails.setVisibility(android.view.View.GONE);
                ivChevron.setImageResource(R.drawable.ic_chevron_down);
            } else {
                layoutDetails.setVisibility(android.view.View.VISIBLE);
                ivChevron.setImageResource(R.drawable.ic_chevron_up);
            }
        });

        switchUseProfile.setOnCheckedChangeListener((buttonView, isChecked) -> {
            if (isChecked) {
                fetchProfileAndFill();
            } else {
                etFullName.setText("");
                etPhone.setText("");
                etEmail.setText("");
            }
        });

        btnSubmit.setOnClickListener(v -> {
            String name = etFullName.getText().toString().trim();
            String phone = etPhone.getText().toString().trim();
            String email = etEmail.getText().toString().trim();

            if (name.isEmpty() || phone.isEmpty() || email.isEmpty()) {
                Toast.makeText(this, "Vui lòng nhập đầy đủ thông tin hành khách!", Toast.LENGTH_SHORT).show();
                return;
            }

            android.content.Intent intent = new android.content.Intent(this, com.ptithcm.bus_booking_android.ui.booking.BookingConfirmationActivity.class);
            intent.putExtra("trip_id", tripId);
            intent.putExtra("trip_price", tripPrice);
            intent.putExtra("pickup_name", pickupName);
            intent.putExtra("dropoff_name", dropoffName);
            intent.putExtra("pickup_stop_id", pickupStopId);
            intent.putExtra("dropoff_stop_id", dropoffStopId);
            intent.putExtra("from", fromCity);
            intent.putExtra("to", toCity);
            intent.putExtra("departure_time", departureTime);
            intent.putExtra("arrival_time", arrivalTime);
            intent.putIntegerArrayListExtra("seat_ids", seatIds);
            intent.putStringArrayListExtra("seat_numbers", seatNumbers);
            
            intent.putExtra("passenger_name", name);
            String formattedPhone = phone;
            if (!phone.startsWith("+84")) {
                if (phone.startsWith("0")) {
                    formattedPhone = "+84 " + phone.substring(1);
                } else {
                    formattedPhone = "+84 " + phone;
                }
            }
            intent.putExtra("passenger_phone", formattedPhone);
            intent.putExtra("passenger_email", email);
            
            startActivity(intent);
        });
    }

    private void fetchProfileAndFill() {
        ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
        apiService.getProfile().enqueue(new Callback<UserResponse>() {
            @Override
            public void onResponse(Call<UserResponse> call, Response<UserResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getUser() != null) {
                    currentUser = response.body().getUser();
                    etFullName.setText(currentUser.getFullName());
                    
                    // Format phone if it has country code prefix
                    String phone = currentUser.getPhone();
                    if (phone != null) {
                        if (phone.startsWith("+84")) {
                            phone = "0" + phone.substring(3);
                        } else if (phone.startsWith("84")) {
                            phone = "0" + phone.substring(2);
                        }
                    }
                    etPhone.setText(phone);
                    etEmail.setText(currentUser.getEmail());
                } else {
                    Toast.makeText(PassengerInfoActivity.this, "Không lấy được thông tin tài khoản", Toast.LENGTH_SHORT).show();
                    switchUseProfile.setChecked(false);
                }
            }

            @Override
            public void onFailure(Call<UserResponse> call, Throwable t) {
                Toast.makeText(PassengerInfoActivity.this, "Lỗi kết nối", Toast.LENGTH_SHORT).show();
                switchUseProfile.setChecked(false);
            }
        });
    }
}

