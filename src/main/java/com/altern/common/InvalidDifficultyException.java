package com.altern.common;

public class InvalidDifficultyException extends RuntimeException {
    
    public InvalidDifficultyException(String difficulty) {
        super("Invalid difficulty: " + difficulty);
    }
}