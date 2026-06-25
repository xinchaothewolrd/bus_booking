package com.ptithcm.bus_booking_android.ui.trip;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.chip.Chip;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.model.BusTypeResponse;
import com.ptithcm.bus_booking_android.data.model.TripSearchResponse;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

public class TripListActivity extends AppCompatActivity {

    private TripViewModel tripViewModel;
    private TripAdapter tripAdapter;
    private RecyclerView rvTrips;
    private ProgressBar progressBar;
    private TextView tvNoData;
    private MaterialToolbar topAppBar;

    private List<TripSearchResponse> originalTrips = new ArrayList<>();
    private List<BusTypeResponse> busTypes = new ArrayList<>();
    
    private int currentSortOption = 0; // 0: Default, 1: Time ASC, 2: Time DESC, 3: Price ASC, 4: Price DESC
    private final String[] sortOptions = {"Mặc định", "Giờ khởi hành sớm nhất", "Giờ khởi hành trễ nhất", "Giá thấp đến cao", "Giá cao đến thấp"};
    
    private String currentBusTypeFilter = null; // null means all

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_trip_list);

        String from = getIntent().getStringExtra("from");
        String to = getIntent().getStringExtra("to");
        String date = getIntent().getStringExtra("date"); // YYYY-MM-DD

        topAppBar = findViewById(R.id.topAppBar);
        topAppBar.setTitle(from + " → " + to);
        topAppBar.setSubtitle(date);
        topAppBar.setNavigationOnClickListener(v -> finish());

        rvTrips = findViewById(R.id.rvTrips);
        progressBar = findViewById(R.id.progressBar);
        tvNoData = findViewById(R.id.tvNoData);

        rvTrips.setLayoutManager(new LinearLayoutManager(this));
        tripAdapter = new TripAdapter();
        tripAdapter.setOnTripClickListener(trip -> {
            android.content.Intent intent = new android.content.Intent(this, com.ptithcm.bus_booking_android.ui.seat.SeatSelectionActivity.class);
            intent.putExtra("trip_id", trip.getTripId());
            intent.putExtra("route_id", trip.getRouteId());
            intent.putExtra("trip_price", trip.getPrice());
            intent.putExtra("from", trip.getDepartureLocation());
            intent.putExtra("to", trip.getArrivalLocation());
            intent.putExtra("departure_time", trip.getDepartureTime());
            intent.putExtra("arrival_time", trip.getArrivalTimeExpected());
            startActivity(intent);
        });
        rvTrips.setAdapter(tripAdapter);

        tripViewModel = new ViewModelProvider(this).get(TripViewModel.class);
        
        setupFilters();
        loadTrips(from, to, date);
    }

    private void setupFilters() {
        Chip chipSort = findViewById(R.id.chipSort);
        Chip chipBusType = findViewById(R.id.chipBusType);

        chipSort.setOnClickListener(v -> {
            new MaterialAlertDialogBuilder(this)
                .setTitle("Sắp xếp")
                .setSingleChoiceItems(sortOptions, currentSortOption, (dialog, which) -> {
                    currentSortOption = which;
                    filterAndSortTrips();
                    dialog.dismiss();
                })
                .show();
        });

        tripViewModel.getBusTypes().observe(this, types -> {
            if (types != null) {
                busTypes = types;
            }
        });

        chipBusType.setOnClickListener(v -> {
            if (busTypes.isEmpty()) {
                android.widget.Toast.makeText(this, "Đang tải danh sách loại xe...", android.widget.Toast.LENGTH_SHORT).show();
                return;
            }
            String[] typeNames = new String[busTypes.size() + 1];
            typeNames[0] = "Tất cả";
            int selectedIndex = 0;
            for (int i = 0; i < busTypes.size(); i++) {
                typeNames[i + 1] = busTypes.get(i).getTypeName();
                if (typeNames[i + 1].equals(currentBusTypeFilter)) {
                    selectedIndex = i + 1;
                }
            }

            new MaterialAlertDialogBuilder(this)
                .setTitle("Chọn loại xe")
                .setSingleChoiceItems(typeNames, selectedIndex, (dialog, which) -> {
                    if (which == 0) {
                        currentBusTypeFilter = null;
                        chipBusType.setText("Loại xe");
                    } else {
                        currentBusTypeFilter = typeNames[which];
                        chipBusType.setText(currentBusTypeFilter);
                    }
                    filterAndSortTrips();
                    dialog.dismiss();
                })
                .show();
        });
    }

    private void loadTrips(String from, String to, String date) {
        progressBar.setVisibility(View.VISIBLE);
        rvTrips.setVisibility(View.GONE);
        tvNoData.setVisibility(View.GONE);

        tripViewModel.searchTrips(from, to, date).observe(this, trips -> {
            progressBar.setVisibility(View.GONE);
            if (trips != null && !trips.isEmpty()) {
                originalTrips = trips;
                filterAndSortTrips();
            } else {
                originalTrips.clear();
                tvNoData.setVisibility(View.VISIBLE);
                findViewById(R.id.tvResultCount).setVisibility(View.GONE);
            }
        });
    }

    private void filterAndSortTrips() {
        if (originalTrips == null || originalTrips.isEmpty()) return;

        List<TripSearchResponse> filtered = new ArrayList<>();
        
        for (TripSearchResponse trip : originalTrips) {
            boolean matches = true;
            if (currentBusTypeFilter != null && !currentBusTypeFilter.equals(trip.getBusType())) {
                matches = false;
            }
            if (matches) {
                filtered.add(trip);
            }
        }

        Collections.sort(filtered, new Comparator<TripSearchResponse>() {
            @Override
            public int compare(TripSearchResponse t1, TripSearchResponse t2) {
                switch (currentSortOption) {
                    case 1:
                        return t1.getDepartureTime().compareTo(t2.getDepartureTime());
                    case 2:
                        return t2.getDepartureTime().compareTo(t1.getDepartureTime());
                    case 3:
                        return Integer.compare(t1.getPrice(), t2.getPrice());
                    case 4:
                        return Integer.compare(t2.getPrice(), t1.getPrice());
                    default:
                        return 0;
                }
            }
        });

        tripAdapter.setTripList(filtered);
        TextView tvResultCount = findViewById(R.id.tvResultCount);
        if (filtered.isEmpty()) {
            tvNoData.setVisibility(View.VISIBLE);
            rvTrips.setVisibility(View.GONE);
            tvResultCount.setVisibility(View.GONE);
        } else {
            tvNoData.setVisibility(View.GONE);
            rvTrips.setVisibility(View.VISIBLE);
            tvResultCount.setText(filtered.size() + " chuyến xe phù hợp");
            tvResultCount.setVisibility(View.VISIBLE);
        }
    }
}
