package com.altern.common;

public class InvalidProgrammingLanguageException extends RuntimeException {
    
    public InvalidProgrammingLanguageException(String language) {
        super("Invalid programming language: " + language);
    }
}