package com.ptithcm.bus_booking_android.ui.booking;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.BookingRequest;
import com.ptithcm.bus_booking_android.data.model.BookingResponse;
import com.ptithcm.bus_booking_android.data.model.UserResponse;

import java.text.DecimalFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookingConfirmationActivity extends AppCompatActivity {

    private ImageView btnBack;
    private TextView tvRouteTitle;
    private TextView tvTripDate;
    private TextView tvDepartureTime;
    private TextView tvDepartureStation;
    private TextView tvArrivalTime;
    private TextView tvArrivalStation;
    private TextView tvSeatsList;
    private TextView tvPassengerName;
    private TextView tvPassengerPhone;
    private TextView tvPassengerEmail;
    private TextView tvFareBreakdownLabel;
    private TextView tvFareBreakdownValue;
    private TextView tvTotalBreakdownValue;
    private TextView tvSeatsCountLabel;
    private TextView tvTotalSeatsCost;
    private TextView tvFinalPrice;
    private MaterialButton btnPay;

    private int tripId = -1;
    private int tripPrice = 0;
    private ArrayList<String> seatNumbers;
    private ArrayList<Integer> seatIds;
    private String pickupName = "";
    private String dropoffName = "";
    private int pickupStopId = -1;
    private int dropoffStopId = -1;
    private String fromCity = "";
    private String toCity = "";
    private String departureTimeStr = "";
    private String arrivalTimeStr = "";
    private String passengerName = "";
    private String passengerPhone = "";
    private String passengerEmail = "";

    private int currentUserId = -1;
    private ApiService apiService;
    private com.ptithcm.bus_booking_android.ui.payment.PaymentViewModel paymentViewModel;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_confirmation);

        apiService = RetrofitClient.getClient(this).create(ApiService.class);
        setupPaymentViewModel();

        // Bind views
        btnBack = findViewById(R.id.btnBack);
        tvRouteTitle = findViewById(R.id.tvRouteTitle);
        tvTripDate = findViewById(R.id.tvTripDate);
        tvDepartureTime = findViewById(R.id.tvDepartureTime);
        tvDepartureStation = findViewById(R.id.tvDepartureStation);
        tvArrivalTime = findViewById(R.id.tvArrivalTime);
        tvArrivalStation = findViewById(R.id.tvArrivalStation);
        tvSeatsList = findViewById(R.id.tvSeatsList);
        tvPassengerName = findViewById(R.id.tvPassengerName);
        tvPassengerPhone = findViewById(R.id.tvPassengerPhone);
        tvPassengerEmail = findViewById(R.id.tvPassengerEmail);
        tvFareBreakdownLabel = findViewById(R.id.tvFareBreakdownLabel);
        tvFareBreakdownValue = findViewById(R.id.tvFareBreakdownValue);
        tvTotalBreakdownValue = findViewById(R.id.tvTotalBreakdownValue);
        tvSeatsCountLabel = findViewById(R.id.tvSeatsCountLabel);
        tvTotalSeatsCost = findViewById(R.id.tvTotalSeatsCost);
        tvFinalPrice = findViewById(R.id.tvFinalPrice);
        btnPay = findViewById(R.id.btnPay);

        // Retrieve intent extras
        tripId = getIntent().getIntExtra("trip_id", -1);
        tripPrice = getIntent().getIntExtra("trip_price", 0);
        seatNumbers = getIntent().getStringArrayListExtra("seat_numbers");
        seatIds = getIntent().getIntegerArrayListExtra("seat_ids");
        pickupName = getIntent().getStringExtra("pickup_name");
        dropoffName = getIntent().getStringExtra("dropoff_name");
        pickupStopId = getIntent().getIntExtra("pickup_stop_id", -1);
        dropoffStopId = getIntent().getIntExtra("dropoff_stop_id", -1);
        fromCity = getIntent().getStringExtra("from");
        toCity = getIntent().getStringExtra("to");
        departureTimeStr = getIntent().getStringExtra("departure_time");
        arrivalTimeStr = getIntent().getStringExtra("arrival_time");
        passengerName = getIntent().getStringExtra("passenger_name");
        passengerPhone = getIntent().getStringExtra("passenger_phone");
        passengerEmail = getIntent().getStringExtra("passenger_email");

        // Back action
        btnBack.setOnClickListener(v -> finish());

        // Fill views
        setupUI();

        // Fetch User Profile to get userId
        fetchUserProfile();

        // Pay action
        btnPay.setOnClickListener(v -> {
            if (currentUserId == -1) {
                Toast.makeText(this, "Đang tải thông tin tài khoản. Vui lòng thử lại sau!", Toast.LENGTH_SHORT).show();
                fetchUserProfile();
                return;
            }
            executeBooking();
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && intent.getData() != null && "greenbus".equals(intent.getData().getScheme())) {
            String status = intent.getData().getQueryParameter("status");
            String returnedBookingId = intent.getData().getQueryParameter("bookingId");
            
            if ("success".equals(status)) {
                Toast.makeText(this, "Thanh toán thành công!", Toast.LENGTH_SHORT).show();
                
                // Navigate to Success Screen
                Intent successIntent = new Intent(this, BookingSuccessActivity.class);
                successIntent.putExtra("booking_code", "GB-" + returnedBookingId + "-VN");
                successIntent.putExtra("from", fromCity);
                successIntent.putExtra("to", toCity);
                successIntent.putExtra("departure_time", formatTime(departureTimeStr));
                successIntent.putExtra("departure_date", formatDate(departureTimeStr));
                successIntent.putExtra("seats", String.join(", ", seatNumbers));
                
                DecimalFormat formatter = new DecimalFormat("###,###,###");
                int totalAmount = tripPrice * (seatNumbers != null ? seatNumbers.size() : 0);
                successIntent.putExtra("total_price", formatter.format(totalAmount) + "đ");

                startActivity(successIntent);
                finish();
            } else {
                // Navigate to Error Screen
                Intent errorIntent = new Intent(this, BookingErrorActivity.class);
                errorIntent.putExtra("error_message", "Giao dịch đã bị huỷ hoặc có lỗi xảy ra trong quá trình thanh toán qua VNPay.");
                startActivity(errorIntent);

                btnPay.setEnabled(true);
                btnPay.setText("Thanh toán ngay");
            }
        }
    }

    private void setupUI() {
        tvRouteTitle.setText(fromCity + " → " + toCity);
        
        // Format Dates & Times
        String depTime = formatTime(departureTimeStr);
        String arrTime = formatTime(arrivalTimeStr);
        String tripDate = formatDate(departureTimeStr);
        
        tvTripDate.setText(tripDate);
        tvDepartureTime.setText(depTime);
        tvDepartureStation.setText(pickupName != null && !pickupName.isEmpty() ? pickupName : "Trạm đón mặc định");
        tvArrivalTime.setText(arrTime);
        tvArrivalStation.setText(dropoffName != null && !dropoffName.isEmpty() ? dropoffName : "Trạm trả mặc định");

        // Seat Info
        String seats = "";
        if (seatNumbers != null) {
            seats = String.join(", ", seatNumbers);
        }
        tvSeatsList.setText("Ghế: " + seats);

        // Passenger Info
        tvPassengerName.setText(passengerName);
        tvPassengerPhone.setText(passengerPhone);
        tvPassengerEmail.setText(passengerEmail);

        // Calculate and Format Pricing
        int seatsCount = seatNumbers != null ? seatNumbers.size() : 0;
        int totalAmount = tripPrice * seatsCount;
        DecimalFormat formatter = new DecimalFormat("###,###,###");
        String formattedPrice = formatter.format(totalAmount) + "đ";

        tvFareBreakdownLabel.setText("Giá vé (x" + seatsCount + ")");
        tvFareBreakdownValue.setText(formatter.format(tripPrice * seatsCount) + "đ");
        tvTotalBreakdownValue.setText(formattedPrice);

        tvSeatsCountLabel.setText(String.format(Locale.getDefault(), "%02d Vé Người lớn", seatsCount));
        tvTotalSeatsCost.setText(formattedPrice);
        tvFinalPrice.setText(formattedPrice);
    }

    private void fetchUserProfile() {
        apiService.getProfile().enqueue(new Callback<UserResponse>() {
            @Override
            public void onResponse(@NonNull Call<UserResponse> call, @NonNull Response<UserResponse> response) {
                if (response.isSuccessful() && response.body() != null && response.body().getUser() != null) {
                    currentUserId = response.body().getUser().getId();
                } else {
                    Toast.makeText(BookingConfirmationActivity.this, "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<UserResponse> call, @NonNull Throwable t) {
                Toast.makeText(BookingConfirmationActivity.this, "Lỗi tải thông tin người dùng", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupPaymentViewModel() {
        com.ptithcm.bus_booking_android.data.repository.PaymentRepository repository = 
            new com.ptithcm.bus_booking_android.data.repository.PaymentRepository(apiService);
        com.ptithcm.bus_booking_android.ui.payment.PaymentViewModelFactory factory = 
            new com.ptithcm.bus_booking_android.ui.payment.PaymentViewModelFactory(repository);
        paymentViewModel = new androidx.lifecycle.ViewModelProvider(this, factory).get(com.ptithcm.bus_booking_android.ui.payment.PaymentViewModel.class);

        paymentViewModel.getPaymentUrlLiveData().observe(this, url -> {
            androidx.browser.customtabs.CustomTabsIntent intent = new androidx.browser.customtabs.CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build();
            intent.launchUrl(BookingConfirmationActivity.this, android.net.Uri.parse(url));
        });

        paymentViewModel.getErrorLiveData().observe(this, error -> {
            Intent errorIntent = new Intent(this, BookingErrorActivity.class);
            errorIntent.putExtra("error_message", error);
            startActivity(errorIntent);

            btnPay.setEnabled(true);
            btnPay.setText("Thanh toán ngay");
        });
        
        paymentViewModel.getLoadingLiveData().observe(this, isLoading -> {
            if (isLoading) {
                btnPay.setEnabled(false);
                btnPay.setText("Đang chuyển hướng VNPAY...");
            }
        });
    }

    private void executeBooking() {
        btnPay.setEnabled(false);
        btnPay.setText("Đang xử lý...");

        // Construct Tickets list
        List<BookingRequest.TicketRequest> tickets = new ArrayList<>();
        if (seatIds != null) {
            for (int i = 0; i < seatIds.size(); i++) {
                int seatId = seatIds.get(i);
                Integer pId = pickupStopId > 0 ? pickupStopId : null;
                Integer dId = dropoffStopId > 0 ? dropoffStopId : null;
                tickets.add(new BookingRequest.TicketRequest(seatId, passengerName, passengerPhone, passengerEmail, pId, dId));
            }
        }

        int totalAmount = tripPrice * (seatNumbers != null ? seatNumbers.size() : 0);
        BookingRequest request = new BookingRequest(currentUserId, tripId, totalAmount, passengerEmail, passengerName, tickets);

        apiService.createBooking(request).enqueue(new Callback<BookingResponse>() {
            @Override
            public void onResponse(@NonNull Call<BookingResponse> call, @NonNull Response<BookingResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    BookingResponse.BookingData data = response.body().getData();
                    if (data != null) {
                        // Gọi PaymentViewModel để tạo URL VNPAY
                        paymentViewModel.createPaymentUrl(data.getId(), totalAmount);
                    }
                } else {
                    btnPay.setEnabled(true);
                    btnPay.setText("Thanh toán ngay");
                    String errorMsg = "Giao dịch thất bại. Vui lòng kiểm tra lại!";
                    try {
                        if (response.errorBody() != null) {
                            String errStr = response.errorBody().string();
                            if (errStr.contains("message")) {
                                int start = errStr.indexOf("\"message\":\"") + 11;
                                int end = errStr.indexOf("\"", start);
                                if (start > 10 && end > start) {
                                    errorMsg = errStr.substring(start, end);
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                    
                    Intent errorIntent = new Intent(BookingConfirmationActivity.this, BookingErrorActivity.class);
                    errorIntent.putExtra("error_message", errorMsg);
                    startActivity(errorIntent);
                }
            }

            @Override
            public void onFailure(@NonNull Call<BookingResponse> call, @NonNull Throwable t) {
                btnPay.setEnabled(true);
                btnPay.setText("Thanh toán ngay");
                
                Intent errorIntent = new Intent(BookingConfirmationActivity.this, BookingErrorActivity.class);
                errorIntent.putExtra("error_message", "Lỗi kết nối máy chủ! Vui lòng thử lại sau.");
                startActivity(errorIntent);
            }
        });
    }

    private String formatTime(String isoString) {
        if (isoString == null) return "--:--";
        try {
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            Date date = isoFormat.parse(isoString);
            if (date == null) return isoString;
            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
            return timeFormat.format(date);
        } catch (ParseException e) {
            try {
                SimpleDateFormat isoFormat2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault());
                Date date = isoFormat2.parse(isoString);
                if (date == null) return isoString;
                SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
                return timeFormat.format(date);
            } catch (ParseException ex) {
                return isoString;
            }
        }
    }

    private String formatDate(String isoString) {
        if (isoString == null) return "";
        try {
            SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            Date date = isoFormat.parse(isoString);
            if (date == null) return isoString;
            SimpleDateFormat dateFormat = new SimpleDateFormat("dd 'Tháng' MM, yyyy", Locale.getDefault());
            return dateFormat.format(date);
        } catch (ParseException e) {
            try {
                SimpleDateFormat isoFormat2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault());
                Date date = isoFormat2.parse(isoString);
                if (date == null) return isoString;
                SimpleDateFormat dateFormat = new SimpleDateFormat("dd 'Tháng' MM, yyyy", Locale.getDefault());
                return dateFormat.format(date);
            } catch (ParseException ex) {
                return isoString;
            }
        }
    }
}
