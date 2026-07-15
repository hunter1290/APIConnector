package com.joveo.apiconnector.usage;

import com.joveo.apiconnector.usage.dto.AccountUsageResponse;
import com.joveo.apiconnector.usage.dto.RecordUsageRequest;
import com.joveo.apiconnector.user.User;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** AI-token usage endpoints for the authenticated account. */
@RestController
@RequestMapping("/api/usage")
@Tag(name = "Usage")
public class UsageController {

    private final UsageService usageService;

    public UsageController(UsageService usageService) {
        this.usageService = usageService;
    }

    /** The caller's own AI-token position (allotment / used / remaining + per-workspace). */
    @GetMapping("/me")
    public AccountUsageResponse myUsage(@AuthenticationPrincipal User user) {
        return usageService.accountUsage(user);
    }

    /** Records an AI-token consumption event for the caller and returns the updated position. */
    @PostMapping
    public ResponseEntity<AccountUsageResponse> record(@AuthenticationPrincipal User user,
                                                       @Valid @RequestBody RecordUsageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usageService.record(user, request));
    }
}
