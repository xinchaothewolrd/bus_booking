package com.ptithcm.bus_booking_android;

import android.content.Intent;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.datepicker.CalendarConstraints;
import com.google.android.material.datepicker.DateValidatorPointForward;
import com.google.android.material.datepicker.MaterialDatePicker;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.ptithcm.bus_booking_android.data.model.RouteResponse;
import com.ptithcm.bus_booking_android.ui.home.HomeViewModel;
import com.ptithcm.bus_booking_android.ui.trip.TripListActivity;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.ptithcm.bus_booking_android.ui.profile.ProfileActivity;
import com.ptithcm.bus_booking_android.ui.history.BookingHistoryActivity;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

public class MainActivity extends AppCompatActivity {

    private HomeViewModel homeViewModel;
    private List<String> locationsList = new ArrayList<>();

    private LinearLayout llOrigin, llDestination, llDate;
    private TextView tvOrigin, tvDestination, tvDate;
    private FloatingActionButton btnSwap;
    private MaterialButton btnSearch;
    private com.google.android.material.appbar.MaterialToolbar topAppBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        initViews();
        setupViewModel();
        setupListeners();
    }

    private void initViews() {
        llOrigin = findViewById(R.id.llOrigin);
        llDestination = findViewById(R.id.llDestination);
        llDate = findViewById(R.id.llDate);
        
        tvOrigin = findViewById(R.id.tvOrigin);
        tvDestination = findViewById(R.id.tvDestination);
        tvDate = findViewById(R.id.tvDate);
        
        btnSwap = findViewById(R.id.btnSwap);
        btnSearch = findViewById(R.id.btnSearch);
        topAppBar = findViewById(R.id.topAppBar);

        // Set default date to today
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        tvDate.setText(sdf.format(Calendar.getInstance().getTime()));
    }

    private void setupViewModel() {
        homeViewModel = new ViewModelProvider(this).get(HomeViewModel.class);
        homeViewModel.getRoutes().observe(this, routes -> {
            if (routes != null) {
                Set<String> locationsSet = new HashSet<>();
                for (RouteResponse r : routes) {
                    locationsSet.add(r.getDepartureLocation());
                    locationsSet.add(r.getArrivalLocation());
                }
                locationsList.clear();
                locationsList.addAll(locationsSet);
            }
        });
    }

    private void setupListeners() {
        topAppBar.setNavigationOnClickListener(v -> {
            Toast.makeText(this, "Tính năng menu phụ đang được phát triển", Toast.LENGTH_SHORT).show();
        });

        llOrigin.setOnClickListener(v -> showLocationDialog("Chọn Điểm Đi", tvOrigin));
        llDestination.setOnClickListener(v -> showLocationDialog("Chọn Điểm Đến", tvDestination));

        btnSwap.setOnClickListener(v -> {
            String temp = tvOrigin.getText().toString();
            tvOrigin.setText(tvDestination.getText().toString());
            tvDestination.setText(temp);
        });

        llDate.setOnClickListener(v -> showDatePicker());

        btnSearch.setOnClickListener(v -> {
            String from = tvOrigin.getText().toString();
            String to = tvDestination.getText().toString();
            String date = tvDate.getText().toString();

            if (from.equals("Chọn điểm đi") || to.equals("Nhập điểm đến") || from.isEmpty() || to.isEmpty()) {
                Toast.makeText(MainActivity.this, "Vui lòng chọn Điểm đi và Điểm đến", Toast.LENGTH_SHORT).show();
                return;
            }

            Intent intent = new Intent(MainActivity.this, TripListActivity.class);
            intent.putExtra("from", from);
            intent.putExtra("to", to);
            intent.putExtra("date", date);
            startActivity(intent);
        });

        BottomNavigationView bottomNav = findViewById(R.id.bottom_navigation);
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_search) {
                return true;
            } else if (id == R.id.nav_bookings) {
                startActivity(new Intent(MainActivity.this, BookingHistoryActivity.class));
                return false;
            } else if (id == R.id.nav_profile) {
                startActivity(new Intent(MainActivity.this, ProfileActivity.class));
                return false;
            }
            return false;
        });
    }

    private void showLocationDialog(String title, TextView targetTextView) {
        if (locationsList.isEmpty()) {
            Toast.makeText(this, "Đang tải danh sách địa điểm...", Toast.LENGTH_SHORT).show();
            return;
        }

        String[] items = locationsList.toArray(new String[0]);

        new MaterialAlertDialogBuilder(this)
                .setTitle(title)
                .setItems(items, (dialog, which) -> {
                    targetTextView.setText(items[which]);
                })
                .show();
    }

    private void showDatePicker() {
        CalendarConstraints.Builder constraintsBuilder = new CalendarConstraints.Builder();
        constraintsBuilder.setValidator(DateValidatorPointForward.now());

        MaterialDatePicker<Long> datePicker = MaterialDatePicker.Builder.datePicker()
                .setTitleText("Chọn ngày khởi hành")
                .setSelection(MaterialDatePicker.todayInUtcMilliseconds())
                .setCalendarConstraints(constraintsBuilder.build())
                .build();

        datePicker.addOnPositiveButtonClickListener(selection -> {
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(selection);
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            tvDate.setText(sdf.format(calendar.getTime()));
        });

        datePicker.show(getSupportFragmentManager(), "DATE_PICKER");
    }
}