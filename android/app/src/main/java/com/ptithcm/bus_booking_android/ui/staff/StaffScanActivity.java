package com.ptithcm.bus_booking_android.ui.staff;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.core.content.ContextCompat;
import android.text.TextUtils;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.app.AppCompatDelegate;

import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.android.material.textfield.TextInputEditText;
import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.MessageResponse;
import com.ptithcm.bus_booking_android.data.model.TicketCheckResponse;
import com.ptithcm.bus_booking_android.data.model.StaffTripResponse;
import com.ptithcm.bus_booking_android.ui.auth.LoginActivity;

import java.util.ArrayList;
import java.util.List;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class StaffScanActivity extends AppCompatActivity {

    // Views
    private TextInputEditText edtQrCode;
    private MaterialButton btnScanQr, btnSearch, btnCheckIn, btnViewManifest;
    private Spinner spinnerTrips;
    private ProgressBar progressBar;
    private androidx.cardview.widget.CardView cardResult;
    private LinearLayout layoutEmpty, layoutAlreadyChecked, layoutCancelled, layoutStops, layoutStaffHeader;
    private View viewStatusBar;

    private TextView tvStaffName, tvTicketCode, tvPassengerName, tvPassengerPhone;
    private TextView tvStatusBadge, tvRoute, tvDepartureTime, tvSeatNumber, tvBookingId;
    private TextView tvPickup, tvDropoff;

    // State
    private ApiService apiService;
    private TicketCheckResponse.TicketData currentTicket = null;
    private List<StaffTripResponse> tripList = new ArrayList<>();
    private int selectedTripId = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_staff_scan);

        apiService = RetrofitClient.getClient(this).create(ApiService.class);
        initViews();
        loadStaffInfo();
        loadTrips();
        setupListeners();
    }

    private void initViews() {
        edtQrCode          = findViewById(R.id.edtQrCode);
        btnScanQr          = findViewById(R.id.btnScanQr);
        btnSearch          = findViewById(R.id.btnSearch);
        btnCheckIn         = findViewById(R.id.btnCheckIn);
        btnViewManifest    = findViewById(R.id.btnViewManifest);
        spinnerTrips       = findViewById(R.id.spinnerTrips);
        progressBar        = findViewById(R.id.progressBar);
        cardResult         = findViewById(R.id.cardResult);
        layoutEmpty        = findViewById(R.id.layoutEmpty);
        layoutAlreadyChecked = findViewById(R.id.layoutAlreadyChecked);
        layoutCancelled    = findViewById(R.id.layoutCancelled);
        layoutStops        = findViewById(R.id.layoutStops);
        layoutStaffHeader  = findViewById(R.id.layoutStaffHeader);
        viewStatusBar      = findViewById(R.id.viewStatusBar);

        tvStaffName        = findViewById(R.id.tvStaffName);
        tvTicketCode       = findViewById(R.id.tvTicketCode);
        tvPassengerName    = findViewById(R.id.tvPassengerName);
        tvPassengerPhone   = findViewById(R.id.tvPassengerPhone);
        tvStatusBadge      = findViewById(R.id.tvStatusBadge);
        tvRoute            = findViewById(R.id.tvRoute);
        tvDepartureTime    = findViewById(R.id.tvDepartureTime);
        tvSeatNumber       = findViewById(R.id.tvSeatNumber);
        tvBookingId        = findViewById(R.id.tvBookingId);
        tvPickup           = findViewById(R.id.tvPickup);
        tvDropoff          = findViewById(R.id.tvDropoff);
    }

    private void loadStaffInfo() {
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        String name = prefs.getString("user_name", "Nhân viên");
        tvStaffName.setText(name);
    }

    private void loadTrips() {
        apiService.getAllTrips().enqueue(new Callback<List<StaffTripResponse>>() {
            @Override
            public void onResponse(Call<List<StaffTripResponse>> call, Response<List<StaffTripResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<StaffTripResponse> allTrips = response.body();
                    tripList = new ArrayList<>();
                    List<String> tripNames = new ArrayList<>();
                    tripNames.add("— Vui lòng chọn chuyến xe —"); // Thêm dòng placeholder
                    
                    for (StaffTripResponse trip : allTrips) {
                        tripList.add(trip); // Lưu lại chuyến hợp lệ

                        String from = trip.getRoute() != null ? trip.getRoute().getDepartureLocation() : "—";
                        String to = trip.getRoute() != null ? trip.getRoute().getArrivalLocation() : "—";
                        
                        // Định dạng ngắn gọn dễ nhìn: [Giờ - Ngày] Từ ➔ Đến (Mã chuyến)
                        String shortDate = formatDateTimeShort(trip.getDepartureTime());
                        String name = "[" + shortDate + "] " + from + " ➔ " + to + " (Mã: " + trip.getId() + ")";
                        tripNames.add(name);
                    }
                    ArrayAdapter<String> adapter = new ArrayAdapter<>(StaffScanActivity.this, android.R.layout.simple_spinner_item, tripNames);
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
                    spinnerTrips.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<List<StaffTripResponse>> call, Throwable t) {
                Toast.makeText(StaffScanActivity.this, "Không thể tải danh sách chuyến xe", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupListeners() {
        // Camera QR scan
        btnScanQr.setOnClickListener(v -> {
            IntentIntegrator integrator = new IntentIntegrator(this);
            integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE);
            integrator.setPrompt("Hướng camera vào mã QR của vé");
            integrator.setCameraId(0);
            integrator.setBeepEnabled(true);
            integrator.setBarcodeImageEnabled(false);
            integrator.setOrientationLocked(false);
            integrator.initiateScan();
        });

        // Manual search
        btnSearch.setOnClickListener(v -> {
            String code = edtQrCode.getText() != null ? edtQrCode.getText().toString().trim() : "";
            if (TextUtils.isEmpty(code)) {
                Toast.makeText(this, "Vui lòng nhập mã QR hoặc mã số vé!", Toast.LENGTH_SHORT).show();
                return;
            }
            hideKeyboard();
            searchTicket(code);
        });

        // IME search action
        edtQrCode.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                btnSearch.performClick();
                return true;
            }
            return false;
        });

        // Check-in button
        btnCheckIn.setOnClickListener(v -> {
            if (currentTicket != null) {
                performCheckIn(currentTicket.getId());
            }
        });

        // Header click -> Show Bottom Sheet
        layoutStaffHeader.setOnClickListener(v -> showStaffMenuSheet());

        // Click-to-call
        tvPassengerPhone.setOnClickListener(v -> {
            String phoneText = tvPassengerPhone.getText().toString().replace("📞 ", "").trim();
            if (!phoneText.isEmpty() && !phoneText.equals("—")) {
                Intent intent = new Intent(Intent.ACTION_DIAL);
                intent.setData(android.net.Uri.parse("tel:" + phoneText));
                startActivity(intent);
            }
        });

        // View Boarding Manifest
        btnViewManifest.setOnClickListener(v -> {
            int pos = spinnerTrips.getSelectedItemPosition();
            if (pos > 0 && pos <= tripList.size()) {
                int tripId = tripList.get(pos - 1).getId(); // Trừ 1 vì index 0 là placeholder
                Intent intent = new Intent(this, BoardingManifestActivity.class);
                intent.putExtra("trip_id", tripId);
                startActivity(intent);
            } else {
                Toast.makeText(this, "Vui lòng chọn chuyến xe trước", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showStaffMenuSheet() {
        BottomSheetDialog bottomSheetDialog = new BottomSheetDialog(this);
        View sheetView = getLayoutInflater().inflate(R.layout.layout_staff_menu_bottom_sheet, null);
        bottomSheetDialog.setContentView(sheetView);

        // Bind views
        TextView tvSheetStaffName = sheetView.findViewById(R.id.tvSheetStaffName);
        LinearLayout menuViewProfile = sheetView.findViewById(R.id.menuViewProfile);
        LinearLayout menuSheetTheme = sheetView.findViewById(R.id.menuSheetTheme);
        SwitchMaterial switchSheetDarkMode = sheetView.findViewById(R.id.switchSheetDarkMode);
        LinearLayout menuSheetLogout = sheetView.findViewById(R.id.menuSheetLogout);

        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        tvSheetStaffName.setText(prefs.getString("user_name", "Nhân viên"));
        
        boolean isDarkMode = prefs.getBoolean("dark_mode", false);
        switchSheetDarkMode.setChecked(isDarkMode);

        menuViewProfile.setOnClickListener(v -> {
            bottomSheetDialog.dismiss();
            startActivity(new Intent(this, StaffProfileActivity.class));
        });

        switchSheetDarkMode.setOnCheckedChangeListener((buttonView, isChecked) -> {
            prefs.edit().putBoolean("dark_mode", isChecked).apply();
            if (isChecked) {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
            }
        });

        menuSheetTheme.setOnClickListener(v -> {
            switchSheetDarkMode.setChecked(!switchSheetDarkMode.isChecked());
        });

        menuSheetLogout.setOnClickListener(v -> {
            bottomSheetDialog.dismiss();
            getSharedPreferences("app", MODE_PRIVATE).edit().remove("access_token").apply();
            getSharedPreferences("app_prefs", MODE_PRIVATE).edit().clear().apply();
            Intent intent = new Intent(this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });

        bottomSheetDialog.show();
    }

    // ─── QR Scanner result ───────────────────────────────────────────────────────
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            String contents = result.getContents();
            if (contents != null) {
                edtQrCode.setText(contents);
                searchTicket(contents);
            } else {
                Toast.makeText(this, "Không đọc được mã QR", Toast.LENGTH_SHORT).show();
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    // ─── API: Search ticket ───────────────────────────────────────────────────────
    private void searchTicket(String qrCode) {
        showLoading(true);
        currentTicket = null;

        apiService.checkTicketByQr(qrCode).enqueue(new Callback<TicketCheckResponse>() {
            @Override
            public void onResponse(Call<TicketCheckResponse> call, Response<TicketCheckResponse> response) {
                showLoading(false);
                if (response.isSuccessful() && response.body() != null && response.body().getTicket() != null) {
                    currentTicket = response.body().getTicket();
                    showTicketResult(currentTicket);
                } else {
                    Toast.makeText(StaffScanActivity.this, "Không tìm thấy vé. Kiểm tra lại mã!", Toast.LENGTH_LONG).show();
                    showEmpty();
                }
            }

            @Override
            public void onFailure(Call<TicketCheckResponse> call, Throwable t) {
                showLoading(false);
                Toast.makeText(StaffScanActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                showEmpty();
            }
        });
    }

    // ─── API: Check-in ────────────────────────────────────────────────────────────
    private void performCheckIn(int ticketId) {
        btnCheckIn.setEnabled(false);
        btnCheckIn.setText("Đang xử lý...");

        apiService.checkInTicket(ticketId).enqueue(new Callback<MessageResponse>() {
            @Override
            public void onResponse(Call<MessageResponse> call, Response<MessageResponse> response) {
                btnCheckIn.setEnabled(true);
                btnCheckIn.setText("✓  Xác nhận hành khách lên xe");

                if (response.isSuccessful()) {
                    Toast.makeText(StaffScanActivity.this, "✅ Check-in thành công! Hành khách đã lên xe.", Toast.LENGTH_LONG).show();
                    // Update local state
                    if (currentTicket != null) {
                        // Rebuild card with "used" status
                        showTicketAsCheckedIn();
                    }
                } else if (response.code() == 409) {
                    Toast.makeText(StaffScanActivity.this, "Vé này đã được check-in trước đó!", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(StaffScanActivity.this, "Check-in thất bại. Vui lòng thử lại.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<MessageResponse> call, Throwable t) {
                btnCheckIn.setEnabled(true);
                btnCheckIn.setText("✓  Xác nhận hành khách lên xe");
                Toast.makeText(StaffScanActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ─── UI Updates ───────────────────────────────────────────────────────────────
    private void showTicketResult(TicketCheckResponse.TicketData ticket) {
        layoutEmpty.setVisibility(View.GONE);
        cardResult.setVisibility(View.VISIBLE);

        // Ticket code & passenger
        tvTicketCode.setText("MÃ VÉ: " + ticket.getQrCode());
        tvPassengerName.setText(ticket.getPassengerName() != null ? ticket.getPassengerName() : "Không có tên");
        tvPassengerPhone.setText("📞 " + (ticket.getPassengerPhone() != null ? ticket.getPassengerPhone() : "—"));

        // Seat & booking
        tvSeatNumber.setText(ticket.getSeatNumber() != null ? ticket.getSeatNumber() : "—");
        if (ticket.getBooking() != null) {
            tvBookingId.setText("Đơn #" + ticket.getBooking().getId());
            if (ticket.getBooking().getRoute() != null) {
                String from = ticket.getBooking().getRoute().getDepartureLocation();
                String to = ticket.getBooking().getRoute().getArrivalLocation();
                tvRoute.setText(from + " ➔ " + to);
            } else {
                tvRoute.setText("Chuyến #" + ticket.getBooking().getTripId());
            }
            tvDepartureTime.setText(formatDateTime(ticket.getBooking().getDepartureTime()));
        }

        // Pickup / Dropoff stops
        if (ticket.getPickupStop() != null || ticket.getDropoffStop() != null) {
            layoutStops.setVisibility(View.VISIBLE);
            String pickup = ticket.getPickupStop() != null ? ticket.getPickupStop().getName() : "Bến xe đi";
            String dropoff = ticket.getDropoffStop() != null ? ticket.getDropoffStop().getName() : "Bến xe đến";
            tvPickup.setText("🟢 Điểm đón: " + pickup);
            tvDropoff.setText("🔴 Điểm trả: " + dropoff);
        } else {
            layoutStops.setVisibility(View.GONE);
        }

        // Status
        applyStatus(ticket.getStatus());
    }

    private void applyStatus(String status) {
        btnCheckIn.setVisibility(View.GONE);
        layoutAlreadyChecked.setVisibility(View.GONE);
        layoutCancelled.setVisibility(View.GONE);

        switch (status) {
            case "unused":
                viewStatusBar.setBackgroundColor(ContextCompat.getColor(this, R.color.status_warning_text)); // amber
                tvStatusBadge.setText("Chưa lên xe");
                tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_warning_text));
                tvStatusBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.status_warning_bg));
                btnCheckIn.setVisibility(View.VISIBLE);
                break;
            case "used":
                showTicketAsCheckedIn();
                break;
            case "cancelled":
                viewStatusBar.setBackgroundColor(ContextCompat.getColor(this, R.color.status_error_text)); // red
                tvStatusBadge.setText("Vé đã hủy");
                tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_error_text));
                tvStatusBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.status_error_bg));
                layoutCancelled.setVisibility(View.VISIBLE);
                break;
            default:
                viewStatusBar.setBackgroundColor(ContextCompat.getColor(this, R.color.status_neutral_text));
                tvStatusBadge.setText(status);
                break;
        }
    }

    private void showTicketAsCheckedIn() {
        viewStatusBar.setBackgroundColor(ContextCompat.getColor(this, R.color.status_success_text)); // green
        tvStatusBadge.setText("Đã lên xe ✓");
        tvStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.status_success_text));
        tvStatusBadge.setBackgroundColor(ContextCompat.getColor(this, R.color.status_success_bg));
        btnCheckIn.setVisibility(View.GONE);
        layoutAlreadyChecked.setVisibility(View.VISIBLE);
    }

    private void showLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        btnSearch.setEnabled(!loading);
        btnScanQr.setEnabled(!loading);
        if (loading) {
            cardResult.setVisibility(View.GONE);
            layoutEmpty.setVisibility(View.GONE);
        }
    }

    private void showEmpty() {
        cardResult.setVisibility(View.GONE);
        layoutEmpty.setVisibility(View.VISIBLE);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────
    private String formatDateTime(String raw) {
        if (raw == null) return "—";
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            SimpleDateFormat output = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault());
            Date d = input.parse(raw);
            return d != null ? output.format(d) : raw;
        } catch (ParseException e) {
            return raw;
        }
    }

    private String formatDateTimeShort(String raw) {
        if (raw == null) return "—";
        try {
            SimpleDateFormat input = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
            SimpleDateFormat output = new SimpleDateFormat("HH:mm - dd/MM", Locale.getDefault());
            Date d = input.parse(raw);
            return d != null ? output.format(d) : raw;
        } catch (ParseException e) {
            return raw;
        }
    }

    private void hideKeyboard() {
        InputMethodManager imm = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE);
        View v = getCurrentFocus();
        if (imm != null && v != null) {
            imm.hideSoftInputFromWindow(v.getWindowToken(), 0);
        }
    }
}
