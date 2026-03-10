package com.altern.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.HashMap;
import java.util.Map;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ProblemNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleProblemNotFound(ProblemNotFoundException ex) {
        return new ErrorResponse(ex.getMessage());
    }
    @ExceptionHandler(SubmissionNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleSubmissionNotFound(SubmissionNotFoundException ex) {
        return new ErrorResponse(ex.getMessage());
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );
        
        return errors;
    }
    @ExceptionHandler(InvalidDifficultyException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidDifficulty(InvalidDifficultyException ex) {
        return new ErrorResponse(ex.getMessage());
    }
    @ExceptionHandler(InvalidProgrammingLanguageException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidProgrammingLanguage(InvalidProgrammingLanguageException ex) {
        return new ErrorResponse(ex.getMessage());
    }
    
}