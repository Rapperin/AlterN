package com.altern.common;

public class SubmissionNotFoundException extends RuntimeException {
    
    public SubmissionNotFoundException(Long id) {
        super("Submission not found with id: " + id);
    }
    
}