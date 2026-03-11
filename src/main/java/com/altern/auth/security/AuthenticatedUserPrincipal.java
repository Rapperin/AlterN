package com.altern.auth.security;

import com.altern.auth.entity.UserRole;

public record AuthenticatedUserPrincipal(Long id, String username, UserRole role) {
}
