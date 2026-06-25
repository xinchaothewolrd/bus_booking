package com.ptithcm.bus_booking_android.ui.history;

import android.os.Bundle;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.google.android.material.button.MaterialButton;
import com.ptithcm.bus_booking_android.R;

import android.graphics.Bitmap;
import android.graphics.Color;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;

import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.MessageResponse;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TicketDetailsActivity extends AppCompatActivity {

    private TextView tvTicketCode, tvPassenger, tvSeat, tvTotalAmount;
    private TextView tvDepartureLocation, tvArrivalLocation, tvBookingTime, tvDepartureTime;
    private TextView tvCancelledMessage;
    private MaterialButton btnCallSupport, btnCancelTicket;
    private ImageView ivQrCode;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ticket_details);

        Toolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setNavigationOnClickListener(v -> finish());

        tvTicketCode = findViewById(R.id.tvTicketCode);
        tvDepartureLocation = findViewById(R.id.tvDepartureLocation);
        tvArrivalLocation = findViewById(R.id.tvArrivalLocation);
        tvBookingTime = findViewById(R.id.tvBookingTime);
        tvDepartureTime = findViewById(R.id.tvDepartureTime);
        tvPassenger = findViewById(R.id.tvPassenger);
        tvSeat = findViewById(R.id.tvSeat);
        tvTotalAmount = findViewById(R.id.tvTotalAmount);
        btnCallSupport = findViewById(R.id.btnCallSupport);
        btnCancelTicket = findViewById(R.id.btnCancelTicket);
        tvCancelledMessage = findViewById(R.id.tvCancelledMessage);
        ivQrCode = findViewById(R.id.ivQrCode);

        // Fetch data from intent
        int bookingId = getIntent().getIntExtra("booking_id", -1);
        String code = getIntent().getStringExtra("ticket_code");
        String departureLoc = getIntent().getStringExtra("departure_loc");
        String arrivalLoc = getIntent().getStringExtra("arrival_loc");
        String bookingTime = getIntent().getStringExtra("booking_time");
        String departureTime = getIntent().getStringExtra("departure_time");
        String passengerName = getIntent().getStringExtra("passenger_name");
        String seatNumber = getIntent().getStringExtra("seat_number");
        int totalAmount = getIntent().getIntExtra("total_amount", 0);
        String ticketStatus = getIntent().getStringExtra("ticket_status");

        if (code != null) {
            tvTicketCode.setText(code);
            generateQrCode(code);
        }
        if (departureLoc != null) tvDepartureLocation.setText("Điểm đi: " + departureLoc);
        if (arrivalLoc != null) tvArrivalLocation.setText("Điểm đến: " + arrivalLoc);
        if (bookingTime != null) tvBookingTime.setText("Thời gian đặt vé: " + bookingTime);
        if (departureTime != null) tvDepartureTime.setText("Khởi hành: " + departureTime);
        if (passengerName != null) tvPassenger.setText("Hành khách: " + passengerName);
        if (seatNumber != null) tvSeat.setText("Ghế: " + seatNumber);
        
        java.text.NumberFormat format = java.text.NumberFormat.getCurrencyInstance(new java.util.Locale("vi", "VN"));
        tvTotalAmount.setText(format.format(totalAmount));

        if ("Đã hủy".equals(ticketStatus)) {
            btnCallSupport.setVisibility(android.view.View.GONE);
            btnCancelTicket.setVisibility(android.view.View.GONE);
            tvCancelledMessage.setVisibility(android.view.View.VISIBLE);
        }

        btnCallSupport.setOnClickListener(v -> {
            Toast.makeText(this, "Đang gọi tổng đài...", Toast.LENGTH_SHORT).show();
        });

        btnCancelTicket.setOnClickListener(v -> {
            if (bookingId == -1) {
                Toast.makeText(this, "Lỗi: Không tìm thấy ID đặt vé", Toast.LENGTH_SHORT).show();
                return;
            }
            Toast.makeText(this, "Đang xử lý hủy vé...", Toast.LENGTH_SHORT).show();
            ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
            apiService.cancelBooking(bookingId).enqueue(new Callback<MessageResponse>() {
                @Override
                public void onResponse(Call<MessageResponse> call, Response<MessageResponse> response) {
                    if (response.isSuccessful() && response.body() != null) {
                        Toast.makeText(TicketDetailsActivity.this, response.body().getMessage(), Toast.LENGTH_LONG).show();
                        btnCallSupport.setVisibility(android.view.View.GONE);
                        btnCancelTicket.setVisibility(android.view.View.GONE);
                        tvCancelledMessage.setVisibility(android.view.View.VISIBLE);
                    } else {
                        Toast.makeText(TicketDetailsActivity.this, "Không thể hủy vé (có thể đã sát giờ đi hoặc lỗi kết nối).", Toast.LENGTH_LONG).show();
                    }
                }

                @Override
                public void onFailure(Call<MessageResponse> call, Throwable t) {
                    Toast.makeText(TicketDetailsActivity.this, "Lỗi kết nối", Toast.LENGTH_SHORT).show();
                }
            });
        });
    }

    private void generateQrCode(String data) {
        MultiFormatWriter writer = new MultiFormatWriter();
        try {
            BitMatrix bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, 512, 512);
            int width = bitMatrix.getWidth();
            int height = bitMatrix.getHeight();
            Bitmap bmp = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
            for (int x = 0; x < width; x++) {
                for (int y = 0; y < height; y++) {
                    bmp.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }
            ivQrCode.setImageBitmap(bmp);
        } catch (WriterException e) {
            e.printStackTrace();
        }
    }
}
