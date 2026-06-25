package com.ptithcm.bus_booking_android.ui.seat;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.ptithcm.bus_booking_android.R;
import com.ptithcm.bus_booking_android.data.model.RouteStopResponse;

import java.util.ArrayList;
import java.util.List;

public class RouteStopAdapter extends RecyclerView.Adapter<RouteStopAdapter.ViewHolder> {
    private List<RouteStopResponse> stopList = new ArrayList<>();
    private OnStopClickListener listener;

    public interface OnStopClickListener {
        void onStopClick(RouteStopResponse stop);
    }

    public void setStopList(List<RouteStopResponse> stopList) {
        this.stopList = stopList;
        notifyDataSetChanged();
    }

    public void setOnStopClickListener(OnStopClickListener listener) {
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_route_stop, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        RouteStopResponse stop = stopList.get(position);
        holder.tvStopName.setText(stop.getStopName());
        holder.tvStopAddress.setText(stop.getAddress());

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onStopClick(stop);
            }
        });
    }

    @Override
    public int getItemCount() {
        return stopList != null ? stopList.size() : 0;
    }

    public static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvStopName;
        TextView tvStopAddress;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvStopName = itemView.findViewById(R.id.tvStopName);
            tvStopAddress = itemView.findViewById(R.id.tvStopAddress);
        }
    }
}
