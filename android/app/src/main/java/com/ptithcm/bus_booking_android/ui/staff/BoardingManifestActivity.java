package com.ptithcm.bus_booking_android.ui.staff;

import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.model.UserTicketsResponse;

import java.util.ArrayList;
import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BoardingManifestActivity extends AppCompatActivity {

    private TextView tvTripInfo, tvTotal, tvCheckedIn, tvNotCheckedIn, tvEmptyState;
    private ProgressBar progressBar;
    private RecyclerView rvPassengers;
    private BoardingManifestAdapter adapter;
    private LinearLayout btnFilterAll, btnFilterCheckedIn, btnFilterNotCheckedIn;
    private List<UserTicketsResponse> allTickets = new ArrayList<>();

    private ApiService apiService;
    private int tripId = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_boarding_manifest);

        tripId = getIntent().getIntExtra("trip_id", -1);

        apiService = RetrofitClient.getClient(this).create(ApiService.class);
        initViews();

        if (tripId != -1) {
            tvTripInfo.setText("Chuyến xe #" + tripId);
            loadManifest();
        } else {
            Toast.makeText(this, "Không nhận được mã chuyến xe", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    private void initViews() {
        tvTripInfo = findViewById(R.id.tvTripInfo);
        tvTotal = findViewById(R.id.tvTotal);
        tvCheckedIn = findViewById(R.id.tvCheckedIn);
        tvNotCheckedIn = findViewById(R.id.tvNotCheckedIn);
        tvEmptyState = findViewById(R.id.tvEmptyState);
        progressBar = findViewById(R.id.progressBar);
        
        btnFilterAll = findViewById(R.id.btnFilterAll);
        btnFilterCheckedIn = findViewById(R.id.btnFilterCheckedIn);
        btnFilterNotCheckedIn = findViewById(R.id.btnFilterNotCheckedIn);
        
        btnFilterAll.setOnClickListener(v -> filterTickets("all"));
        btnFilterCheckedIn.setOnClickListener(v -> filterTickets("used"));
        btnFilterNotCheckedIn.setOnClickListener(v -> filterTickets("unused"));
        
        rvPassengers = findViewById(R.id.rvPassengers);
        rvPassengers.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BoardingManifestAdapter(new ArrayList<>());
        rvPassengers.setAdapter(adapter);
    }

    private void filterTickets(String status) {
        List<UserTicketsResponse> filtered = new ArrayList<>();
        for (UserTicketsResponse t : allTickets) {
            if ("all".equals(status) || status.equals(t.getStatus())) {
                filtered.add(t);
            }
        }
        
        adapter.updateData(filtered);
        
        if (filtered.isEmpty()) {
            tvEmptyState.setVisibility(View.VISIBLE);
            rvPassengers.setVisibility(View.GONE);
            if ("used".equals(status)) {
                tvEmptyState.setText("Chưa có hành khách nào lên xe.");
            } else if ("unused".equals(status)) {
                tvEmptyState.setText("Tất cả hành khách đã lên xe.");
            } else {
                tvEmptyState.setText("🚌\n\nChưa có hành khách nào đặt vé\ncho chuyến xe này.");
            }
        } else {
            tvEmptyState.setVisibility(View.GONE);
            rvPassengers.setVisibility(View.VISIBLE);
        }
    }

    private void loadManifest() {
        progressBar.setVisibility(View.VISIBLE);
        apiService.getTicketsByTrip(tripId).enqueue(new Callback<List<UserTicketsResponse>>() {
            @Override
            public void onResponse(Call<List<UserTicketsResponse>> call, Response<List<UserTicketsResponse>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    allTickets = response.body();
                    
                    int total = allTickets.size();
                    int checkedIn = 0;
                    int notCheckedIn = 0;
                    
                    for (UserTicketsResponse t : allTickets) {
                        if ("used".equals(t.getStatus())) {
                            checkedIn++;
                        } else if ("unused".equals(t.getStatus())) {
                            notCheckedIn++;
                        }
                    }
                    
                    tvTotal.setText(String.valueOf(total));
                    tvCheckedIn.setText(String.valueOf(checkedIn));
                    tvNotCheckedIn.setText(String.valueOf(notCheckedIn));
                    
                    filterTickets("all");
                } else {
                    Toast.makeText(BoardingManifestActivity.this, "Lỗi khi lấy danh sách hành khách", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<UserTicketsResponse>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(BoardingManifestActivity.this, "Lỗi kết nối", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
