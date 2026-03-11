package com.altern.auth;

public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String username) {
        super("Username is already taken: " + username);
    }
}
