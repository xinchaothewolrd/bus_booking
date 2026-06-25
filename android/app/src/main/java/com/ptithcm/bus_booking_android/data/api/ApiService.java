package com.ptithcm.bus_booking_android.data.api;

import com.ptithcm.bus_booking_android.data.model.LoginRequest;
import com.ptithcm.bus_booking_android.data.model.LoginResponse;
import com.ptithcm.bus_booking_android.data.model.SignupRequest;
import com.ptithcm.bus_booking_android.data.model.RouteResponse;
import com.ptithcm.bus_booking_android.data.model.TripSearchResponse;
import com.ptithcm.bus_booking_android.data.model.TripSeatResponse;
import com.ptithcm.bus_booking_android.data.model.BusTypeResponse;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.Query;
import retrofit2.http.PUT;
import retrofit2.http.Path;
import com.ptithcm.bus_booking_android.data.model.RouteStopResponse;

public interface ApiService {
    
    @POST("auth/signin")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/signup")
    Call<Void> register(@Body SignupRequest request);

    @GET("routes")
    Call<List<RouteResponse>> getRoutes();

    @GET("route-stops")
    Call<List<RouteStopResponse>> getRouteStops(@Query("routeId") int routeId);

    @GET("trips/search")
    Call<List<TripSearchResponse>> searchTrips(
            @Query("from") String from,
            @Query("to") String to,
            @Query("date") String date
    );

    @GET("trips")
    Call<List<com.ptithcm.bus_booking_android.data.model.StaffTripResponse>> getAllTrips();

    @GET("trip-seats/trip/{tripId}")
    Call<List<TripSeatResponse>> getSeatsByTripId(@retrofit2.http.Path("tripId") int tripId);

    @GET("users/me")
    Call<com.ptithcm.bus_booking_android.data.model.UserResponse> getProfile();

    @PUT("users/me")
    Call<com.ptithcm.bus_booking_android.data.model.UserResponse> updateMyProfile(@Body com.ptithcm.bus_booking_android.data.model.UserUpdateRequest request);

    @GET("bus-types")
    Call<List<BusTypeResponse>> getBusTypes();

    @POST("bookings")
    Call<com.ptithcm.bus_booking_android.data.model.BookingResponse> createBooking(@Body com.ptithcm.bus_booking_android.data.model.BookingRequest request);

    @POST("payments/create_url")
    Call<com.ptithcm.bus_booking_android.data.model.PaymentUrlResponse> createPaymentUrl(@Body com.ptithcm.bus_booking_android.data.model.PaymentUrlRequest request);

    @PATCH("trip-seats/lock")
    Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> lockSeats(@Body com.ptithcm.bus_booking_android.data.model.SeatLockRequest request);

    @PATCH("trip-seats/release")
    Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> releaseSeats(@Body com.ptithcm.bus_booking_android.data.model.SeatLockRequest request);

    @GET("tickets/user/{userId}")
    Call<List<com.ptithcm.bus_booking_android.data.model.UserTicketsResponse>> getUserTickets(@Path("userId") int userId);

    @POST("bookings/{bookingId}/cancel")
    Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> cancelBooking(@Path("bookingId") int bookingId);

    // ─── STAFF ENDPOINTS ────────────────────────────────────────────────────────
    @GET("tickets/check/{qrCode}")
    Call<com.ptithcm.bus_booking_android.data.model.TicketCheckResponse> checkTicketByQr(@Path("qrCode") String qrCode);

    @GET("tickets/trip/{tripId}")
    Call<List<com.ptithcm.bus_booking_android.data.model.UserTicketsResponse>> getTicketsByTrip(@Path("tripId") int tripId);

    @PATCH("tickets/{id}/checkin")
    Call<com.ptithcm.bus_booking_android.data.model.MessageResponse> checkInTicket(@Path("id") int ticketId);
}
