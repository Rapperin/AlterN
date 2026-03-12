package com.altern.profile.controller;

import com.altern.profile.dto.UserProfileResponse;
import com.altern.profile.service.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @Operation(summary = "Get public user profile", description = "Returns the public profile summary for a ranked AlterN user.")
    @GetMapping("/api/users/{username}/profile")
    public UserProfileResponse getPublicProfile(@PathVariable String username) {
        return userProfileService.getPublicProfile(username);
    }
}
