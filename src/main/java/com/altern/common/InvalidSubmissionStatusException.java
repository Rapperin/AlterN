package com.altern.common;

public class InvalidSubmissionStatusException extends RuntimeException {
    
    public InvalidSubmissionStatusException(String status) {
        super("Invalid submission status: " + status);
    }
}