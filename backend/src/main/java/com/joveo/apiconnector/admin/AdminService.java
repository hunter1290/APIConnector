package com.joveo.apiconnector.admin;

import com.joveo.apiconnector.admin.dto.AccountSummaryResponse;
import com.joveo.apiconnector.admin.dto.AdminWorkspaceResponse;
import com.joveo.apiconnector.admin.dto.PlatformUsageResponse;
import com.joveo.apiconnector.api.ApiDetailRepository;
import com.joveo.apiconnector.common.exception.ResourceNotFoundException;
import com.joveo.apiconnector.usage.UsageService;
import com.joveo.apiconnector.usage.dto.AccountUsageResponse;
import com.joveo.apiconnector.user.Role;
import com.joveo.apiconnector.user.User;
import com.joveo.apiconnector.user.UserPlan;
import com.joveo.apiconnector.user.UserRepository;
import com.joveo.apiconnector.workspace.WorkspaceRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Platform-wide views for ADMIN accounts (every monitored account, its workspaces, and
 * AI-token consumption — all aggregation delegated to {@link UsageService} so the numbers
 * match the per-account API), plus the one admin-only mutation: changing a normal account's plan.
 */
@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final ApiDetailRepository apiDetailRepository;
    private final UsageService usageService;

    public AdminService(UserRepository userRepository,
                        WorkspaceRepository workspaceRepository,
                        ApiDetailRepository apiDetailRepository,
                        UsageService usageService) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.apiDetailRepository = apiDetailRepository;
        this.usageService = usageService;
    }

    /** Changes a normal (USER) account's plan. Admin accounts carry no plan and can't be targeted. */
    public AccountSummaryResponse changePlan(Long accountId, UserPlan plan) {
        User account = userRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));
        if (account.getRole() != Role.USER) {
            throw new IllegalArgumentException("Only normal (USER) accounts have a plan");
        }
        account.setPlan(plan);
        userRepository.save(account);
        return toSummary(account);
    }

    /** Every normal (USER) account with its token position and resource counts. */
    @Transactional(readOnly = true)
    public List<AccountSummaryResponse> listAccounts() {
        return userRepository.findByRoleOrderByIdAsc(Role.USER).stream()
                .map(this::toSummary)
                .toList();
    }

    /** One account's full token position, including the per-workspace breakdown. */
    @Transactional(readOnly = true)
    public AccountUsageResponse accountDetail(Long accountId) {
        User account = userRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));
        return usageService.accountUsage(account);
    }

    /** Every workspace across all accounts, with owner and token consumption. */
    @Transactional(readOnly = true)
    public List<AdminWorkspaceResponse> listWorkspaces() {
        return workspaceRepository.findAllByOrderByIdAsc().stream()
                .map(w -> new AdminWorkspaceResponse(
                        w.getId(),
                        w.getName(),
                        w.getUser().getId(),
                        w.getUser().getEmail(),
                        apiDetailRepository.countByWorkspaceId(w.getId()),
                        usageService.tokensUsedByWorkspace(w.getId())))
                .toList();
    }

    /** Platform-wide rollup across all monitored accounts. */
    @Transactional(readOnly = true)
    public PlatformUsageResponse platformSummary() {
        List<User> accounts = userRepository.findByRoleOrderByIdAsc(Role.USER);
        long totalAllotment = accounts.stream()
                .mapToLong(u -> UserPlan.freeTokensFor(u.getPlan()))
                .sum();
        long totalUsed = usageService.totalTokensUsed();
        return new PlatformUsageResponse(
                accounts.size(),
                workspaceRepository.count(),
                apiDetailRepository.count(),
                totalAllotment,
                totalUsed,
                Math.max(0, totalAllotment - totalUsed));
    }

    private AccountSummaryResponse toSummary(User user) {
        long allotment = UserPlan.freeTokensFor(user.getPlan());
        long used = usageService.tokensUsedByAccount(user.getId());
        return new AccountSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPlan() != null ? user.getPlan().name() : null,
                workspaceRepository.countByUserId(user.getId()),
                apiDetailRepository.countByUserId(user.getId()),
                allotment,
                used,
                Math.max(0, allotment - used));
    }
}
