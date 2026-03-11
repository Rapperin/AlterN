package com.altern.auth;

public class AuthenticationFailedException extends RuntimeException {

    public AuthenticationFailedException() {
        super("Invalid username or password.");
    }
}
