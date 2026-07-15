package com.joveo.apiconnector.admin;

import com.joveo.apiconnector.admin.dto.AccountSummaryResponse;
import com.joveo.apiconnector.admin.dto.AdminWorkspaceResponse;
import com.joveo.apiconnector.admin.dto.ChangePlanRequest;
import com.joveo.apiconnector.admin.dto.PlatformUsageResponse;
import com.joveo.apiconnector.admin.dto.SetEnabledRequest;
import com.joveo.apiconnector.usage.dto.AccountUsageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only monitoring + management API. Every endpoint requires ROLE_ADMIN (enforced here
 * via {@link PreAuthorize} and again in the security filter chain).
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /** Platform-wide rollup: accounts, workspaces, APIs, and total token consumption. */
    @GetMapping("/usage/summary")
    public PlatformUsageResponse platformSummary() {
        return adminService.platformSummary();
    }

    /** Every monitored account with its AI-token position and resource counts. */
    @GetMapping("/accounts")
    public List<AccountSummaryResponse> accounts() {
        return adminService.listAccounts();
    }

    /** One account's detailed token position, including per-workspace breakdown. */
    @GetMapping("/accounts/{id}")
    public AccountUsageResponse account(@PathVariable Long id) {
        return adminService.accountDetail(id);
    }

    /** Every workspace across all accounts, with owner and token consumption. */
    @GetMapping("/workspaces")
    public List<AdminWorkspaceResponse> workspaces() {
        return adminService.listWorkspaces();
    }

    /** Changes a normal account's subscription plan. Only an admin can call this. */
    @PatchMapping("/accounts/{id}/plan")
    public AccountSummaryResponse changePlan(@PathVariable Long id, @Valid @RequestBody ChangePlanRequest request) {
        return adminService.changePlan(id, request.plan());
    }

    /** Enables or disables a normal account's login access. Only an admin can call this. */
    @PatchMapping("/accounts/{id}/enabled")
    public AccountSummaryResponse setEnabled(@PathVariable Long id, @Valid @RequestBody SetEnabledRequest request) {
        return adminService.setEnabled(id, request.enabled());
    }
}
