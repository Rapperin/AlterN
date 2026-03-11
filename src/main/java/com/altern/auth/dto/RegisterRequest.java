package com.altern.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {

    @NotBlank
    @Size(min = 3, max = 30)
    @Pattern(regexp = "^[a-zA-Z0-9_-]+$", message = "username can only contain letters, digits, underscore, and dash")
    private String username;

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;
}
