package com.altern.common;

import com.altern.auth.AuthenticationFailedException;
import com.altern.auth.UserAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import java.util.HashMap;
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
    @ExceptionHandler(TestCaseNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleTestCaseNotFound(TestCaseNotFoundException ex) {
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
    
    @ExceptionHandler(InvalidSubmissionStatusException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidSubmissionStatus(InvalidSubmissionStatusException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleAuthenticationFailed(AuthenticationFailedException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(ProblemDeletionNotAllowedException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleProblemDeletionNotAllowed(ProblemDeletionNotAllowedException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(WorkspaceComparisonNotAllowedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleWorkspaceComparisonNotAllowed(WorkspaceComparisonNotAllowedException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(UserProfileNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleUserProfileNotFound(UserProfileNotFoundException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(ExecutionEnvironmentUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleExecutionEnvironmentUnavailable(ExecutionEnvironmentUnavailableException ex) {
        return new ErrorResponse(ex.getMessage());
    }

    @ExceptionHandler(SubmissionRetryNotAllowedException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleSubmissionRetryNotAllowed(SubmissionRetryNotAllowedException ex) {
        return new ErrorResponse(ex.getMessage());
    }
    
}
