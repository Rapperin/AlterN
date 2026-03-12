package com.altern.common;

public class SubmissionRetryNotAllowedException extends RuntimeException {

    public SubmissionRetryNotAllowedException(String message) {
        super(message);
    }
}
