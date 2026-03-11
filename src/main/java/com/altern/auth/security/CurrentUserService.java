package com.altern.auth.security;

import com.altern.auth.entity.UserAccount;
import com.altern.auth.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserAccountRepository userAccountRepository;

    public UserAccount requireCurrentUser() {
        return findCurrentUser().orElseThrow(() -> new AuthenticationCredentialsNotFoundException("Authentication required."));
    }

    public Optional<UserAccount> findCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUserPrincipal principal)) {
            return Optional.empty();
        }

        return userAccountRepository.findById(principal.id());
    }

    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.getPrincipal() instanceof AuthenticatedUserPrincipal principal
                && principal.role() != null
                && principal.role().name().equals("ADMIN");
    }
}
