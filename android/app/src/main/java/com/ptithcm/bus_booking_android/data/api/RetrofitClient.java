package com.ptithcm.bus_booking_android.data.api;

import android.content.Context;
import android.content.SharedPreferences;

import okhttp3.Cookie;
import okhttp3.CookieJar;
import okhttp3.HttpUrl;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class RetrofitClient {

    // Đối với máy ảo Android Studio (Emulator), IP 10.0.2.2 sẽ trỏ về localhost của máy tính
    private static final String BASE_URL = "http://192.168.1.6:3000/api/";
    private static Retrofit retrofit;
    private static final HashMap<String, List<Cookie>> cookieStore = new HashMap<>();

    public static Retrofit getClient(Context context) {

        if (retrofit == null) {

            CookieJar cookieJar = new CookieJar() {
                @Override
                public void saveFromResponse(HttpUrl url, List<Cookie> cookies) {
                    cookieStore.put(url.host(), cookies);
                }

                @Override
                public List<Cookie> loadForRequest(HttpUrl url) {
                    List<Cookie> cookies = cookieStore.get(url.host());
                    return cookies != null ? cookies : new ArrayList<>();
                }
            };

            Interceptor authInterceptor = new Interceptor() {
                @Override
                public Response intercept(Chain chain) throws IOException {
                    Request originalRequest = chain.request();

                    String path = originalRequest.url().encodedPath();

                    if (path.contains("/api/auth/")) {
                        return chain.proceed(originalRequest);
                    }

                    SharedPreferences prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE);
                    String accessToken = prefs.getString("access_token", null);

                    if (accessToken != null && !accessToken.isEmpty()) {
                        Request newRequest = originalRequest.newBuilder()
                                .header("Authorization", "Bearer " + accessToken)
                                .build();
                        return chain.proceed(newRequest);
                    }

                    return chain.proceed(originalRequest);
                }
            };

            // Thêm Logging Interceptor để xem request/response JSON
            HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
            loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

            Interceptor errorInterceptor = new Interceptor() {
                @Override
                public Response intercept(Chain chain) throws IOException {
                    Request request = chain.request();
                    Response response = chain.proceed(request);
                    if (response.code() == 401 || response.code() == 403) {
                        // Token hết hạn hoặc không hợp lệ, đăng xuất ngay
                        SharedPreferences prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE);
                        prefs.edit().remove("access_token").apply();

                        android.content.Intent intent = new android.content.Intent(context, com.ptithcm.bus_booking_android.ui.auth.LoginActivity.class);
                        intent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        context.startActivity(intent);
                    }
                    return response;
                }
            };

            OkHttpClient client = new OkHttpClient.Builder()
                    .cookieJar(cookieJar)
                    .addInterceptor(authInterceptor)
                    .addInterceptor(loggingInterceptor)
                    .addInterceptor(errorInterceptor)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }

        return retrofit;
    }
}