package com.altern.auth.service;

import com.altern.auth.AuthenticationFailedException;
import com.altern.auth.UserAlreadyExistsException;
import com.altern.auth.dto.AuthResponse;
import com.altern.auth.dto.CurrentUserResponse;
import com.altern.auth.dto.LoginRequest;
import com.altern.auth.dto.RegisterRequest;
import com.altern.auth.entity.UserAccount;
import com.altern.auth.entity.UserRole;
import com.altern.auth.repository.UserAccountRepository;
import com.altern.auth.security.CurrentUserService;
import com.altern.auth.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CurrentUserService currentUserService;

    public AuthResponse register(RegisterRequest request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase();
        if (userAccountRepository.existsByUsername(normalizedUsername)) {
            throw new UserAlreadyExistsException(normalizedUsername);
        }

        UserAccount user = new UserAccount();
        user.setUsername(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.USER);
        user.setCreatedAt(LocalDateTime.now());
        user = userAccountRepository.save(user);

        return toAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String normalizedUsername = request.getUsername().trim().toLowerCase();

        UserAccount user = userAccountRepository.findByUsername(normalizedUsername)
                .filter(account -> passwordEncoder.matches(request.getPassword(), account.getPasswordHash()))
                .orElseThrow(AuthenticationFailedException::new);

        return toAuthResponse(user);
    }

    public CurrentUserResponse currentUser() {
        UserAccount user = currentUserService.requireCurrentUser();
        return new CurrentUserResponse(user.getId(), user.getUsername(), user.getRole().name());
    }

    private AuthResponse toAuthResponse(UserAccount user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(user.getId(), user.getUsername(), user.getRole().name(), token);
    }
}
