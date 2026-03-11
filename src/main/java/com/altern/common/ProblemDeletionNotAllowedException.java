package com.altern.common;

public class ProblemDeletionNotAllowedException extends RuntimeException {

    public ProblemDeletionNotAllowedException(Long id) {
        super("Problem cannot be deleted while submissions exist for id: " + id);
    }
}
