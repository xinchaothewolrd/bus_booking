package com.ptithcm.bus_booking_android.ui.seat;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.appbar.MaterialToolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.button.MaterialButtonToggleGroup;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.model.RouteStopResponse;
import com.ptithcm.bus_booking_android.data.model.TripSeatResponse;
import com.ptithcm.bus_booking_android.ui.passenger.PassengerInfoActivity;

import java.text.DecimalFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import java.net.URISyntaxException;

public class SeatSelectionActivity extends AppCompatActivity {

    private SeatViewModel seatViewModel;
    private SeatAdapter seatAdapter;
    private RecyclerView rvSeats;
    private ProgressBar progressBar;
    private MaterialToolbar topAppBar;
    private MaterialButtonToggleGroup toggleFloor;
    private TextView tvTotalPrice;
    private MaterialButton btnContinue;
    private TextView tvPickupName, tvPickupAddress, tvDropoffName, tvDropoffAddress;
    private TextView btnChangePickup, btnChangeDropoff;

    private List<TripSeatResponse> allSeats = new ArrayList<>();
    private List<TripSeatResponse> selectedSeats = new ArrayList<>();
    private List<RouteStopResponse> allRouteStops = new ArrayList<>();
    private RouteStopResponse selectedPickup = null;
    private RouteStopResponse selectedDropoff = null;
    private String fromCity = "";
    private String toCity = "";
    private String departureTime = "";
    private String arrivalTime = "";
    private int tripPrice = 0;
    private int tripId = -1;
    private int routeId = -1;
    private Socket mSocket;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_seat_selection);

        tripId = getIntent().getIntExtra("trip_id", -1);
        routeId = getIntent().getIntExtra("route_id", -1);
        tripPrice = getIntent().getIntExtra("trip_price", 0);
        fromCity = getIntent().getStringExtra("from");
        toCity = getIntent().getStringExtra("to");
        departureTime = getIntent().getStringExtra("departure_time");
        arrivalTime = getIntent().getStringExtra("arrival_time");

        topAppBar = findViewById(R.id.topAppBar);
        topAppBar.setNavigationOnClickListener(v -> releaseSelectedSeatsAndFinish());

        tvPickupName = findViewById(R.id.tvPickupName);
        tvPickupAddress = findViewById(R.id.tvPickupAddress);
        tvDropoffName = findViewById(R.id.tvDropoffName);
        tvDropoffAddress = findViewById(R.id.tvDropoffAddress);
        btnChangePickup = findViewById(R.id.btnChangePickup);
        btnChangeDropoff = findViewById(R.id.btnChangeDropoff);

        btnChangePickup.setOnClickListener(v -> showBottomSheet("pickup"));
        btnChangeDropoff.setOnClickListener(v -> showBottomSheet("dropoff"));

        rvSeats = findViewById(R.id.rvSeats);
        progressBar = findViewById(R.id.progressBar);
        toggleFloor = findViewById(R.id.toggleFloor);
        tvTotalPrice = findViewById(R.id.tvTotalPrice);
        btnContinue = findViewById(R.id.btnContinue);

        rvSeats.setLayoutManager(new GridLayoutManager(this, 3));
        seatAdapter = new SeatAdapter();
        rvSeats.setAdapter(seatAdapter);

        seatAdapter.setOnSeatSelectionChangeListener(new SeatAdapter.OnSeatSelectionChangeListener() {
            @Override
            public void onSelectionChanged(List<TripSeatResponse> seats) {
                selectedSeats = seats;
                updateBottomBar();
            }

            @Override
            public void onSeatSelected(TripSeatResponse seat) {
                List<Integer> seatIds = new ArrayList<>();
                seatIds.add(seat.getId());
                // Set pendingUntil to 5 minutes from now for lock
                long pendingTime = System.currentTimeMillis() + 5 * 60 * 1000;
                java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.getDefault());
                sdf.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                String pendingUntil = sdf.format(new java.util.Date(pendingTime));

                com.ptithcm.bus_booking_android.data.model.SeatLockRequest request = 
                    new com.ptithcm.bus_booking_android.data.model.SeatLockRequest(tripId, seatIds, pendingUntil);
                com.ptithcm.bus_booking_android.data.api.RetrofitClient.getClient(SeatSelectionActivity.this).create(com.ptithcm.bus_booking_android.data.api.ApiService.class)
                    .lockSeats(request).enqueue(new retrofit2.Callback<com.ptithcm.bus_booking_android.data.model.MessageResponse>() {
                        @Override
                        public void onResponse(retrofit2.Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> call, retrofit2.Response<com.ptithcm.bus_booking_android.data.model.MessageResponse> response) {}
                        @Override
                        public void onFailure(retrofit2.Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> call, Throwable t) {}
                    });
            }

            @Override
            public void onSeatDeselected(TripSeatResponse seat) {
                List<Integer> seatIds = new ArrayList<>();
                seatIds.add(seat.getId());
                com.ptithcm.bus_booking_android.data.model.SeatLockRequest request = 
                    new com.ptithcm.bus_booking_android.data.model.SeatLockRequest(tripId, seatIds);
                com.ptithcm.bus_booking_android.data.api.RetrofitClient.getClient(SeatSelectionActivity.this).create(com.ptithcm.bus_booking_android.data.api.ApiService.class)
                    .releaseSeats(request).enqueue(new retrofit2.Callback<com.ptithcm.bus_booking_android.data.model.MessageResponse>() {
                        @Override
                        public void onResponse(retrofit2.Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> call, retrofit2.Response<com.ptithcm.bus_booking_android.data.model.MessageResponse> response) {}
                        @Override
                        public void onFailure(retrofit2.Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> call, Throwable t) {}
                    });
            }
        });

        toggleFloor.addOnButtonCheckedListener((group, checkedId, isChecked) -> {
            if (isChecked) {
                if (checkedId == R.id.btnLowerFloor) {
                    showFloor("A");
                } else if (checkedId == R.id.btnUpperFloor) {
                    showFloor("B");
                }
            }
        });

        btnContinue.setOnClickListener(v -> {
            if (selectedSeats.isEmpty()) return;
            Intent intent = new Intent(this, PassengerInfoActivity.class);
            intent.putExtra("trip_id", tripId);
            intent.putExtra("trip_price", tripPrice);
            intent.putExtra("pickup_name", selectedPickup != null ? selectedPickup.getStopName() : "");
            intent.putExtra("dropoff_name", selectedDropoff != null ? selectedDropoff.getStopName() : "");
            intent.putExtra("pickup_stop_id", selectedPickup != null ? selectedPickup.getId() : -1);
            intent.putExtra("dropoff_stop_id", selectedDropoff != null ? selectedDropoff.getId() : -1);
            intent.putExtra("from", fromCity);
            intent.putExtra("to", toCity);
            intent.putExtra("departure_time", departureTime);
            intent.putExtra("arrival_time", arrivalTime);
            
            // Pass selected seat IDs or Numbers
            ArrayList<Integer> seatIds = new ArrayList<>();
            ArrayList<String> seatNumbers = new ArrayList<>();
            for (TripSeatResponse s : selectedSeats) {
                seatIds.add(s.getId());
                seatNumbers.add(s.getSeatNumber());
            }
            intent.putIntegerArrayListExtra("seat_ids", seatIds);
            intent.putStringArrayListExtra("seat_numbers", seatNumbers);
            startActivity(intent);
        });

        seatViewModel = new ViewModelProvider(this).get(SeatViewModel.class);

        if (tripId != -1) {
            loadSeats();
        } else {
            Toast.makeText(this, "Lỗi: Không tìm thấy ID chuyến đi", Toast.LENGTH_SHORT).show();
            finish();
        }

        if (routeId != -1) {
            loadRouteStops();
        }

        try {
            mSocket = IO.socket("http://192.168.1.6:3000");
            mSocket.connect();
            mSocket.emit("join-trip", tripId);

            mSocket.on("seat-updated", new Emitter.Listener() {
                @Override
                public void call(final Object... args) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            loadSeats();
                        }
                    });
                }
            });
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (mSocket != null) {
            mSocket.disconnect();
            mSocket.off("seat-updated");
        }
    }

    private void loadRouteStops() {
        seatViewModel.getRouteStops(routeId).observe(this, stops -> {
            if (stops != null && !stops.isEmpty()) {
                allRouteStops = stops;
                for (RouteStopResponse stop : stops) {
                    if (("pickup".equals(stop.getStopType()) || "both".equals(stop.getStopType())) && selectedPickup == null) {
                        selectedPickup = stop;
                    }
                    if (("dropoff".equals(stop.getStopType()) || "both".equals(stop.getStopType())) && selectedDropoff == null) {
                        selectedDropoff = stop;
                    }
                }
                updateRouteStopUI();
            }
        });
    }

    private void updateRouteStopUI() {
        if (selectedPickup != null) {
            tvPickupName.setText(selectedPickup.getStopName());
            tvPickupAddress.setText(selectedPickup.getAddress());
        }
        if (selectedDropoff != null) {
            tvDropoffName.setText(selectedDropoff.getStopName());
            tvDropoffAddress.setText(selectedDropoff.getAddress());
        }
    }

    private void showBottomSheet(String type) {
        com.google.android.material.bottomsheet.BottomSheetDialog bottomSheetDialog = 
                new com.google.android.material.bottomsheet.BottomSheetDialog(this);
        View view = getLayoutInflater().inflate(R.layout.bottom_sheet_route_stops, null);
        bottomSheetDialog.setContentView(view);

        TextView tvSheetTitle = view.findViewById(R.id.tvSheetTitle);
        RecyclerView rvRouteStops = view.findViewById(R.id.rvRouteStops);
        rvRouteStops.setLayoutManager(new androidx.recyclerview.widget.LinearLayoutManager(this));

        RouteStopAdapter adapter = new RouteStopAdapter();
        
        List<RouteStopResponse> filteredStops = new ArrayList<>();
        for (RouteStopResponse stop : allRouteStops) {
            if (type.equals(stop.getStopType()) || "both".equals(stop.getStopType())) {
                filteredStops.add(stop);
            }
        }
        adapter.setStopList(filteredStops);

        if (type.equals("pickup")) {
            tvSheetTitle.setText("Chọn điểm đón");
        } else {
            tvSheetTitle.setText("Chọn điểm trả");
        }

        adapter.setOnStopClickListener(stop -> {
            if (type.equals("pickup")) {
                selectedPickup = stop;
            } else {
                selectedDropoff = stop;
            }
            updateRouteStopUI();
            bottomSheetDialog.dismiss();
        });

        rvRouteStops.setAdapter(adapter);
        bottomSheetDialog.show();
    }

    private void loadSeats() {
        seatViewModel.getSeatsByTripId(tripId).observe(this, seats -> {
            if (seats != null && !seats.isEmpty()) {
                allSeats = seats;
                rvSeats.setVisibility(View.VISIBLE);
                progressBar.setVisibility(View.GONE);
                
                // Show lower floor by default
                showFloor("A");
            } else {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(this, "Chưa có dữ liệu ghế cho chuyến xe này", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void showFloor(String prefix) {
        List<TripSeatResponse> floorSeats = new ArrayList<>();
        for (TripSeatResponse s : allSeats) {
            if (s.getSeatNumber() != null && s.getSeatNumber().startsWith(prefix)) {
                floorSeats.add(s);
            }
        }
        
        // Sắp xếp ghế theo số (A1, A2, A3... thay vì A1, A10, A11)
        java.util.Collections.sort(floorSeats, new java.util.Comparator<TripSeatResponse>() {
            @Override
            public int compare(TripSeatResponse s1, TripSeatResponse s2) {
                try {
                    int num1 = Integer.parseInt(s1.getSeatNumber().substring(1));
                    int num2 = Integer.parseInt(s2.getSeatNumber().substring(1));
                    return Integer.compare(num1, num2);
                } catch (NumberFormatException e) {
                    return s1.getSeatNumber().compareTo(s2.getSeatNumber());
                }
            }
        });
        
        // Custom logic can be added here to insert dummy null items for aisles if desired
        // But for a simple 3-column bus layout, we can just display them straight.
        
        seatAdapter.setSeatList(floorSeats);
    }

    private void updateBottomBar() {
        int total = selectedSeats.size() * tripPrice;
        DecimalFormat formatter = new DecimalFormat("###,###,###");
        tvTotalPrice.setText(formatter.format(total) + "đ");

        btnContinue.setEnabled(!selectedSeats.isEmpty());
    }

    private void releaseSelectedSeatsAndFinish() {
        if (!selectedSeats.isEmpty()) {
            List<Integer> seatIds = new ArrayList<>();
            for (TripSeatResponse seat : selectedSeats) {
                seatIds.add(seat.getId());
            }
            com.ptithcm.bus_booking_android.data.model.SeatLockRequest request = 
                new com.ptithcm.bus_booking_android.data.model.SeatLockRequest(tripId, seatIds);
            com.ptithcm.bus_booking_android.data.api.RetrofitClient.getClient(this).create(com.ptithcm.bus_booking_android.data.api.ApiService.class)
                .releaseSeats(request).enqueue(new retrofit2.Callback<com.ptithcm.bus_booking_android.data.model.MessageResponse>() {
                    @Override
                    public void onResponse(retrofit2.Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> call, retrofit2.Response<com.ptithcm.bus_booking_android.data.model.MessageResponse> response) {}
                    @Override
                    public void onFailure(retrofit2.Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> call, Throwable t) {}
                });
        }
        finish();
    }

    @Override
    public void onBackPressed() {
        releaseSelectedSeatsAndFinish();
    }
}
