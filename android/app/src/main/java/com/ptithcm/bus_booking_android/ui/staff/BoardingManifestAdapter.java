package com.ptithcm.bus_booking_android.ui.staff;

import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import androidx.core.content.ContextCompat;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.model.UserTicketsResponse;

import java.util.List;

public class BoardingManifestAdapter extends RecyclerView.Adapter<BoardingManifestAdapter.ViewHolder> {

    private List<UserTicketsResponse> ticketList;

    public BoardingManifestAdapter(List<UserTicketsResponse> ticketList) {
        this.ticketList = ticketList;
    }

    public void updateData(List<UserTicketsResponse> newList) {
        this.ticketList = newList;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View v = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_boarding_passenger, parent, false);
        return new ViewHolder(v);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        UserTicketsResponse ticket = ticketList.get(position);

        holder.tvPassengerName.setText(ticket.getPassengerName() != null ? ticket.getPassengerName() : "Không có tên");
        holder.tvPassengerPhone.setText(ticket.getPassengerPhone() != null ? ticket.getPassengerPhone() : "—");
        
        if (ticket.getSeat() != null && ticket.getSeat().getSeatNumber() != null) {
            holder.tvSeatNumber.setText(ticket.getSeat().getSeatNumber());
        } else {
            holder.tvSeatNumber.setText("—");
        }

        String status = ticket.getStatus();
        holder.tvStatusBadge.setBackgroundResource(R.drawable.bg_checked_banner);
        
        if ("used".equals(status)) {
            holder.tvStatusBadge.setText("Đã lên xe");
            holder.tvStatusBadge.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_success_text));
            holder.tvStatusBadge.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_success_bg)));
        } else if ("cancelled".equals(status)) {
            holder.tvStatusBadge.setText("Đã hủy");
            holder.tvStatusBadge.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_error_text));
            holder.tvStatusBadge.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_error_bg)));
        } else {
            holder.tvStatusBadge.setText("Chưa lên xe");
            holder.tvStatusBadge.setTextColor(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_warning_text));
            holder.tvStatusBadge.setBackgroundTintList(ColorStateList.valueOf(ContextCompat.getColor(holder.itemView.getContext(), R.color.status_warning_bg)));
        }

        holder.btnCall.setOnClickListener(v -> {
            String phone = ticket.getPassengerPhone();
            if (phone != null && !phone.isEmpty()) {
                Intent intent = new Intent(Intent.ACTION_DIAL);
                intent.setData(Uri.parse("tel:" + phone));
                holder.itemView.getContext().startActivity(intent);
            }
        });
    }

    @Override
    public int getItemCount() {
        return ticketList != null ? ticketList.size() : 0;
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvSeatNumber, tvPassengerName, tvPassengerPhone, tvStatusBadge;
        ImageView btnCall;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvSeatNumber = itemView.findViewById(R.id.tvSeatNumber);
            tvPassengerName = itemView.findViewById(R.id.tvPassengerName);
            tvPassengerPhone = itemView.findViewById(R.id.tvPassengerPhone);
            tvStatusBadge = itemView.findViewById(R.id.tvStatusBadge);
            btnCall = itemView.findViewById(R.id.btnCall);
        }
    }
}
