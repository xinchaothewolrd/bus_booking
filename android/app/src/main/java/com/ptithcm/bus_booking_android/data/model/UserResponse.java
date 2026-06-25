package com.ptithcm.bus_booking_android.data.model;

public class UserResponse {
    private UserData user;

    public UserData getUser() {
        return user;
    }

    public static class UserData {
        private int id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private String status;

        public int getId() { return id; }
        public String getFullName() { return fullName; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
        public String getRole() { return role; }
        public String getStatus() { return status; }
    }
}
