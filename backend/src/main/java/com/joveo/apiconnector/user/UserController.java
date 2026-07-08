package com.joveo.apiconnector.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoints for the currently authenticated user. */
@RestController
@RequestMapping("/api/users")
public class UserController {

    /** Returns the profile of the authenticated caller (resolved from the JWT). */
    @GetMapping("/me")
    public UserProfileResponse me(@AuthenticationPrincipal User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole().name());
    }

    public record UserProfileResponse(Long id, String email, String fullName, String role) {
    }
}
