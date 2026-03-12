package com.altern.common;

public class UserProfileNotFoundException extends RuntimeException {

    public UserProfileNotFoundException(String username) {
        super("Public profile not found for username: " + username);
    }
}
