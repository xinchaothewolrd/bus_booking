package com.ptithcm.bus_booking_android.ui.seat;

import android.content.Context;
import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.card.MaterialCardView;
import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.model.TripSeatResponse;

import java.util.ArrayList;
import java.util.List;

public class SeatAdapter extends RecyclerView.Adapter<SeatAdapter.SeatViewHolder> {

    private List<TripSeatResponse> seatList = new ArrayList<>();
    private List<TripSeatResponse> selectedSeats = new ArrayList<>();
    private OnSeatSelectionChangeListener listener;
    private Context context;

    public interface OnSeatSelectionChangeListener {
        void onSelectionChanged(List<TripSeatResponse> selectedSeats);
        void onSeatSelected(TripSeatResponse seat);
        void onSeatDeselected(TripSeatResponse seat);
    }

    public void setOnSeatSelectionChangeListener(OnSeatSelectionChangeListener listener) {
        this.listener = listener;
    }

    public void setSeatList(List<TripSeatResponse> seatList) {
        this.seatList = seatList;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public SeatViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        context = parent.getContext();
        View view = LayoutInflater.from(context).inflate(R.layout.item_seat, parent, false);
        return new SeatViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull SeatViewHolder holder, int position) {
        TripSeatResponse seat = seatList.get(position);
        
        // Handle empty spaces in grid if seat object is null (for aisles if needed later)
        if (seat == null || seat.getSeatNumber() == null) {
            holder.itemView.setVisibility(View.INVISIBLE);
            return;
        } else {
            holder.itemView.setVisibility(View.VISIBLE);
        }

        holder.tvSeatNumber.setText(seat.getSeatNumber());

        // Reset state
        holder.cardSeat.setStrokeWidth(1);
        holder.cardSeat.setStrokeColor(ContextCompat.getColor(context, R.color.md_theme_light_outlineVariant));

        boolean isSelected = false;
        for (TripSeatResponse s : selectedSeats) {
            if (s.getId() == seat.getId()) {
                isSelected = true;
                break;
            }
        }

        if (isSelected) {
            holder.cardSeat.setCardBackgroundColor(ContextCompat.getColor(context, R.color.md_theme_light_primary));
            holder.tvSeatNumber.setTextColor(Color.WHITE);
            holder.cardSeat.setStrokeWidth(0);
        } else if ("booked".equals(seat.getStatus()) || "pending".equals(seat.getStatus())) {
            holder.cardSeat.setCardBackgroundColor(Color.parseColor("#BDBDBD")); // Xám cho ghế đã đặt
            holder.tvSeatNumber.setTextColor(Color.WHITE);
            holder.cardSeat.setStrokeWidth(0);
        } else {
            holder.cardSeat.setCardBackgroundColor(Color.WHITE);
            holder.tvSeatNumber.setTextColor(ContextCompat.getColor(context, R.color.md_theme_light_onSurface));
            holder.cardSeat.setStrokeWidth(2); // strokeWidth > 0 để hiện viền xám nhạt
            holder.cardSeat.setStrokeColor(Color.parseColor("#E0E0E0"));
        }

        holder.itemView.setOnClickListener(v -> {
            boolean currentlySelected = false;
            for (TripSeatResponse s : selectedSeats) {
                if (s.getId() == seat.getId()) {
                    currentlySelected = true;
                    break;
                }
            }

            if (!currentlySelected && ("booked".equals(seat.getStatus()) || "pending".equals(seat.getStatus()))) {
                Toast.makeText(context, "Ghế này đã được đặt hoặc đang giữ", Toast.LENGTH_SHORT).show();
                return;
            }

            if (currentlySelected) {
                selectedSeats.removeIf(s -> s.getId() == seat.getId());
                if (listener != null) listener.onSeatDeselected(seat);
            } else {
                if (selectedSeats.size() >= 4) {
                    Toast.makeText(context, "Chỉ được chọn tối đa 4 ghế", Toast.LENGTH_SHORT).show();
                    return;
                }
                selectedSeats.add(seat);
                if (listener != null) listener.onSeatSelected(seat);
            }
            notifyItemChanged(position);
            
            if (listener != null) {
                listener.onSelectionChanged(selectedSeats);
            }
        });
    }

    @Override
    public int getItemCount() {
        return seatList == null ? 0 : seatList.size();
    }

    static class SeatViewHolder extends RecyclerView.ViewHolder {
        MaterialCardView cardSeat;
        TextView tvSeatNumber;

        public SeatViewHolder(@NonNull View itemView) {
            super(itemView);
            cardSeat = itemView.findViewById(R.id.cardSeat);
            tvSeatNumber = itemView.findViewById(R.id.tvSeatNumber);
        }
    }
}
