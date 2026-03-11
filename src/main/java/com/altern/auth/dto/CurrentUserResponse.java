package com.altern.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CurrentUserResponse {

    private Long userId;
    private String username;
    private String role;
}
