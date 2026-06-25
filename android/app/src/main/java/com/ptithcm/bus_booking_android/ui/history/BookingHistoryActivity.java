package com.ptithcm.bus_booking_android.ui.history;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.tabs.TabLayout;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.api.RetrofitClient;
import com.ptithcm.bus_booking_android.data.api.ApiService;
import com.ptithcm.bus_booking_android.data.model.UserTicketsResponse;
import com.ptithcm.bus_booking_android.data.model.RouteResponse;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookingHistoryActivity extends AppCompatActivity {

    private RecyclerView rvBookingHistory;
    private BookingHistoryAdapter adapter;
    private List<MockBooking> allBookings = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_history);

        Toolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setNavigationOnClickListener(v -> finish());

        TabLayout tabLayout = findViewById(R.id.tabLayout);
        rvBookingHistory = findViewById(R.id.rvBookingHistory);
        rvBookingHistory.setLayoutManager(new LinearLayoutManager(this));

        loadDataFromApi();

        adapter = new BookingHistoryAdapter(getFilteredList("Sắp đi"));
        rvBookingHistory.setAdapter(adapter);

        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                switch (tab.getPosition()) {
                    case 0:
                        adapter.updateData(getFilteredList("Sắp đi"));
                        break;
                    case 1:
                        adapter.updateData(getFilteredList("Hoàn thành"));
                        break;
                    case 2:
                        adapter.updateData(getFilteredList("Đã hủy"));
                        break;
                }
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {}

            @Override
            public void onTabReselected(TabLayout.Tab tab) {}
        });
    }

    private void loadDataFromApi() {
        SharedPreferences prefs = getSharedPreferences("app_prefs", MODE_PRIVATE);
        int userId = prefs.getInt("user_id", -1);
        if (userId == -1) return;

        ApiService apiService = RetrofitClient.getClient(this).create(ApiService.class);
        apiService.getUserTickets(userId).enqueue(new Callback<List<UserTicketsResponse>>() {
            @Override
            public void onResponse(Call<List<UserTicketsResponse>> call, Response<List<UserTicketsResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    allBookings.clear();
                    List<UserTicketsResponse> tickets = response.body();
                    Date now = new Date();

                    for (UserTicketsResponse ticket : tickets) {
                        if (ticket.getBooking() == null || ticket.getBooking().getTrip() == null) continue;
                        
                        String statusStr = "Sắp đi";
                        String bookingStatus = ticket.getBooking().getStatus();
                        String ticketStatus = ticket.getStatus();
                        String rawDate = ticket.getBooking().getTrip().getDepartureTime();
                        
                        Date departureDate = null;
                        if (rawDate != null) {
                            try {
                                SimpleDateFormat inFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
                                inFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                                departureDate = inFormat.parse(rawDate);
                            } catch (Exception e) {
                                // ignore
                            }
                        }

                        if ("cancelled".equals(bookingStatus) || "cancelled".equals(ticketStatus)) {
                            statusStr = "Đã hủy";
                        } else if ("paid".equals(bookingStatus)) {
                            if (departureDate != null && departureDate.before(now)) {
                                statusStr = "Hoàn thành";
                            } else {
                                statusStr = "Sắp đi";
                            }
                        } else if ("pending".equals(bookingStatus)) {
                            statusStr = "Sắp đi";
                        }

                        allBookings.add(convertToMock(ticket, statusStr));
                    }

                    // Update UI for the first tab initially
                    TabLayout tabLayout = findViewById(R.id.tabLayout);
                    int position = tabLayout.getSelectedTabPosition();
                    String currentTabStatus = position == 0 ? "Sắp đi" : (position == 1 ? "Hoàn thành" : "Đã hủy");
                    adapter.updateData(getFilteredList(currentTabStatus));
                }
            }

            @Override
            public void onFailure(Call<List<UserTicketsResponse>> call, Throwable t) {
                // handle failure
            }
        });
    }

    private MockBooking convertToMock(UserTicketsResponse ticket, String status) {
        String code = ticket.getQrCode();
        if (code == null || code.isEmpty()) {
            code = "TICKET-" + ticket.getId();
        }
        
        String routeName = "Chưa rõ tuyến";
        String departureLoc = "Chưa rõ";
        String arrivalLoc = "Chưa rõ";
        String datetime = "";
        String bookingTime = "";
        
        if (ticket.getBooking() != null && ticket.getBooking().getTrip() != null) {
            RouteResponse route = ticket.getBooking().getTrip().getRoute();
            if (route != null) {
                departureLoc = route.getDepartureLocation();
                arrivalLoc = route.getArrivalLocation();
                routeName = departureLoc + " → " + arrivalLoc;
            }
            
            String rawDate = ticket.getBooking().getTrip().getDepartureTime();
            if (rawDate != null) {
                try {
                    SimpleDateFormat inFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
                    inFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                    Date date = inFormat.parse(rawDate);
                    SimpleDateFormat outFormat = new SimpleDateFormat("HH:mm - dd/MM/yyyy", Locale.getDefault());
                    if (date != null) {
                        datetime = outFormat.format(date);
                    }
                } catch (Exception e) {
                    datetime = rawDate;
                }
            }
        }

        String rawBookingTime = ticket.getCreatedAt();
        if (rawBookingTime != null) {
            try {
                SimpleDateFormat inFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault());
                inFormat.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
                Date bDate = inFormat.parse(rawBookingTime);
                SimpleDateFormat outFormat = new SimpleDateFormat("HH:mm - dd/MM/yyyy", Locale.getDefault());
                if (bDate != null) {
                    bookingTime = outFormat.format(bDate);
                }
            } catch (Exception e) {
                bookingTime = rawBookingTime;
            }
        }

        String passengerName = ticket.getPassengerName() != null ? ticket.getPassengerName() : "";
        String seatNumber = ticket.getSeat() != null && ticket.getSeat().getSeatNumber() != null ? ticket.getSeat().getSeatNumber() : "Chưa xếp";
        int totalAmount = ticket.getBooking() != null ? ticket.getBooking().getTotalAmount() : 0;
        int bookingId = ticket.getBooking() != null ? ticket.getBooking().getId() : -1;
        
        return new MockBooking(bookingId, code, routeName, datetime, status, passengerName, seatNumber, totalAmount, departureLoc, arrivalLoc, bookingTime);
    }

    private List<MockBooking> getFilteredList(String status) {
        List<MockBooking> filtered = new ArrayList<>();
        for (MockBooking b : allBookings) {
            if (b.status.equals(status)) {
                filtered.add(b);
            }
        }
        return filtered;
    }

    class MockBooking {
        int id;
        String code, route, datetime, status, passengerName, seatNumber, departureLoc, arrivalLoc, bookingTime;
        int totalAmount;
        MockBooking(int id, String c, String r, String d, String s, String pName, String sNum, int amt, String depLoc, String arrLoc, String bTime) { 
            this.id = id;
            code=c; route=r; datetime=d; status=s; passengerName=pName; seatNumber=sNum; totalAmount=amt; 
            departureLoc=depLoc; arrivalLoc=arrLoc; bookingTime=bTime;
        }
    }

    class BookingHistoryAdapter extends RecyclerView.Adapter<BookingHistoryAdapter.ViewHolder> {
        private List<MockBooking> list;

        BookingHistoryAdapter(List<MockBooking> list) { this.list = list; }

        void updateData(List<MockBooking> newList) {
            this.list = newList;
            notifyDataSetChanged();
        }

        @NonNull
        @Override
        public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
            View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_booking_history, parent, false);
            return new ViewHolder(view);
        }

        @Override
        public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
            MockBooking item = list.get(position);
            holder.tvRoute.setText(item.route);
            holder.tvTicketCode.setText(item.code);
            holder.tvDateTime.setText(item.datetime);
            holder.tvStatus.setText(item.status);

            if (item.status.equals("Sắp đi")) {
                holder.tvStatus.setTextColor(0xFF016E21);
                holder.tvStatus.setBackgroundResource(R.drawable.bg_status_upcoming);
            } else {
                holder.tvStatus.setTextColor(0xFF5D6466);
                holder.tvStatus.setBackgroundResource(R.drawable.bg_status_completed);
            }

            holder.itemView.setOnClickListener(v -> {
                Intent intent = new Intent(BookingHistoryActivity.this, TicketDetailsActivity.class);
                intent.putExtra("booking_id", item.id);
                intent.putExtra("ticket_code", item.code);
                intent.putExtra("departure_loc", item.departureLoc);
                intent.putExtra("arrival_loc", item.arrivalLoc);
                intent.putExtra("booking_time", item.bookingTime);
                intent.putExtra("departure_time", item.datetime);
                intent.putExtra("passenger_name", item.passengerName);
                intent.putExtra("seat_number", item.seatNumber);
                intent.putExtra("total_amount", item.totalAmount);
                intent.putExtra("ticket_status", item.status);
                startActivity(intent);
            });
        }

        @Override
        public int getItemCount() { return list.size(); }

        class ViewHolder extends RecyclerView.ViewHolder {
            TextView tvRoute, tvStatus, tvDateTime, tvTicketCode;
            ViewHolder(View v) {
                super(v);
                tvRoute = v.findViewById(R.id.tvRoute);
                tvStatus = v.findViewById(R.id.tvStatus);
                tvDateTime = v.findViewById(R.id.tvDateTime);
                tvTicketCode = v.findViewById(R.id.tvTicketCode);
            }
        }
    }
}
